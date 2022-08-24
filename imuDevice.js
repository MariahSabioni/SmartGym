/*
> Description:
This class constructs the bluetooth Polar Verity Sense device.
Different Polar devices follow different commands (see documentation), therefore will only work with Verity Sense.
> Documentation:
https://github.com/polarofficial/polar-ble-sdk/blob/master/technical_documentation/Polar_Measurement_Data_Specification.pdf
https://github.com/polarofficial/polar-ble-sdk/blob/master/technical_documentation/SdkModeExplained.md
> Code example:
https://webbluetoothcg.github.io/web-bluetooth/#dom-bluetoothremotegattcharacteristic-readvalue
> Other references:
Sensor timestamp: https://github.com/polarofficial/polar-ble-sdk/blob/master/technical_documentation/TimeSystemExplained.md
Reference sample (always full bytes, not per documentation but per issue):https://github.com/polarofficial/polar-ble-sdk/issues/187
*/

"use strict";
class ImuDevice {

    constructor() {
        this.device = null;
        this.server = null;
        //services
        this.serviceUUID = "fb005c80-02e7-f387-1cad-8acd2d8df0c8";
        this.hrServiceUUID = 'heart_rate';
        //characteristics
        this.hrDataChUUID = 'heart_rate_measurement';
        this.dataChUUID = "fb005c82-02e7-f387-1cad-8acd2d8df0c8";
        this.controlChUUID = "fb005c81-02e7-f387-1cad-8acd2d8df0c8";
        this.refTimeStamp = new Date('2000-01-01T00:00:00Z').getTime();
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
            0: { value: 'HR', name: 'heart rate', unit: 'bpm', channels: [1] },
            1: { value: 'PPG', name: 'photoplethysmogram', unit: 'NA', sample_rate: [135], resolution: [22], range: ['N/A'], channels: [4] },
            2: { value: 'Acc', name: 'accelerometer', unit: 'm/s^2', sample_rate: [52], resolution: [16], range: [8], channels: [3] }, // Acc is converted to m/s^2 in the parsing steps
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
            0: { channels: 1 },
            1: { sample_rate: 135, resolution: 22, range: 'N/A', channels: 4 },
            2: { sample_rate: 52, resolution: 16, range: 8, channels: 3 },
            5: { sample_rate: 52, resolution: 16, range: 2000, channels: 3 },
            6: { sample_rate: 50, resolution: 16, range: 50, channels: 3 },
        }
        this.imuStreamList = [];
        this.previousTimeStamps = {
            0: null,
            1: null,
            2: null,
            5: null,
            6: null,
        }
    }

    /* FUNCTIONS TO HANDLE CONNECTION*/

    connect() {
        return navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "Polar Sense" }],
            optionalServices: [this.serviceUUID, this.hrServiceUUID],
        })
            .then(device => {
                this.device = device;
                device.addEventListener('gattserverdisconnected', this.onDisconnected);
                let tries = 0;
                try {
                    return device.gatt.connect();
                } catch (e) {
                    tries++;
                    if (tries <= 5) {
                        console.log('> attempting to connect to', device.name);
                        setTimeout(function () {
                            connect();
                        }, 1000);
                    } else {
                        console.log('> could not connect to ', device.name);
                        updateDisconnectedIMU('failed_connection');
                    }
                }
            })
            .then(server => {
                console.log('> connection successfull to: ', this.device.name);
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
                console.log(`> ${this.device.name} characteristic found: `, characteristic);
                return Promise.all([
                    characteristic.readValue(),
                    characteristic.startNotifications()
                        .then(characteristic => {
                            characteristic.addEventListener('characteristicvaluechanged', this.parseControlResponse.bind(this));
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
                console.log(`> ${this.device.name} characteristic found: `, characteristic);
                return characteristic.startNotifications();
            })
            .then(characteristic => {
                characteristic.addEventListener('characteristicvaluechanged', this.parseIMUData.bind(this));
            })
            .catch(error => {
                console.log(error);
            });
    }

    findHeartRateCharacteristic() {
        let server = this.server;
        return server.getPrimaryService(this.hrServiceUUID)
            .then(service => {
                service.getCharacteristic(this.hrDataChUUID)
                    .then(characteristic => {
                        console.log(`> ${this.device.name} characteristic found: `, characteristic);
                        return characteristic.startNotifications();
                    })
                    .then(characteristic => {
                        characteristic.addEventListener('characteristicvaluechanged', this.parseHeartRate.bind(this));
                        let measId = 0;
                        let measType = this.measTypes[measId].value;
                        console.log(`> request sent to ${this.device.name} start notifications for ${measType}`);
                        this.imuStreamList.push(measType);
                        updateConnectedStreamIMU(measType, measId, this.measTypes[measId].channels);
                    })
                    .catch(error => {
                        console.log(error);
                    });
            });
    }

    stopHeartRateCharacteristic() {
        let server = this.server;
        return server.getPrimaryService(this.hrServiceUUID)
            .then(service => {
                service.getCharacteristic(this.hrDataChUUID)
                    .then(characteristic => {
                        return characteristic.stopNotifications()
                    })
                    .then(characteristic => {
                        characteristic.removeEventListener('characteristicvaluechanged', this.parseHeartRate.bind(this));
                        let measId = 0;
                        let measType = this.measTypes[measId].value;
                        console.log(`> request sent to ${this.device.name} stop notifications for ${measType}`);
                        this.imuStreamList = removeElement(this.imuStreamList, measType);
                        updateDisconnectedStreamIMU(measType, measId);
                    })
                    .catch(error => {
                        console.log(error);
                    });
            });
    }

    onDisconnected(event) {
        let device = event.target;
        console.log(`> ${device.name} bluetooth device connection lost`);
        showToast("Connection to IMU lost. Try again.", "IMU device");
        updateDisconnectedIMU('lost_connection');
    }

    disconnect() {
        if (this.device == null) {
            console.log('> The target device is null.');
            return;
        }
        this.device.removeEventListener('gattserverdisconnected', this.onDisconnected);
        this.device.gatt.disconnect();
        console.log(`> ${this.device.name} bluetooth device disconnected`);
        updateDisconnectedIMU('disconnected');
    }

    /* FUNCTIONS TO SEND COMMANDS TO CONTROL CHARACTERISTIC*/

    sendCommand(measType, action, settings) {
        let server = this.server;
        let measId = getKeyByPropValue(this.measTypes, measType, 'value');
        server.getPrimaryService(this.serviceUUID)
            .then(service => {
                return service.getCharacteristic(this.controlChUUID);
            })
            .then(characteristic => {
                let actionId = getKeyByValue(this.opCodes, action);
                console.log(`> request sent to ${action} type ${measType}`);
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
        let measType = this.measTypes[measId].value;
        if (measType == 'SDK') {
            //enable SDK
            commandArray = new ArrayBuffer(2);
            commandView = new DataView(commandArray);
            commandView.setUint8(0, actionId);
            commandView.setUint8(1, measId);
        } else if (measType == 'PPG') {
            //PPG
            commandArray = new ArrayBuffer(13);
            commandView = new DataView(commandArray);
            commandView.setUint8(0, actionId);
            commandView.setUint8(1, measId);
            commandView.setUint8(2, getKeyByValue(this.settingTypes, 'sample_rate'));
            commandView.setUint8(3, 0x01);
            commandView.setUint16(4, settings[0], true);
            commandView.setUint8(6, getKeyByValue(this.settingTypes, 'resolution'));
            commandView.setUint8(7, 0x01);
            commandView.setUint16(8, settings[1], true);
            commandView.setUint8(10, getKeyByValue(this.settingTypes, 'channels'));
            commandView.setUint8(11, 0x01);
            commandView.setUint8(12, settings[3], true);
            this.currentSetting[measId].sample_rate = settings[0];
            this.currentSetting[measId].resolution = settings[1];
            this.currentSetting[measId].range = null;
            this.currentSetting[measId].channels = settings[3];
        }
        else {
            //Acc, Gyro and Magn
            commandArray = new ArrayBuffer(17);
            commandView = new DataView(commandArray);
            commandView.setUint8(0, actionId);
            commandView.setUint8(1, measId);
            commandView.setUint8(2, getKeyByValue(this.settingTypes, 'sample_rate'));
            commandView.setUint8(3, 0x01);
            commandView.setUint16(4, settings[0], true);
            commandView.setUint8(6, getKeyByValue(this.settingTypes, 'resolution'));
            commandView.setUint8(7, 0x01);
            commandView.setUint16(8, settings[1], true);
            commandView.setUint8(10, getKeyByValue(this.settingTypes, 'range'));
            commandView.setUint8(11, 0x01);
            commandView.setUint16(12, settings[2], true);
            commandView.setUint8(14, getKeyByValue(this.settingTypes, 'channels'));
            commandView.setUint8(15, 0x01);
            commandView.setUint8(16, settings[3], true);
            this.currentSetting[measId].sample_rate = settings[0];
            this.currentSetting[measId].resolution = settings[1];
            this.currentSetting[measId].range = settings[2];
            this.currentSetting[measId].channels = settings[3];
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

        console.log('> response to data request | received hex:', byteArrayToHexString(value));
        let measId = value.getUint8(0);
        let measType = this.measTypes[measId].value;
        let timestamp = Math.round(Number(value.getBigUint64(1, true)) / 1000000);
        let frameType = this.frameTypes[value.getUint8(9)];
        let frameSize = value.byteLength;
        let sampleRate = this.currentSetting[measId].sample_rate;
        let range = this.currentSetting[measId].range;
        let resolution = this.currentSetting[measId].resolution;
        console.log(`> ${measType} ${frameType} length: ${frameSize} bytes at timestamp: ${timestamp}`)

        let results = [];
        if ((measType == 'Acc' || measType == 'Gyr' || measType == 'Mag' || measType == 'PPG') && frameType == 'delta_frame') {

            let numOfChannels = this.currentSetting[measId].channels;
            let refSampleSize = 2 * numOfChannels;
            console.log(`>> refSampleSize: ${refSampleSize}`);
            let refSample = {
                measurementType: measType,
                measurementId: measId,
                time: timestamp,
            }
            let refSampleStr = '>> refSample | timestamp: ' + refSample.time;
            for (let i = 0; i < numOfChannels; i++) {
                let channel = 'channel_' + i;
                refSample[channel] = value.getInt16(10 + 2 * i, true);
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
                let binDeltaData = bufferToReverseBinString(deltaData);
                for (let i = 0; i < sampleCount; i++) {
                    let binSample = binDeltaData.slice(i * numOfChannels * deltaSize);
                    let sample = {
                        measurementType: measType,
                        measurementId: measId,
                        sampleIndexOfDataPackage: frameSampleIndex,
                        time: timestamp,
                        sampleRate: sampleRate,
                        resolution: resolution,
                        range: range
                    }
                    let sampleStr = '>> sample | timestamp: ' + sample.time;
                    for (let j = 0; j < numOfChannels; j++) {
                        let channel = 'channel_' + j;
                        let channelSample = binSample.slice(j * deltaSize, (j + 1) * deltaSize).split("").reverse().join("");
                        let signedInt = bitStringToSignedInt(channelSample);
                        if (measType == 'Acc') {
                            sample[channel] = (signedInt + refSample[channel]) * 0.24399999 * 0.00980665;
                        } else {
                            sample[channel] = (signedInt + refSample[channel]);
                        }
                        sampleStr += ' | ' + channel + ': ' + sample[channel];
                    };
                    if (measType == 'Acc' || measType == 'Gyr') {
                        sample.combined = Math.sqrt(Math.pow(sample.channel_0, 2) + Math.pow(sample.channel_1, 2) + Math.pow(sample.channel_2, 2)) - (measType == 'Acc' ? 9.80665 : 0);
                        sampleStr += ' | combined: ' + sample.combined;
                    }
                    console.log(sampleStr);
                    results.push(sample);
                    frameSampleIndex++;
                }
                offset = offset + 2 + deltaBytesCount;
            } while (offset < value.byteLength);
        }
        // correct the timestamp. the frame contains a single timestamp which refers to the last sample
        if (this.previousTimeStamps[measId] == null) {
            // use sample rate if we don't have a previous timestamp
            results.forEach((sample, index, array) => {
                let timeCorrected = sample.time + (index - results.length + 1) * (1000 / (sampleRate)) + this.refTimeStamp;
                let source = { timeCorrected: timeCorrected };
                array[index] = Object.assign(sample, source);
            });
        } else {
            // distribute evenly the samples between 2 data frames using previous frame timestamp
            results.forEach((sample, index, array) => {
                let timeCorrected = this.previousTimeStamps[measId] + (index + 1) * ((sample.time - this.previousTimeStamps[measId]) / (results.length)) + this.refTimeStamp;
                let source = { timeCorrected: timeCorrected };
                array[index] = Object.assign(sample, source);
            });
        }
        updateDataIMU(results);
        this.previousTimeStamps[measId] = timestamp;
        startLoopUpdate();
    }

    parseHeartRate(event) {
        let value = event.target.value;
        value = value.buffer ? value : new DataView(value); // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
        let flags = value.getUint8(0);
        let rate16Bits = flags & 0x1;
        let result = {};
        let results = [];
        let index = 1;
        if (rate16Bits) {
            result.channel_0 = value.getUint16(index, /*littleEndian=*/true);
            index += 2;
        } else {
            result.channel_0 = value.getUint8(index);
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
        result.measurementType = 'HR';
        result.measurementId = 0;
        result.timeCorrected = result.time;
        console.log(`>> sample | timestamp: ${result.time}| HR: ${result.channel_0}bpm`);
        results.push(result);
        updateDataIMU(results);
        startLoopUpdate();
    }

    /* FUNCTIONS TO READ RESPONSES FROM CONTROL CHARACTERISTIC*/

    parseControlResponse(event) {
        let value = event.target.value;
        value = value.buffer ? value : new DataView(value); // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
        let valueHexString = byteArrayToHexString(value);
        let controlPoint = value.getUint8(0);
        let controlAction = this.controlCodes[controlPoint];
        console.log(`> response to ${controlAction}: ${valueHexString}`)
        if (controlAction == 'control_point_read') {
            let servicesAvailable = decIntToBinString(value.getUint8(1));
            [...servicesAvailable].slice().reverse().forEach((binary, measId) => {
                let measurementAvailable = parseInt(binary);
                let measurement = this.measTypes[measId];
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
            updateConnectedIMU();
        } else if (controlAction == 'control_point_response') {
            let opCode = this.opCodes[value.getUint8(1)];
            let measId = value.getUint8(2);
            let measType = this.measTypes[measId].value;
            let errorType = this.errorTypes[value.getUint8(3)];
            console.log(`>> status of ${measType} request ${opCode}: ${errorType} `);
            if (opCode == 'get_measurement_settings' && errorType == 'SUCCESS') {
                let index = 5;
                let setting, settingSize;
                while (index < value.byteLength) {
                    let settingValues = [];
                    setting = this.settingTypes[value.getUint8(index)];
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
                    this.measTypes[measId][setting] = settingValues;
                    console.log(`>> measurement setting: ${setting} | number of values: ${settingSize} | values: ${settingValues}`)
                    index += (2 + /*slide to next setting*/(settingSize * 2));
                };
                updateImuSettings(measType, measId);
            } else if (opCode == 'start_measurement' && errorType == 'SUCCESS' && measType != 'SDK') {
                this.imuStreamList.push(measType);
                updateConnectedStreamIMU(measType, measId, this.currentSetting[measId].channels);
            } else if (opCode == 'stop_measurement' && errorType == 'SUCCESS' && measType != 'SDK') {
                this.imuStreamList = removeElement(this.imuStreamList, measType);
                this.previousTimeStamps[measId] = null;
                updateDisconnectedStreamIMU(measType, measId);
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