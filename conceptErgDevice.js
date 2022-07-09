/*
Documentation: https://www.concept2.co.uk/files/pdf/us/monitors/PM5_BluetoothSmartInterfaceDefinition.pdf
Code example: https://github.com/GoogleChromeLabs/rowing-monitor
*/
class ConceptErgDevice {

    constructor() {
        this.device = null;
        this.server = null;
        this.serviceUUID = "ce060030-43e5-11e4-916c-0800200c9a66"; //rowing service
        //characteristics
        this.dataChUUID = "ce060031-43e5-11e4-916c-0800200c9a66"; //general status characteristic
        this.dataAddChUUID - "ce060032-43e5-11e4-916c-0800200c9a66";
        //this.controlChUUID = "ce060020-43e5-11e4-916c-0800200c9a66";
    }

    connect() {
        return navigator.bluetooth.requestDevice({ filters: [{ services: [this.serviceUUID] }] })
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
                        showToast("Connection to concept2-PM5 failed. Try again.", "Concept2-PM5 device");
                        //updateDisconnectedConceptErgUI();
                    }
                }
            })
            .then(server => {
                console.log('connection successfull');
                this.server = server;
                return server.getPrimaryService(this.serviceUUID);
            })
            .then(service => {
                this.findDataCharacteristic(service);
                this.findDataAddCharacteristic(service);
            });
    }

    findDataCharacteristic(service) {
        service.getCharacteristic(this.dataChUUID)
            .then(characteristic => {
                console.log('characteristic found: ', characteristic);
                return characteristic.startNotifications();
            })
            .then(characteristic => {
                characteristic.addEventListener('characteristicvaluechanged', this.parseConceptErgData);
            })
            .catch(error => {
                console.log(error);
            });
    }

    findDataAddCharacteristic(service) {
        service.getCharacteristic(this.dataAddChUUID)
            .then(characteristic => {
                console.log('characteristic found: ', characteristic);
                return characteristic.startNotifications();
            })
            .then(characteristic => {
                characteristic.addEventListener('characteristicvaluechanged', this.parseConceptErgDataAdd);
            })
            .catch(error => {
                console.log(error);
            });
    }

    // findControlCharacteristic(service) {
    //     service.getCharacteristic(this.controlChUUID)
    //         .then(characteristic => {
    //             console.log('characteristic found: ', characteristic);
    //             const val = Uint8Array.of(0);
    //             characteristic.writeValue(val);
    //         })
    //         .catch(error => {
    //             console.log(error);
    //         });
    // }

    onDisconnected(event) {
        let device = event.target;
        console.log('"' + device.name + '" bluetooth device disconnected');
        showToast("Connection to concept2-PM5 lost. Try again.", "Fitness machine device");
        //updateDisconnectedConceptErgUI();
        this.reset();
        //resetMeasurements(false, false);
        //drawChart();
    }

    disconnect() {
        if (this.device == null) {
            console.log('The target device is null.');
            return;
        }
        this.device.removeEventListener('gattserverdisconnected', this.onDisconnected);
        this.device.gatt.disconnect();
        updateDisconnectedFTMSUI();
        this.reset();
        //resetMeasurements(false, false);
        //drawChart();
    }

    reset() {
        this.device = null;
        this.server = null;
        this.serviceUUID = "ce060030-43e5-11e4-916c-0800200c9a66"; //rowing service
        //characteristics
        this.dataChUUID = "ce060031-43e5-11e4-916c-0800200c9a66"; //general status characteristic
        //this.controlChUUID = "ce060020-43e5-11e4-916c-0800200c9a66";
    }

    /* Utils */
    parseConceptErgData(event) {
        let value = event.target.value;
        value = value.buffer ? value : new DataView(value); // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
        let o = 0;
        let result = {
            elapsedTime: (v[o + 0] + (v[o + 1] << 8) + (v[o + 2] << 16)) * 0.01,
            distance: (v[o + 3] + (v[o + 4] << 8) + (v[o + 5] << 16)) * 0.1,
            workoutType: v[o + 6],
            intervalType: v[o + 7],
            workoutState: v[o + 8],
            rowingState: v[o + 9],
            strokeState: v[o + 10],
            totalWorkDistance: (v[o + 11] + (v[o + 12] << 8) + (v[o + 13] << 16)),
            workoutDuration: (v[o + 14] + (v[o + 15] << 8) + (v[o + 16] << 16)),
            workoutDurationType: v[o + 17],
            dragFactor: v[o + 18],
            time: Date.now(),
        }
        console.log(`timestamp: ${result.time} | Rower: ${result.elapsedTime}s | ${result.distance}m | ${result.dragFactor}`)
        //updateFTMSUI(result);
    }
    parseConceptErgDataAdd(event) {
        let value = event.target.value;
        value = value.buffer ? value : new DataView(value); // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
        let o = 0;
        let result = {
            elapsedTime: (v[o + 0] + (v[o + 1] << 8) + (v[o + 2] << 16)) * 0.01,
            speed: (v[o + 3] + (v[o + 4] << 8)) * 0.001,
            strokeRate: v[o + 5],
            //heartRate: v[o + 6],
            currentPace: (v[o + 7] + (v[o + 8] << 8)) * 0.01,
            averagePace: (v[o + 9] + (v[o + 10] << 8)) * 0.01,
            restDistance: (v[o + 11] + (v[o + 12] << 8)),
            restTime: (v[o + 13] + (v[o + 14] << 8) + (v[o + 15] << 16)) * 0.01,
            time: Date.now(),
        }
        console.log(`timestamp: ${result.time} | Rower: ${result.elapsedTime}s | ${result.speed}m | ${result.currentPace} | ${result.averagePace}`)
        //updateFTMSUI(result);
    }
    getDeviceName() {
        return this.device.name;
    }
}