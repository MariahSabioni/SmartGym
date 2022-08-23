/*
Documentation: https://www.concept2.co.uk/files/pdf/us/monitors/PM5_BluetoothSmartInterfaceDefinition.pdf
https://www.concept2.com/files/pdf/us/monitors/PM5_CSAFECommunicationDefinition.pdf
Code example: https://github.com/GoogleChromeLabs/rowing-monitor
Other references: https://www.c2forum.com/viewtopic.php?f=15&t=93321
*/

class Concept2pmDevice {

    constructor() {
        this.device = null;
        this.server = null;
        //services
        this.discoveryUUID = 'ce060000-43e5-11e4-916c-0800200c9a66'; //discovery service
        this.serviceUUID = "ce060030-43e5-11e4-916c-0800200c9a66"; //rowing service
        this.controlServiceUUID = "ce060020-43e5-11e4-916c-0800200c9a66";
        //characteristics
        this.dataChUUID = "ce060031-43e5-11e4-916c-0800200c9a66"; //general status characteristic
        this.addDataChUUID = "ce060032-43e5-11e4-916c-0800200c9a66"; //additional status characteristic
        this.addData2ChUUID = "ce060033-43e5-11e4-916c-0800200c9a66"; //additional status characteristic 2
        this.controlRequestChUUID = "ce060021-43e5-11e4-916c-0800200c9a66";
        this.controlResponseChUUID = "ce060022-43e5-11e4-916c-0800200c9a66";
    }

    static dataTypes = {
        general_status : "ce060031-43e5-11e4-916c-0800200c9a66",
        additional_status_1: "ce060032-43e5-11e4-916c-0800200c9a66",
        additional_status_2: "ce060033-43e5-11e4-916c-0800200c9a66",
    }

    /* FUNCTIONS TO HANDLE CONNECTION*/

    connect() {
        return navigator.bluetooth.requestDevice({
            filters: [{ services: [this.discoveryUUID] }],
            optionalServices: [this.serviceUUID, this.controlServiceUUID]
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
                        updateDisconnectedConcept2pm('failed_connection');
                    }
                }
            })
            .then(server => {
                console.log('> connection successfull to: ', this.device.name);
                this.server = server;
                server.getPrimaryService(this.controlServiceUUID)
                    .then(service => {
                        return Promise.all([
                            this.findControlRequestCharacteristic(service),
                            this.findControlResponseCharacteristic(service),
                        ]);
                    })
            })
            .then(() => {
                let server = this.server;
                server.getPrimaryService(this.serviceUUID)
                    .then(service => {
                        return Promise.all([
                            this.findDataCharacteristic(service),
                            this.findAddDataCharacteristic(service),
                            this.findAddData2Characteristic(service),
                        ]);
                    })
            })
    }

    findControlRequestCharacteristic(service) {
        service.getCharacteristic(this.controlRequestChUUID)
            .then(characteristic => {
                console.log(`> ${this.device.name} characteristic found: `, characteristic);
                let val = hexStringToByteArray('F10000F2');
                console.log(val)
                characteristic.writeValue(val);
            })
            .catch(error => {
                console.log(error);
            });
    }

    findControlResponseCharacteristic(service) {
        service.getCharacteristic(this.controlResponseChUUID)
            .then(characteristic => {
                console.log(`> ${this.device.name} characteristic found: `, characteristic);
                return characteristic.startNotifications();
            })
            .then(characteristic => {
                characteristic.addEventListener('characteristicvaluechanged', this.printControlResponse);
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
                let context = this;
                characteristic.addEventListener('characteristicvaluechanged', this.parseConcept2pmData);
            })
            .then(_ => {
                updateConnectedConcept2pm();
            })
            .catch(error => {
                console.log(error);
            });
    }

    findAddDataCharacteristic(service) {
        service.getCharacteristic(this.addDataChUUID)
            .then(characteristic => {
                console.log(`> ${this.device.name} characteristic found: `, characteristic);
                return characteristic.startNotifications();
            })
            .then(characteristic => {
                characteristic.addEventListener('characteristicvaluechanged', this.parseConcept2pmData);
            })
            .catch(error => {
                console.log(error);
            });
    }

    findAddData2Characteristic(service) {
        service.getCharacteristic(this.addData2ChUUID)
            .then(characteristic => {
                console.log(`> ${this.device.name} characteristic found: `, characteristic);
                return characteristic.startNotifications();
            })
            .then(characteristic => {
                characteristic.addEventListener('characteristicvaluechanged', this.parseConcept2pmData);
            })
            .catch(error => {
                console.log(error);
            });
    }

    onDisconnected(event) {
        let device = event.target;
        console.log(`> ${device.name} bluetooth device connection lost`);
        updateDisconnectedConcept2pm('lost_connection');
    }

    disconnect() {
        if (this.device == null) {
            console.log('The target device is null.');
            return;
        }
        this.device.removeEventListener('gattserverdisconnected', this.onDisconnected);
        this.device.gatt.disconnect();
        console.log(`> ${this.device.name} bluetooth device disconnected`);
        updateDisconnectedConcept2pm('disconnected');
    }

    /* FUNCTIONS TO SEND COMMANDS TO CONTROL CHARACTERISTIC*/

    resetConcept2pm() {
        let server = this.server;
        return server.getPrimaryService(this.controlServiceUUID)
            .then(service => {
                console.log(`> ${this.device.name} service found: `, service);
                return service.getCharacteristic(this.controlRequestChUUID);
            })
            .then(characteristic => {
                let val = hexStringToByteArray('F176041302010260F2');
                console.log('val', val);
                characteristic.writeValue(val);
                console.log(`> command sent to reset Concept2 PM`);
            })
            .catch(error => {
                console.log(error);
            });
    }

    startWorkoutConcept2pm(setDistance) {
        let server = this.server;
        return server.getPrimaryService(this.controlServiceUUID)
            .then(service => {
                console.log(`> ${this.device.name} service found: `, service);
                return service.getCharacteristic(this.controlRequestChUUID);
            })
            .then(characteristic => {
                console.log(setDistance);
                let distanceHex, checkSumInt = 0, checkSumHex, checkSumArray, val;
                switch (setDistance) {
                    case '0':
                        distanceHex = '03E8';
                        break;
                    case '1':
                        distanceHex = '07D0';
                        break;
                    case '2':
                        distanceHex = '1388';
                        break;
                    case '3':
                        distanceHex = '2710';
                        break;
                    default:
                        distanceHex = '07D0'; //default 2000m
                }
                // [F1 'DISTANCE WORKOUT COMMANDS' 'DISTANCE HEX COMMANDS' 'DISTANCE WORKOUT COMMANDS' 'CHECKSUM (COMMANDS ONLY)' 'F2']
                checkSumArray = hexStringToByteArray('76180101030305800000' + distanceHex + '0505800000019014010113020101');
                checkSumArray.forEach(element => checkSumInt = checkSumInt ^ element);
                checkSumHex = checkSumInt.toString(16);
                val = hexStringToByteArray('F1' + '76180101030305800000' + distanceHex + '0505800000019014010113020101' + checkSumHex + 'F2');
                characteristic.writeValue(val);
                console.log(`> command sent to set workout Concept2 PM: ${parseInt(distanceHex, 16)}`);
            })
            .catch(error => {
                console.log(error);
            });
    }

    /* FUNCTIONS TO READ RESPONSES FROM CONTROL CHARACTERISTIC*/

    printControlResponse(event) {
        let value = event.target.value;
        value = value.buffer ? value : new DataView(value); // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
        let response = byteArrayToHexString(value);
        console.log(`> response to control command received: ${response}`)
    }

    /* FUNCTIONS TO READ RESPONSES FROM DATA CHARACTERISTIC*/

    parseConcept2pmData(event){
        let type = getKeyByValue(Concept2pmDevice.dataTypes, event.target.uuid);
        let value = event.target.value;
        value = value.buffer ? value : new DataView(value); // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
        let result = {
            measurementType: type,
            time: Date.now(),
        }
        if (type == 'general_status') {
            result = {...result,
                elapsedTime: Number(((value.getUint8(0, true)) + ((value.getUint8(1 + 0, true)) << 8) + (value.getUint8(2 + 0, true) << 16)) * 0.01).toFixed(0),
                distance: Number(((value.getUint8(3, true)) + ((value.getUint8(1 + 3, true)) << 8) + (value.getUint8(2 + 3, true) << 16)) * 0.1).toFixed(2),
                workoutType: value.getUint8(6),
                intervalType: value.getUint8(7),
                workoutState: value.getUint8(8),
                rowingState: value.getUint8(9),
                strokeState: value.getUint8(10),
                totalWorkDistance: Number((value.getUint8(11, true)) + ((value.getUint8(1 + 11, true)) << 8) + (value.getUint8(2 + 11, true) << 16)).toFixed(0),
                workoutDuration: Number((value.getUint8(14, true)) + ((value.getUint8(1 + 14, true)) << 8) + (value.getUint8(2 + 14, true) << 16)).toFixed(0),
                workoutDurationType: value.getUint8(17),
                dragFactor: value.getUint8(18),
            }
            console.log('rowingState: ', result.rowingState);
            console.log(`>> sample | timestamp: ${result.time} | Rower: ${result.elapsedTime}s | ${result.distance}m | ${result.dragFactor}drag`)
        } else if (type == 'additional_status_1'){
            result = {...result,
                elapsedTime: Number(((value.getUint8(0, true)) + ((value.getUint8(1 + 0, true)) << 8) + (value.getUint8(2 + 0, true) << 16)) * 0.01).toFixed(0),
                speed: Number(value.getUint16(3, true) * 0.001).toFixed(2),
                strokeRate: value.getUint8(5),
                heartRate: value.getUint8(6),
                currentPace: value.getUint16(7, true) * 0.01,
                prettyCurrentPace: new Date(value.getUint16(7, true) * 0.01 * 1000).toISOString().slice(14, 19),
                averagePace: value.getUint16(9, true) * 0.01,
                prettyAveragePace: new Date(value.getUint16(9, true) * 0.01 * 1000).toISOString().slice(14, 19),
                restDistance: value.getUint16(11, true),
                restTime: Number((value.getUint8(13, true)) + ((value.getUint8(1 + 13, true)) << 8) + (value.getUint8(2 + 13, true) << 16) * 0.01).toFixed(0),
            }
            console.log(`>> sample | timestamp: ${result.time} | Rower: ${result.elapsedTime}s | ${result.speed}m/s | ${result.prettyCurrentPace}/500m | ${result.strokeRate}spm`)
        } else if (type == 'additional_status_2'){
            result = {...result,
                elapsedTime: Number(((value.getUint8(0, true)) + ((value.getUint8(1 + 0, true)) << 8) + (value.getUint8(2 + 0, true) << 16)) * 0.01).toFixed(0),
                intervalCount: value.getUint8(3),
                splitAveragePower: value.getUint16(4, true),
                totalCalories: value.getUint16(6, true),
                splitAveragePace: value.getUint16(8, true) * 0.01,
                prettysplitAveragePace: new Date(value.getUint16(8, true) * 0.01 * 1000).toISOString().slice(14, 19),
                splitAveragePower: value.getUint16(10, true),
                splitAverageCalories: value.getUint16(12, true),
                lastSplitTime: Number(((value.getUint8(14, true)) + ((value.getUint8(1 + 12, true)) << 8) + (value.getUint8(2 + 12, true) << 16))).toFixed(0),
                lastSplitDistance: Number(((value.getUint8(17, true)) + ((value.getUint8(1 + 15, true)) << 8) + (value.getUint8(2 + 15, true) << 16))).toFixed(0),
            }
            console.log(`>> sample | timestamp: ${result.time} | Rower: ${result.elapsedTime}s | ${result.totalCalories}cals | ${result.intervalCount}interval`)    
        }
        updateDataConcept2pm(type, result);
        startLoopUpdate();
    }

    /* UTILS */

    getDeviceName() {
        return this.device.name;
    }
}