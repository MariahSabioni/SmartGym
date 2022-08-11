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
                        console.log('attempting to connect');
                        setTimeout(function () {
                            connect();
                        }, 1000);
                    } else {
                        console.log('could not connect');
                        showToast("Connection to concept2-PM5 failed. Try again.", "Concept2-PM5 device");
                        updateDisconnectedConcept2pmUI();
                    }
                }
            })
            .then(server => {
                console.log('connection successfull');
                this.server = server;
                this.connectControlService();
                return server.getPrimaryService(this.serviceUUID);
            })
            .then(service => {
                this.findDataCharacteristic(service);
                this.findAddDataCharacteristic(service);
                this.findAddData2Characteristic(service);
            })
    }

    connectControlService() {
        let server = this.server;
        server.getPrimaryService(this.controlServiceUUID)
            .then(service => {
                console.log('service found: ', service);
                this.sendToPM(service);
                this.receiveFromPM(service);
            })
            .catch(error => {
                console.log(error);
            });
    }

    sendToPM(service) {
        service.getCharacteristic("ce060021-43e5-11e4-916c-0800200c9a66")
            .then(characteristic => {
                console.log('characteristic found: ', characteristic);
                //let val = this.hexToBytes('F18080F2');
                let val = this.hexToBytes('F10000F2');
                console.log(val)
                characteristic.writeValue(val);
            })
            .catch(error => {
                console.log(error);
            });
    }

    receiveFromPM(service) {
        service.getCharacteristic("ce060022-43e5-11e4-916c-0800200c9a66")
            .then(characteristic => {
                console.log('characteristic found: ', characteristic);
                return characteristic.startNotifications();
            })
            .then(characteristic => {
                characteristic.addEventListener('characteristicvaluechanged', this.printControlResponse);
            })
            .catch(error => {
                console.log(error);
            });
    }

    printControlResponse(event) {
        let value = event.target.value;
        value = value.buffer ? value : new DataView(value); // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
        let response = concept2pmDevice.bytesToHex(value);
        console.log("response value: ", value);
        console.log("response: ", response);

    }

    resetConcept2pm() {
        let server = this.server;
        return server.getPrimaryService(this.controlServiceUUID)
            .then(service => {
                console.log('service found: ', service);
                return service.getCharacteristic("ce060021-43e5-11e4-916c-0800200c9a66");
            })
            .then(characteristic => {
                let val = this.hexToBytes('F176041302010260F2');
                console.log('val', val);
                characteristic.writeValue(val);
            })
            .catch(error => {
                console.log(error);
            });
    }

    startWorkoutConcept2pm() {
        let server = this.server;
        return server.getPrimaryService(this.controlServiceUUID)
            .then(service => {
                console.log('service found: ', service);
                return service.getCharacteristic("ce060021-43e5-11e4-916c-0800200c9a66");
            })
            .then(characteristic => {
                let setDistance = selectionClickableDistance.value;
                console.log(setDistance);
                let distanceHex, checkSumInt = 0, checkSumHex, checkSumArray, val;
                switch (setDistance) {
                    case '0':
                        console.log('1000m');
                        distanceHex = '03E8';
                        break;
                    case '1':
                        console.log('2000m');
                        distanceHex = '07D0';
                        break;
                    case '2':
                        console.log('5000m');
                        distanceHex = '1388';
                        break;
                    case '3':
                        console.log('10000m');
                        distanceHex = '2710';
                        break;
                    default:
                        distanceHex = '07D0'; //default 2000m
                }
                checkSumArray = this.hexToBytes('76180101030305800000' + distanceHex + '0505800000019014010113020101');
                checkSumArray.forEach(element => checkSumInt = checkSumInt ^ element);
                checkSumHex = checkSumInt.toString(16);
                console.log('checkSumHex:', checkSumHex);
                val = this.hexToBytes('F1' + '76180101030305800000' + distanceHex + '0505800000019014010113020101' + checkSumHex + 'F2');
                console.log('val', val);
                characteristic.writeValue(val);
            })
            .catch(error => {
                console.log(error);
            });
    }

    // Convert a hex string to a byte array
    hexToBytes(hexString) {
        if (hexString.length % 2 !== 0) {
            throw "Must have an even number of hex digits to convert to bytes";
        }
        var numBytes = hexString.length / 2;
        var byteArray = new Uint8Array(numBytes);
        for (var i = 0; i < numBytes; i++) {
            byteArray[i] = parseInt(hexString.substr(i * 2, 2), 16);
        }
        return byteArray;
    }

    bytesToHex(byteArray) {
        const hexParts = [];
        for (let i = 0; i < byteArray.length; i++) {
            // convert value to hexadecimal
            const hex = byteArray.getUint8(i).toString(16);

            // pad with zeros to length 2
            const paddedHex = ('00' + hex).slice(-2);

            // push to array
            hexParts.push(paddedHex);
        }

        // join all the hex values of the elements into a single string
        return hexParts.join('');
    }


    findDataCharacteristic(service) {
        service.getCharacteristic(this.dataChUUID)
            .then(characteristic => {
                console.log('characteristic found: ', characteristic);
                return characteristic.startNotifications();
            })
            .then(characteristic => {
                characteristic.addEventListener('characteristicvaluechanged', this.parseConcept2pmData);
            })
            .catch(error => {
                console.log(error);
            });
    }

    findAddDataCharacteristic(service) {
        service.getCharacteristic(this.addDataChUUID)
            .then(characteristic => {
                console.log('characteristic found: ', characteristic);
                return characteristic.startNotifications();
            })
            .then(characteristic => {
                characteristic.addEventListener('characteristicvaluechanged', this.parseConcept2pmAddData);
            })
            .catch(error => {
                console.log(error);
            });
    }

    findAddData2Characteristic(service) {
        service.getCharacteristic(this.addData2ChUUID)
            .then(characteristic => {
                console.log('characteristic found: ', characteristic);
                return characteristic.startNotifications();
            })
            .then(characteristic => {
                characteristic.addEventListener('characteristicvaluechanged', this.parseConcept2pmAddData2);
            })
            .catch(error => {
                console.log(error);
            });
    }

    onDisconnected(event) {
        let device = event.target;
        console.log('"' + device.name + '" bluetooth device disconnected');
        showToast("Connection to concept2-PM5 lost. Try again.", "Fitness machine device");
        updateDisconnectedConcept2pmUI();
        resetMeasurements(false, false, true);
        drawChartConcept2pm();
    }

    disconnect() {
        if (this.device == null) {
            console.log('The target device is null.');
            return;
        }
        this.device.removeEventListener('gattserverdisconnected', this.onDisconnected);
        this.device.gatt.disconnect();
        updateDisconnectedConcept2pmUI();
        resetMeasurements(false, false, true);
        drawChartConcept2pm();
    }

    /* Utils */
    parseConcept2pmData(event) {
        let value = event.target.value;
        value = value.buffer ? value : new DataView(value); // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
        let result = {
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
            time: Date.now(),
        }
        console.log(`timestamp: ${result.time} | Rower: ${result.elapsedTime}s | ${result.distance}m | ${result.dragFactor}drag`)
        updateConcept2pmMeasurements(result);
    }
    parseConcept2pmAddData(event) {
        let value = event.target.value;
        value = value.buffer ? value : new DataView(value); // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
        let result = {
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
            time: Date.now(),
        }
        console.log(`timestamp: ${result.time} | Rower: ${result.elapsedTime}s | ${result.speed}m/s | ${result.prettyCurrentPace}/500m | ${result.strokeRate}spm`)
        updateConcept2pmUI(result);
        startLoopUpdate();
    }
    parseConcept2pmAddData2(event) {
        let value = event.target.value;
        value = value.buffer ? value : new DataView(value); // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
        let result = {
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
            time: Date.now(),
        }
        console.log(`timestamp: ${result.time} | Rower: ${result.elapsedTime}s | ${result.totalCalories}cals | ${result.intervalCount}interval`)
        updateConcept2pmAdd2Measurements(result);
    }
    getDeviceName() {
        return this.device.name;
    }
}