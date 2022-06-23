(function(){
    class heartRateDevice {
        constructor() {
        this.device = null;
        this.server = null;
        }
        
        connect() {
        return navigator.bluetooth.requestDevice({filters:[{services:[ 'heart_rate' ]}]})
        .then(device => {
            this.device = device;
            return device.gatt.connect();
        })
        .then(server => {
            this.server = server;
            return server.getPrimaryService('heart_rate');
        })
        .then(service => {
            this.findDataCharacteristic(service);
        });
        }

        findDataCharacteristic(service) {
        service.getCharacteristic('heart_rate_measurement')
        .then(characteristic => {
        console.log('characteristic found: ', characteristic);
        return characteristic.startNotifications();
        })
        .then(characteristic => {
        characteristic.addEventListener('characteristicvaluechanged', this.parseHeartRate);
        })
        .catch(error => {
        console.log(error);
        });
        }

        disconnect(){
        if (this.device == null) {
            console.log('The target device is null.');
            return;
        }
        this.device.gatt.disconnect();
        }

        /* Utils */
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
        console.log('HR: ', result.heartRate);
        updateHRUI(result);
        }
        getDeviceName(){
            return this.device.name;
        }
    }

    window.heartRateDevice = new heartRateDevice();

})();