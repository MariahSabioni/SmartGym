/*
Documentation: https://github.com/polarofficial/polar-ble-sdk/blob/master/technical_documentation/Polar_Measurement_Data_Specification.pdf
Code example:
*/

class ImuDevice {

    constructor() {
        this.device = null;
        this.server = null;
        this.serviceUUID = "fb005c80-02e7-f387-1cad-8acd2d8df0c8";
        //characteristics
        this.dataChUUID = "fb005c82-02e7-f387-1cad-8acd2d8df0c8";
        this.controlChUUID = "fb005c81-02e7-f387-1cad-8acd2d8df0c8";
        this.streamTypes = [, "PPG", "Acc", "PPI", , "Gyr", "Mag",];
        this.streams = [
            { id: 1, name: 'PPG', type: "photoplethysmogram", code_settings: [0x01, 0x01], code_start: [0x02, 0x01, 0x00, 0x01, 0x34, 0x00, 0x01, 0x01, 0x10, 0x00, 0x02, 0x01, 0x08, 0x00, 0x04, 0x01, 0x03], code_stop: [0x03, 0x01] },
            { id: 2, name: 'Acc', type: "accelerometer", code_settings: [0x01, 0x02], code_start: [0x02, 0x02, 0x00, 0x01, 0x34, 0x00, 0x01, 0x01, 0x10, 0x00, 0x02, 0x01, 0x08, 0x00, 0x04, 0x01, 0x03], code_stop: [0x03, 0x02] },
            { id: 3, name: 'PPI', type: "pp interval", code_settings: [0x01, 0x03], code_start: [0x02, 0x03, 0x00, 0x01, 0x34, 0x00, 0x01, 0x01, 0x10, 0x00, 0x02, 0x01, 0x08, 0x00, 0x04, 0x01, 0x03], code_stop: [0x03, 0x03] },
            { id: 5, name: 'Gyr', type: "gyroscope", code_settings: [0x01, 0x05], code_start: [0x02, 0x05, 0x00, 0x01, 0x34, 0x00, 0x01, 0x01, 0x10, 0x00, 0x02, 0x01, 0x08, 0x00, 0x04, 0x01, 0x03], code_stop: [0x03, 0x05] },
            { id: 6, name: 'Mag', type: "magnetometer", code_settings: [0x01, 0x06], code_start: [0x02, 0x06, 0x00, 0x01, 0x34, 0x00, 0x01, 0x01, 0x10, 0x00, 0x02, 0x01, 0x08, 0x00, 0x04, 0x01, 0x03], code_stop: [0x03, 0x06] },

        ];
    }

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
                        //updateDisconnectedTreadmillUI();
                    }
                }
            })
            .then(server => {
                console.log('connection successfull');
                this.server = server;
                return server.getPrimaryService(this.serviceUUID);
            })
            .then(service => {
                this.findControlCharacteristic(service);
                this.findDataCharacteristic(service);
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

    requestStreamSettings(streamId) {
        let stream = this.streams.find(item => item.id === streamId);
        let server = this.server;
        server.getPrimaryService(this.serviceUUID)
            .then(service => {
                return service.getCharacteristic(this.controlChUUID);
            })
            .then(characteristic => {
                // characteristic.writeValue(new Uint8Array(stream.code_start));
                characteristic.writeValueWithResponse(new Uint8Array(stream.code_settings));
            })
    }

    requestStreamStart(streamId) {
        let stream = this.streams.find(item => item.id === streamId);
        let server = this.server;
        server.getPrimaryService(this.serviceUUID)
            .then(service => {
                return service.getCharacteristic(this.controlChUUID);
            })
            .then(characteristic => {
                characteristic.writeValue(new Uint8Array(stream.code_start));
            })
    }

    requestStreamStop(streamId) {
        let stream = this.streams.find(item => item.id === streamId);
        let server = this.server;
        server.getPrimaryService(this.serviceUUID)
            .then(service => {
                return service.getCharacteristic(this.controlChUUID);
            })
            .then(characteristic => {
                characteristic.writeValue(new Uint8Array(stream.code_stop));
            })
    }

    findControlCharacteristic(service) {
        service.getCharacteristic(this.controlChUUID)
            .then(characteristic => {
                console.log('characteristic found: ', characteristic);
                return Promise.all([
                    characteristic.readValue(),
                    characteristic.startNotifications()
                        .then(characteristic => {
                            characteristic.addEventListener('characteristicvaluechanged', this.printControlResponse);
                        }),
                ]);
            })
            .catch(error => {
                console.log(error);
            });
    }

    printControlResponse(event) {
        let value = event.target.value;
        value = value.buffer ? value : new DataView(value); // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
        console.log("control response: ", value);
    }

    onDisconnected(event) {
        let device = event.target;
        console.log('"' + device.name + '" bluetooth device disconnected');
        showToast("Connection to IMU lost. Try again.", "IMU device");
        // updateDisconnectedTreadmillUI();
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
        // updateDisconnectedTreadmillUI();
        // this.reset();
        // resetMeasurements(false, true, false);
        // drawChartTreadmill();
    }

    reset() {
        this.device = null;
        this.server = null;
        this.serviceUUID = "fb005c80-02e7-f387-1cad-8acd2d8df0c8";
        //characteristics
        this.dataChUUID = "fb005c82-02e7-f387-1cad-8acd2d8df0c8";
        this.controlChUUID = "fb005c81-02e7-f387-1cad-8acd2d8df0c8";
        this.streamTypes = ["ECG", "PPG", "Acc", "PPInt", , "Gyro", "Magn",];
        this.streams = [
            { name: 'ECG', code_settings: [0x01, 0x00], id: 0, type: "electrocardiogram", code_start: [0x00, 0x01, 0x82, 0x00, 0x01, 0x01, 0x0E, 0x00] },
            { name: 'PPG', code_settings: [0x01, 0x01], id: 1, type: "photoplethysmogram", code_start: [0x02, 0x01, 0x00, 0x01, 0x34, 0x00, 0x01, 0x01, 0x10, 0x00, 0x02, 0x01, 0x08, 0x00, 0x04, 0x01, 0x03] },
            { name: 'Acc', code_settings: [0x01, 0x02], id: 2, type: "accelerometer", code_start: [0x02, 0x02, 0x00, 0x01, 0x34, 0x00, 0x01, 0x01, 0x10, 0x00, 0x02, 0x01, 0x08, 0x00, 0x04, 0x01, 0x03] },
        ];
    }

    /* Utils */
    dec2bin(dec) {
        return (dec >>> 0).toString(2);
    }
    parseIMUData(event) {
        let value = event.target.value;
        value = value.buffer ? value : new DataView(value); // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
        let measurementType = value.getUint8(2);
        let errorCode = value.getUint8(3);
        var dataType = value.getUint8(0);
        console.log("data type: ", dataType);
        console.log("data: ", value);

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
    getDeviceName() {
        return this.device.name;
    }
}