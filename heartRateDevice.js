/*
Documentation: https://www.bluetooth.com/specifications/specs/heart-rate-profile-1-0/
Code example:
*/

class HeartRateDevice {
    constructor() {
        this.device = null;
        this.server = null;
        //services
        this.serviceUUID ='heart_rate';
        //characteristics
        this.dataChUUID = 'heart_rate_measurement';
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
                    if (tries <= 5) {
                        console.log('> attempting to connect to', device.name);
                        setTimeout(function () {
                            connect();
                        }, 1000);
                    } else {
                        console.log('> could not connect to ', device.name);
                        updateDisconnectedHR('failed_connection');
                    }
                }
            })
            .then(server => {
                console.log('> connection successfull to: ', this.device.name);
                this.server = server;
                return server.getPrimaryService(this.serviceUUID);
            })
            .then(service => {
                this.findDataCharacteristic(service);
            });
    }

    findDataCharacteristic(service) {
        service.getCharacteristic(this.dataChUUID)
            .then(characteristic => {
                console.log(`> ${this.device.name} characteristic found: `, characteristic);
                return characteristic.startNotifications();
            })
            .then(characteristic => {
                characteristic.addEventListener('characteristicvaluechanged', this.parseHeartRate);
                console.log(`> request sent to ${this.device.name} start notifications ${characteristic.uuid}`);
            })
            .then(_ => {
                updateConnectedHR();
            })
            .catch(error => {
                console.log(error);
            });

    }

    onDisconnected(event) {
        let device = event.target;
        console.log(`> ${device.name} bluetooth device connection lost`);
        updateDisconnectedHR('lost_connection');
    }

    disconnect() {
        if (this.device == null) {
            console.log('> The target device is null.');
            return;
        }
        this.device.removeEventListener('gattserverdisconnected', this.onDisconnected);
        this.device.gatt.disconnect();
        console.log(`> ${this.device.name} bluetooth device disconnected`);
        updateDisconnectedHR('disconnected');
    }

    /* FUNCTIONS TO READ RESPONSES FROM DATA CHARACTERISTIC*/

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
        heartRateMeasurements.push(result);
        updateDataHR(result);
        startLoopUpdate();
    }

    /* UTILS */

    getDeviceName() {
        return this.device.name;
    }
}

