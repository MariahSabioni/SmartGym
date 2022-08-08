/*
Documentation: https://github.com/polarofficial/polar-ble-sdk/blob/master/technical_documentation/Polar_Measurement_Data_Specification.pdf
Code example: https://webbluetoothcg.github.io/web-bluetooth/#dom-bluetoothremotegattcharacteristic-readvalue
*/

class ImuDevice {

    constructor() {
        this.device = null;
        this.server = null;
        //services
        this.serviceUUID = "fb005c80-02e7-f387-1cad-8acd2d8df0c8";
        //characteristics
        this.dataChUUID = "fb005c82-02e7-f387-1cad-8acd2d8df0c8";
        this.controlChUUID = "fb005c81-02e7-f387-1cad-8acd2d8df0c8";
        this.errorTypes = {
            0: 'SUCCESS',
            1: 'ERROR INVALID OP CODE',
            2: 'ERROR INVALID MEASUREMENT TYPE',
            3: 'ERROR NOT SUPPORTED',
            4: 'ERROR INVALID LENGTH',
            5: 'ERROR INVALID PARAMETER',
            6: 'ERROR ALREADY IN STATE',
            7: 'ERROR INVALID RESOLUTION',
            8: 'ERROR INVALID SAMPLE RATE',
            9: 'ERROR INVALID RANGE',
            10: 'ERROR INVALID MTU',
            11: 'ERROR INVALID NUMBER OF CHANNELS',
            12: 'ERROR INVALID STATE',
            13: 'ERROR DEVICE IN CHARGER'
        }
        this.measTypes = {
            1: { value: 'PPG', name: 'photoplethysmogram', unit: 'NA', sample_rate: [135], resolution: [22], range: ['N/A'], channels: [4] },
            2: { value: 'Acc', name: 'accelerometer', unit: 'g', sample_rate: [52], resolution: [16], range: [8], channels: [3] },
            3: { value: 'PPI', name: 'pp interval', unit: 's' },
            5: { value: 'Gyr', name: 'gyroscope', unit: 'degrees/s', sample_rate: [52], resolution: [16], range: [2000], channels: [3] },
            6: { value: 'Mag', name: 'magnetometer', unit: 'G', sample_rate: [50], resolution: [16], range: [50], channels: [3] },
            9: { value: 'SDK', name: 'SDK', unit: 'NA' },
        };
        this.frameTypes = {
            128: 'delta_frame'
        };
        this.opCodes = {
            1: 'get_measurement_settings',
            2: 'start_measurement',
            3: 'stop_measurement',
        };
        this.controlCodes = {
            15: 'control_point_read',
            240: 'control_point_response',
        };
        this.settingTypes = {
            0: 'sample_rate',
            1: 'resolution',
            2: 'range',
            4: 'channels',
        };
        this.currentSetting = {
            sample_rate: 52,
            resolution: 16,
            range: 8,
            channels: 3,
        }
    }

    /* FUNCTIONS TO HANDLE CONNECTION*/

    connect() {
        return navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "Polar Sense" }],
            optionalServices: [this.serviceUUID, 'heart_rate'],
        })
            .then(device => {
                this.device = device;
                device.addEventListener('gattserverdisconnected', this.onDisconnected);
                let tries = 0;
                try {
                    return device.gatt.connect();
                } catch (e) {
                    tries++;
                    if (tries <= 3) {
                        console.log('attempting to connect');
                        setTimeout(function () {
                            connect();
                        }, 1000);
                    } else {
                        console.log('could not connect');
                        showToast("Connection to IMU failed. Try again.", "IMU device");
                        updateDisconnectedIMUUI();
                    }
                }
            })
            .then(server => {
                console.log('connection successfull');
                this.server = server;
                return server.getPrimaryService(this.serviceUUID);
            })
            .then(service => {
                return Promise.all([
                    this.findControlCharacteristic(service),
                    this.findDataCharacteristic(service),
                ]);
            });
    }

    findControlCharacteristic(service) {
        service.getCharacteristic(this.controlChUUID)
            .then(characteristic => {
                console.log('characteristic found: ', characteristic);
                return Promise.all([
                    characteristic.readValue(),
                    characteristic.startNotifications()
                        .then(characteristic => {
                            characteristic.addEventListener('characteristicvaluechanged', this.parseControlResponse);
                        }),
                ]);
            })
            .catch(error => {
                console.log(error);
            });
    }

    findDataCharacteristic(service) {
        service.getCharacteristic(this.dataChUUID)
            .then(characteristic => {
                console.log('characteristic found: ', characteristic);
                return characteristic.startNotifications();
            })
            .then(characteristic => {
                characteristic.addEventListener('characteristicvaluechanged', this.parseIMUData);
            })
            .catch(error => {
                console.log(error);
            });
    }

    findHeartRateCharacteristic() {
        let server = this.server;
        return server.getPrimaryService('heart_rate')
            .then(service => {
                service.getCharacteristic('heart_rate_measurement')
                    .then(characteristic => {
                        console.log('characteristic found: ', characteristic);
                        return characteristic.startNotifications();
                    })
                    .then(characteristic => {
                        characteristic.addEventListener('characteristicvaluechanged', this.parseHeartRate);
                        console.log('> start notifications for HR');
                    })
                    .catch(error => {
                        console.log(error);
                    });
            });
    }

    stopHeartRateCharacteristic() {
        let server = this.server;
        return server.getPrimaryService('heart_rate')
            .then(service => {
                service.getCharacteristic('heart_rate_measurement')
                    .then(characteristic => {
                        return characteristic.stopNotifications()
                    })
                    .then(characteristic => {
                        characteristic.removeEventListener('characteristicvaluechanged', this.parseHeartRate);
                        console.log('> stop notifications for HR');
                    })
                    .catch(error => {
                        console.log(error);
                    });
            });
    }

    onDisconnected(event) {
        let device = event.target;
        console.log('"' + device.name + '" bluetooth device disconnected');
        showToast("Connection to IMU lost. Try again.", "IMU device");
        updateDisconnectedIMUUI();
        // resetMeasurements(false, true, false);
        // drawChartImu();
    }

    disconnect() {
        if (this.device == null) {
            console.log('The target device is null.');
            return;
        }
        this.device.removeEventListener('gattserverdisconnected', this.onDisconnected);
        this.device.gatt.disconnect();
        updateDisconnectedIMUUI();
        // resetMeasurements(false, true, false);
        // drawChartImu();
    }

    reset() {

    }

    /* FUNCTIONS TO SEND COMMANDS TO CONTROL CHARACTERISTIC*/

    sendCommand(measValue, action, settings) {
        let server = this.server;
        let measId = getKeyByPropValue(this.measTypes, measValue, 'value');
        server.getPrimaryService(this.serviceUUID)
            .then(service => {
                return service.getCharacteristic(this.controlChUUID);
            })
            .then(characteristic => {
                //let measValue = imuDevice.measTypes[measId].value;
                let actionId = getKeyByValue(imuDevice.opCodes, action);
                console.log(`> request sent to ${action} type ${measValue}`);
                let val;
                switch (action) {
                    case 'get_measurement_settings':
                        val = this.getMeasSettingsCommand(measId, actionId);
                        break;
                    case 'start_measurement':
                        val = this.getMeasStartCommand(measId, actionId, settings);
                        break;
                    case 'stop_measurement':
                        val = this.getMeasStopCommand(measId, actionId);
                        break;
                    default:
                        val = this.getMeasSettingsCommand(measId, actionId);
                }
                characteristic.writeValueWithResponse(val);
            })
    }

    getMeasSettingsCommand(measId, actionId) {
        let commandArray = Array(2);
        commandArray[0] = actionId;
        commandArray[1] = measId;;
        return new Uint8Array(commandArray);
    }

    getMeasStartCommand(measId, actionId, settings) {
        // [opCode, streamType, settingType1, len1, val1, val1, settingType2, len2, val2, val2, ...]
        let commandArray, commandView;
        if (measId == 9) {
            //enable SDK
            commandArray = new ArrayBuffer(2);
            commandView = new DataView(commandArray);
            commandView.setUint8(0, actionId);
            commandView.setUint8(1, measId);
        } else if (measId == 1) {
            //PPG
            commandArray = new ArrayBuffer(13);
            commandView = new DataView(commandArray);
            commandView.setUint8(0, actionId);
            commandView.setUint8(1, measId);
            commandView.setUint8(2, getKeyByValue(imuDevice.settingTypes, 'sample_rate'));
            commandView.setUint8(3, 0x01);
            commandView.setUint16(4, settings[0], true);
            commandView.setUint8(6, getKeyByValue(imuDevice.settingTypes, 'resolution'));
            commandView.setUint8(7, 0x01);
            commandView.setUint16(8, settings[1], true);
            commandView.setUint8(10, getKeyByValue(imuDevice.settingTypes, 'channels'));
            commandView.setUint8(11, 0x01);
            commandView.setUint8(12, settings[3], true);
            imuDevice.currentSetting.sample_rate = settings[0];
            imuDevice.currentSetting.resolution = settings[1];
            imuDevice.currentSetting.range = null;
            imuDevice.currentSetting.channels = settings[3];
        }
        else {
            commandArray = new ArrayBuffer(17);
            commandView = new DataView(commandArray);
            commandView.setUint8(0, actionId);
            commandView.setUint8(1, measId);
            commandView.setUint8(2, getKeyByValue(imuDevice.settingTypes, 'sample_rate'));
            commandView.setUint8(3, 0x01);
            commandView.setUint16(4, settings[0], true);
            commandView.setUint8(6, getKeyByValue(imuDevice.settingTypes, 'resolution'));
            commandView.setUint8(7, 0x01);
            commandView.setUint16(8, settings[1], true);
            commandView.setUint8(10, getKeyByValue(imuDevice.settingTypes, 'range'));
            commandView.setUint8(11, 0x01);
            commandView.setUint16(12, settings[2], true);
            commandView.setUint8(14, getKeyByValue(imuDevice.settingTypes, 'channels'));
            commandView.setUint8(15, 0x01);
            commandView.setUint8(16, settings[3], true);
            imuDevice.currentSetting.sample_rate = settings[0];
            imuDevice.currentSetting.resolution = settings[1];
            imuDevice.currentSetting.range = settings[2];
            imuDevice.currentSetting.channels = settings[3];
        }
        let sendCommandHex = byteArrayToHexString(commandView);
        console.log(`>> request: ${sendCommandHex}`);
        let sendCommand = new Uint8Array(commandView.buffer);
        return sendCommand;
    }

    getMeasStopCommand(measId, actionId) {
        // [opCode, streamType]
        let commandArray = Array(2);
        commandArray[0] = actionId;
        commandArray[1] = measId;
        return new Uint8Array(commandArray);
    }

    /* FUNCTIONS TO READ RESPONSES FROM DATA CHARACTERISTIC*/

    parseIMUData(event) {
        let value = event.target.value;
        value = value.buffer ? value : new DataView(value); // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.

        let measurementType = imuDevice.measTypes[value.getUint8(0)].value;
        let timestamp = value.getBigUint64(1, true)
        let frameType = imuDevice.frameTypes[value.getUint8(9)];
        let frameSize = value.byteLength;
        console.log(`> ${measurementType} ${frameType} data received length: ${frameSize} bytes at timestamp: ${timestamp}`)

        let imuMeasurements = [];
        if ((measurementType == 'Acc' || measurementType == 'Gyr' || measurementType == 'Mag' || measurementType == 'PPG') && frameType == 'delta_frame') {

            let numOfChannels = imuDevice.currentSetting.channels;
            let refSampleSize = 2 * numOfChannels;
            // ref sample is always full bytes, not according to documentation but according to https://github.com/polarofficial/polar-ble-sdk/issues/187
            console.log(`>> refSampleSize: ${refSampleSize}`);
            let refSample = {
                timestamp: timestamp,
            }
            let refSampleStr = '>> refSample | timestamp: ' + refSample.timestamp;
            for (let i = 0; i < numOfChannels; i++) {
                let channel = 'channel_' + i;
                refSample[channel] = value.getUint16(10 + 2 * i, true);
                refSampleStr += ' | ' + channel + ': ' + refSample[channel];
            };
            console.log(refSampleStr);

            let offset = 10 + refSampleSize;
            let frameSampleIndex = 0;

            do {
                let deltaSize = value.getUint8(offset);
                let sampleCount = value.getUint8(offset + 1);
                let deltaBytesCount = Math.ceil((sampleCount * deltaSize) * numOfChannels / 8);
                console.log(`>> deltaSize: ${deltaSize} bits/value | sampleCount: ${sampleCount} samples | deltaBytesCount: ${deltaBytesCount} total bytes`);

                let indexDeltaStart = offset + 2;
                let indexDeltaStop = indexDeltaStart + deltaBytesCount;
                let deltaData = value.buffer.slice(indexDeltaStart, indexDeltaStop);
                let binDeltaData = bufferToBinString(deltaData);
                for (let i = 0; i < sampleCount; i++) {
                    let binSample = binDeltaData.slice(i);
                    let sample = {
                        id: frameSampleIndex,
                        timestamp: timestamp,
                    }
                    let sampleStr = '>> sample | timestamp: ' + sample.timestamp;
                    for (let j = 0; j < numOfChannels; j++) {
                        let channel = 'channel_' + j;
                        let channelSample = binSample.slice(j, deltaSize);
                        sample[channel] = parseInt(channelSample.split("").reverse().join(""), 2) + refSample[channel];
                        sampleStr += ' | ' + channel + ': ' + sample[channel];
                    };
                    console.log(sampleStr)
                    imuMeasurements.push(sample);
                    frameSampleIndex++;
                }
                offset = offset + 2 + deltaBytesCount;
            } while (offset < value.byteLength);

            return imuMeasurements;
        }

        // updateImuDataUI(result);
        // startLoopUpdate();
    }

    parseHeartRate(event) {
        let value = event.target.value;
        value = value.buffer ? value : new DataView(value); // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
        let flags = value.getUint8(0);
        let rate16Bits = flags & 0x1;
        let result = {};
        let index = 1;
        if (rate16Bits) {
            result.heartRate = value.getUint16(index, /*littleEndian=*/true);
            index += 2;
        } else {
            result.heartRate = value.getUint8(index);
            index += 1;
        }
        let contactDetected = flags & 0x2;
        let contactSensorPresent = flags & 0x4;
        if (contactSensorPresent) {
            result.contactDetected = !!contactDetected;
        }
        let energyPresent = flags & 0x8;
        if (energyPresent) {
            result.energyExpended = value.getUint16(index, /*littleEndian=*/true);
            index += 2;
        }
        let rrIntervalPresent = flags & 0x10;
        if (rrIntervalPresent) {
            let rrIntervals = [];
            for (; index + 1 < value.byteLength; index += 2) {
                rrIntervals.push(value.getUint16(index, /*littleEndian=*/true));
            }
            result.rrIntervals = rrIntervals;
        }
        result.time = Date.now();
        console.log(`>> sample | timestamp: ${result.time}| HR: ${result.heartRate}bpm`);
    }

    /* FUNCTIONS TO READ RESPONSES FROM CONTROL CHARACTERISTIC*/

    parseControlResponse(event) {
        let value = event.target.value;
        value = value.buffer ? value : new DataView(value); // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
        let valueHexString = byteArrayToHexString(value);
        let controlPoint = value.getUint8(0);
        let controlAction = imuDevice.controlCodes[controlPoint];
        console.log(`> response to ${controlAction}: ${valueHexString}`)
        if (controlAction == 'control_point_read') {
            let servicesAvailable = decIntToBinString(value.getUint8(1));
            [...servicesAvailable].slice().reverse().forEach(function (binary, measId) {
                let measurementAvailable = parseInt(binary);
                let measurement = imuDevice.measTypes[measId];
                if (measurement === undefined) {
                    console.log('>> measurement unknown. so sorry.');
                    return;
                }
                if (measurementAvailable) {
                    console.log(`>> measurement type ${measurement.value} available. subscribe to ${measId}.`);
                } else {
                    console.log(`>> measurement type ${measurement.value} not available. so sorry.`);
                }
            });
            updateIMUUI();
        } else if (controlAction == 'control_point_response') {
            let opCode = imuDevice.opCodes[value.getUint8(1)];
            let measId = value.getUint8(2);
            let measType = imuDevice.measTypes[measId].value;
            let errorType = imuDevice.errorTypes[value.getUint8(3)];
            console.log(`>> status of ${measType} request ${opCode}: ${errorType} `);
            if (opCode == 'get_measurement_settings' && errorType == 'SUCCESS') {
                let index = 5;
                let setting, settingSize;
                while (index < value.byteLength) {
                    let settingValues = [];
                    setting = imuDevice.settingTypes[value.getUint8(index)];
                    settingSize = value.getUint8(index + 1);
                    if (setting == 'channels') {
                        for (let i = 0; i < settingSize; i++) {
                            settingValues.push(value.getUint8(index + 2 + (i), true));
                            i += 1;
                        }
                    } else {
                        for (let i = 0; i < settingSize; i++) {
                            settingValues.push(value.getUint16(index + 2 + (2 * i), true));
                            i += 1;
                        }
                    }
                    imuDevice.measTypes[measId][setting] = settingValues;
                    console.log(`>> measurement setting: ${setting} | number of values: ${settingSize} | values: ${settingValues}`)
                    index += (2 + /*slide to next setting*/(settingSize * 2));
                };
                updateImuSettingsUI(measType, measId);
            }
        }
        else {
            console.log('> control response not recognized: ', valueHexString);
        }
    }

    /* UTILS */
    getDeviceName() {
        return this.device.name;
    }
}