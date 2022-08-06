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
            1: { value: 'PPG', name: 'photoplethysmogram', unit: 'NA', sample_rate: [28, 44, 135, 176], resolution: [16] },
            2: { value: 'Acc', name: 'accelerometer', unit: 'g', sample_rate: [26, 52, 104, 208, 416], resolution: [16], range: [2, 4, 8], channels: [3] },
            3: { value: 'PPI', name: 'pp interval', unit: 's' },
            5: { value: 'Gyr', name: 'gyroscope', unit: 'degrees/s', sample_rate: [26, 52, 104, 208, 416], resolution: [16], range: [2, 4, 8], channels: [3] },
            6: { value: 'Mag', name: 'magnetometer', unit: 'G', sample_rate: [26, 52, 104, 208, 416], resolution: [16], range: [2, 4, 8], channels: [3] },
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
            optionalServices: [this.serviceUUID],
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

    onDisconnected(event) {
        let device = event.target;
        console.log('"' + device.name + '" bluetooth device disconnected');
        showToast("Connection to IMU lost. Try again.", "IMU device");
        updateDisconnectedIMUUI();
        // imuDevice.reset();
        // resetMeasurements(false, true, false);
        // drawChartTreadmill();
    }

    disconnect() {
        if (this.device == null) {
            console.log('The target device is null.');
            return;
        }
        this.device.removeEventListener('gattserverdisconnected', this.onDisconnected);
        this.device.gatt.disconnect();
        updateDisconnectedIMUUI();
        // this.reset();
        // resetMeasurements(false, true, false);
        // drawChartTreadmill();
    }

    reset() {

    }

    /* FUNCTIONS TO SEND COMMANDS TO CONTROL CHARACTERISTIC*/

    sendCommand(measId, action, settings) {
        let server = this.server;
        server.getPrimaryService(this.serviceUUID)
            .then(service => {
                return service.getCharacteristic(this.controlChUUID);
            })
            .then(characteristic => {
                let measValue = imuDevice.measTypes[measId].value;
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
        commandArray[0] = actionId; //how to access key from value??
        commandArray[1] = measId;;
        return new Uint8Array(commandArray);
    }

    getMeasStartCommand(measId, actionId, settings) {
        // [opCode, streamType, settingType1, len1, val1, val1, settingType2, len2, val2, val2, ...]
        let commandArray, commandView;
        if (measId == 9) {
            commandArray = new ArrayBuffer(2);
            commandView = new DataView(commandArray);
            commandView.setUint8(0, actionId);
            commandView.setUint8(1, measId);
        } else {
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
        if ((measurementType == 'Acc' || measurementType == 'Gyr' || measurementType == 'Mag') && frameType == 'delta_frame') {

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
        // if (dataType == 2) {
        //     //accelerometer
        //     frame_type = value.getUint8(8);
        //     resolution = (frame_type + 1) * 8;
        //     step = resolution / 8;
        //     if (frame_type == 1) {
        //         samples = new Int16Array(value.slice(10,))
        //         npoints = samples.byteLength / 2;
        //         ACC = createArray(npoints, 3);
        //         for (offset = 0; offset < npoints; offset += 3) { i = offset / 3; ACC[0][i] = samples[offset]; ACC[1][i] = samples[offset + 1]; ACC[2][i] = samples[offset + 2]; }
        //         ACCtime = fillTimeArray(dataType, devicename, data.slice(1, 9), dataTime, ACC[0].length, acc_timestep);
        //         for (i = 0; i < ACC[0].length; i++) { ACC[3][i] = Math.round(Math.sqrt(ACC[0][i] ** 2 + ACC[1][i] ** 2 + ACC[2][i] ** 2)) }
        //     } else {
        //         //if 128 frame type
        //         updateacc = true;
        //         ACC = completeDeltaFrame(data, 3, 2); //3 channels, 2 bytes (16bit)
        //         ACCtime = fillTimeArray(dataType, devicename, data.slice(1, 9), dataTime, ACC[0].length, (1000 / acc2_rate));
        //         ACC.push([])
        //         for (i = 0; i < ACC[0].length; i++) { ACC[3][i] = Math.round(Math.sqrt(ACC[0][i] ** 2 + ACC[1][i] ** 2 + ACC[2][i] ** 2) / 16); }
        //     }
        // }

        // if (dataType == 0) {
        //     //ECG
        //     samples = new Uint8Array(data.slice(10,))
        //     npoints = samples.byteLength / 3; ECGdata = createArray(npoints);
        //     for (offset = 0; offset < samples.byteLength; offset += 3) { i = offset / 3; ECGdata[i] = WordstoSignedInteger(samples.slice(offset, offset + 2), 8); }
        //     ECGtime = fillTimeArray(dataType, devicename, data.slice(1, 9), dataTime, npoints, ecg_timestep);
        //     pushData(['ECG'], ECGtime, [ECGdata]);
        //     resolution = (layoutCombined.yaxis2.range[1] - layoutCombined.yaxis2.range[0]) / (document.getElementById("Combined").clientHeight - 100);
        //     Reduce(dataobject, 'ECG', 'ECG_reduced', resolution)
        //     detectQRS(dataobject)
        //     updatecombined = true;
        //     //traces.ECG.x.push(...ECGtime);traces.ECG.y.push(...ECGdata);
        //     //Plotly.newPlot('ECGgraph', [traces.ECG], layoutECG);     
        // }
        // if (dataType == 1) {
        //     //PPG
        //     PPGsum = []; PPGsumfilter = [];
        //     NewPPG = completeDeltaFrame(data, 4, 3);//4 channels
        //     npoints = NewPPG[0].length;
        //     for (i = 0; i < npoints; i++) { PPGsum[i] = NewPPG[0][i] + NewPPG[1][i] + NewPPG[2][i] }
        //     PPGtime = fillTimeArray(dataType, devicename, data.slice(1, 9), dataTime, npoints, 1000 / samplerate);
        //     //console.log(1000/samplerate,a)
        //     PPGsumfilter = HPfilter(PPGsum, last_incom, last_filter)
        //     last_filter = PPGsumfilter.slice(-1)[0]; last_incom = PPGsum.slice(-1)[0]
        //     // ... is the spread operator which turns arrays into values
        //     //if(time>(intime+duration)){intime=time;traces.PPGsum.x=[];traces.PPGsum.y=[];}
        //     //traces['PPG0'].x.push(...PPGtime); traces['PPG0'].y.push(...NewPPG[0]);
        //     //traces['PPG1'].x.push(...PPGtime); traces['PPG1'].y.push(...NewPPG[1]);   
        //     //traces['PPG2'].x.push(...PPGtime); traces['PPG2'].y.push(...NewPPG[2]);
        //     //traces['PPG3'].x.push(...PPGtime); traces['PPG3'].y.push(...NewPPG[3]);
        //     pushData(['PPGsum'], PPGtime, [PPGsumfilter]);
        //     //traces.PPGsum.x.push(...PPGtime); traces.PPGsum.y.push(...PPGsumfilter);
        //     //layoutPPG.xaxis={range:[intime,intime+duration]};
        //     //toplot=[traces.PPGsum]//[traces['PPG0'],traces['PPG1'], traces['PPG2'],traces['PPG3'],traces.PPGsum]
        //     //layoutPPG.yaxis.range=[-yscale,yscale];
        //     //Plotly.newPlot('PPGgraph', toplot, layoutPPG);

        //     smoothPPG(dataobject, [0.025, 0.04, 0.07, 0.13, 0.2, 0.22, 0.2, 0.13, 0.07, 0.04, 0.025])
        //     //smoothPPG(dataobject,[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1])
        //     //linearReduce(dataobject,'PPGsum_f','PPG_f_reduced',(yscale*2)/50)
        //     resolution = (layoutCombined.yaxis.range[1] - layoutCombined.yaxis.range[0]) / document.getElementById("Combined").clientHeight;
        //     Reduce(dataobject, 'PPGsum_f', 'PPG_f_reduced', resolution);
        //     ratePPG(dataobject)
        //     Reduce(dataobject, 'PPGrate', 'PPGrate_reduced', resolution);
        //     detectPPGpeak(dataobject);
        //     updatecombined = true;
        // }


        // let result = {};
        // let index_speed = 2;
        // result.speed = Number(value.getUint16(index_speed, /*littleEndian=*/true) / 100).toFixed(1);
        // let index_inclination = 9;
        // result.inclination = Number(value.getInt16(index_inclination, /*littleEndian=*/true) / 10).toFixed(1);
        // let index_distance = 6;
        // result.distance = ((value.getUint16(index_distance, true)) << 8) + value.getUint8(2 + index_distance, true);
        // let index_time = 14;
        // let seconds = value.getUint16(index_time, /*littleEndian=*/true);
        // result.duration = seconds * 1000;
        // result.prettyDuration = new Date(seconds * 1000).toISOString().slice(11, 19);
        // result.time = Date.now();
        // console.log(`timestamp: ${result.time} | Treadmill: ${result.speed}km/h | ${result.inclination}% | ${result.distance}m | ${result.prettyDuration}`)
        // updateTreadmillUI(result);
        // startLoopUpdate();
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
            let measType = imuDevice.measTypes[value.getUint8(2)].value;
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
                    imuDevice.measTypes[value.getUint8(2)][setting] = settingValues;
                    console.log(`>> measurement setting: ${setting} | number of values: ${settingSize} | values: ${settingValues}`)
                    index += (2 + /*slide to next setting*/(settingSize * 2));
                };
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