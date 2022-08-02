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
        this.errorTypes = [
            { id: 0, hex: [0x00], value: 'SUCCESS' },
            { id: 1, hex: [0x01], value: 'ERROR INVALID OP CODE' },
            { id: 2, hex: [0x02], value: 'ERROR INVALID MEASUREMENT TYPE' },
            { id: 3, hex: [0x03], value: 'ERROR NOT SUPPORTED' },
            { id: 4, hex: [0x04], value: 'ERROR INVALID LENGTH' },
            { id: 5, hex: [0x05], value: 'ERROR INVALID PARAMETER' },
            { id: 6, hex: [0x06], value: 'ERROR ALREADY IN STATE' },
            { id: 7, hex: [0x07], value: 'ERROR INVALID RESOLUTION' },
            { id: 8, hex: [0x08], value: 'ERROR INVALID SAMPLE RATE' },
            { id: 9, hex: [0x09], value: 'ERROR INVALID RANGE' },
            { id: 10, hex: [0x0A], value: 'ERROR INVALID MTU' },
            { id: 11, hex: [0x0B], value: 'ERROR INVALID NUMBER OF CHANNELS' },
            { id: 12, hex: [0x0C], value: 'ERROR INVALID STATE' },
            { id: 13, hex: [0x0D], value: 'ERROR DEVICE IN CHARGER' },]
        this.measTypes = [
            { id: 1, hex: [0x01], value: 'PPG', name: 'photoplethysmogram', unit: 'NA', sample_rate: [28, 44, 135, 176], resolution: [16], range: [2, 4, 8], channels: [3] },
            { id: 2, hex: [0x02], value: 'Acc', name: 'accelerometer', unit: 'g', sample_rate: [26, 52, 104, 208, 416], resolution: [16], range: [2, 4, 8], channels: [3] },
            { id: 3, hex: [0x03], value: 'PPI', name: 'pp interval', unit: 's' },
            { id: 5, hex: [0x05], value: 'Gyr', name: 'gyroscope', unit: 'degrees/s', sample_rate: [26, 52, 104, 208, 416], resolution: [16], range: [2, 4, 8], channels: [3] },
            { id: 6, hex: [0x06], value: 'Mag', name: 'magnetometer', unit: 'G', sample_rate: [26, 52, 104, 208, 416], resolution: [16], range: [2, 4, 8], channels: [3] },
            { id: 9, hex: [0x09], value: 'SDK', name: 'SDK', unit: 'NA' },];
        this.frameTypes = [
            { id: 128, hex: [0x80], value: 'DELTA FRAME' }
        ];
        this.opCodes = [
            { id: 1, hex: [0x01], value: 'get_measurement_settings' },
            { id: 2, hex: [0x02], value: 'start_measurement' },
            { id: 3, hex: [0x03], value: 'stop_measurement' },

        ];
        this.controlCodes = [
            { id: 15, hex: [0x0F], value: 'control_point_read' },
            { id: 240, hex: [0xF0], value: 'control_point_response' },
        ];
        this.settingTypes = [
            { id: 0, hex: [0x00], value: 'sample_rate' },
            { id: 1, hex: [0x01], value: 'resolution' },
            { id: 2, hex: [0x02], value: 'range' },
            { id: 4, hex: [0x04], value: 'channels' },
        ]
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
                let measValue = this.measTypes.find(item => item.id === measId).value;
                console.log(`> request sent to ${action} type ${measValue}`);
                let val;
                switch (action) {
                    case 'get_measurement_settings':
                        val = this.getMeasSettingsCommand(measId, action);
                        break;
                    case 'start_measurement':
                        val = this.getMeasStartCommand(measId, action, settings);
                        break;
                    case 'stop_measurement':
                        val = this.getMeasStopCommand(measId, action);
                        break;
                    default:
                        val = this.getMeasSettingsCommand(measId, action);
                }
                characteristic.writeValueWithResponse(val);
            })
    }

    getMeasSettingsCommand(measId, action) {
        let commandArray = Array(2);
        commandArray[0] = this.opCodes.find(item => item.value === action).hex;
        commandArray[1] = this.measTypes.find(item => item.id === measId).hex;
        return new Uint8Array(commandArray);
    }

    getMeasStartCommand(measId, action, settings) {
        // [opCode, streamType, settingType1, len1, val1, val1, settingType2, len2, val2, val2, ...]
        let commandArray, commandView;
        if (measId == 9) {
            commandArray = new ArrayBuffer(2);
            commandView = new DataView(commandArray);
            commandView.setUint8(0, this.opCodes.find(item => item.value === action).hex);
            commandView.setUint8(1, this.measTypes.find(item => item.id === measId).hex);
        } else {
            commandArray = new ArrayBuffer(17);
            commandView = new DataView(commandArray);
            commandView.setUint8(0, this.opCodes.find(item => item.value === action).hex);
            commandView.setUint8(1, this.measTypes.find(item => item.id === measId).hex);
            commandView.setUint8(2, this.settingTypes.find(item => item.value === 'sample_rate').hex);
            commandView.setUint8(3, 0x01);
            commandView.setUint16(4, settings[0], true);
            commandView.setUint8(6, this.settingTypes.find(item => item.value === 'resolution').hex);
            commandView.setUint8(7, 0x01);
            commandView.setUint16(8, settings[1], true);
            commandView.setUint8(10, this.settingTypes.find(item => item.value === 'range').hex);
            commandView.setUint8(11, 0x01);
            commandView.setUint16(12, settings[2], true);
            commandView.setUint8(14, this.settingTypes.find(item => item.value === 'channels').hex);
            commandView.setUint8(15, 0x01);
            commandView.setUint8(16, settings[3], true);
        }
        let sendCommandHex = byteArrayToHexString(commandView);
        console.log(`>> request: ${sendCommandHex}`);
        let sendCommand = new Uint8Array(commandView.buffer);
        return sendCommand;
    }

    getMeasStopCommand(measId, action) {
        // [opCode, streamType]
        let commandArray = Array(2);
        commandArray[0] = this.opCodes.find(item => item.value === action).hex;
        commandArray[1] = this.measTypes.find(item => item.id === measId).hex;
        return new Uint8Array(commandArray);
    }

    /* FUNCTIONS TO READ COMMANDS FROM DATA CHARACTERISTIC*/

    parseIMUData(event) {
        let value = event.target.value;
        value = value.buffer ? value : new DataView(value); // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
        let valueHexString = byteArrayToHexString(value);
        let measurementType = imuDevice.measTypes.find(item => item.id === value.getUint8(0)).value;
        let frameType = imuDevice.frameTypes.find(item => item.id === value.getUint8(9)).value;
        console.log(`> ${measurementType} ${frameType} data received: ${valueHexString}`)

        if (measurementType == 'Acc') {
            //let refSampleSize = this.settings.resolution/8 * this.settings.channels; //define settings properti on constructor
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

    /* FUNCTIONS TO READ COMMANDS FROM CONTROL CHARACTERISTIC*/
    parseControlResponse(event) {
        let value = event.target.value;
        value = value.buffer ? value : new DataView(value); // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
        let valueHexString = byteArrayToHexString(value);
        let controlPoint = value.getUint8(0);
        let controlAction = imuDevice.controlCodes.find(item => item.id === controlPoint).value;
        console.log(`> response to ${controlAction}: ${valueHexString}`)
        if (controlAction == 'control_point_read') {
            let servicesAvailable = decIntTobinString(value.getUint8(1));
            [...servicesAvailable].slice().reverse().forEach(function (binary, measId) {
                let measurementAvailable = parseInt(binary);
                let measurement = imuDevice.measTypes.find(item => item.id === measId);
                if (measurement === undefined) {
                    console.log('>> measurement index unknown');
                    return;
                }
                if (measurementAvailable) {
                    console.log(`>> measurement type ${measurement.value} available. subscribe to 0x0${measurement.hex}`);
                } else {
                    console.log(`>> measurement type ${measurement.value} not available. so sorry.`);
                }
            })
        } else if (controlAction == 'control_point_response') {
            let opCode = imuDevice.opCodes.find(item => item.id === value.getUint8(1)).value;
            let measType = imuDevice.measTypes.find(item => item.id === value.getUint8(2)).value;
            let errorType = imuDevice.errorTypes.find(item => item.id === value.getUint8(3)).value;
            console.log(`>> status of ${measType} request ${opCode}: ${errorType} `);
            if (opCode == 'get_measurement_settings' && errorType == 'SUCCESS') {
                let index = 5;
                let setting, settingSize;
                console.log(imuDevice.measTypes.find(item => item.value === measType));
                do {
                    let settingValues = [];
                    setting = imuDevice.settingTypes.find(item => item.id === value.getUint8(index)).value;
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
                    imuDevice.measTypes.find(item => item.value === measType)[setting] = settingValues;
                    console.log(`>> measurement setting: ${setting} | number of values: ${settingSize} | values: ${settingValues}`)
                    console.log(imuDevice.measTypes.find(item => item.value === measType));
                    index += (2 + /*slide to next setting*/(settingSize * 2));
                }
                while (index < value.byteLength);
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