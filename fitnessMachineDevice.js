(function(){
    class fitnessMachineDevice {
        constructor() {
        this.device = null;
        this.server = null;
        this._characteristics = new Map();
        }
        
        connect() {
        return navigator.bluetooth.requestDevice({filters:[{services:[ '00001826-0000-1000-8000-00805f9b34fb' ]}]})
        .then(device => {
            this.device = device;
            return device.gatt.connect();
        })
        .then(server => {
            this.server = server;
            return server.getPrimaryService('00001826-0000-1000-8000-00805f9b34fb');
        })
        .then(service => {
            return this._cacheCharacteristic(service, "00002acd-0000-1000-8000-00805f9b34fb");
        })
        }

        disconnect(){
            if (this.device == null) {
                console.log('The target device is null.');
                return;
            }
            this.device.gatt.disconnect();
        }

        /* Heart Rate Service */

        startNotificationsData() {
        return this._startNotifications("00002acd-0000-1000-8000-00805f9b34fb");
        }
        stopNotificationsData() {
        return this._stopNotifications("00002acd-0000-1000-8000-00805f9b34fb");
        }
        parseTreadmillData(value) {
        // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
        value = value.buffer ? value : new DataView(value);
        // let flags = value.getUint8(0);
        // let speed16Bits = flags & 0x0002;
        // console.log(speed16Bits)
        let result = {};
        let index_speed = 2;
        result.speed = value.getUint16(index_speed, /*littleEndian=*/true)/100;
        let index_inclination = 9;
        result.inclination = value.getInt16(index_inclination, /*littleEndian=*/true)/10;
        let index_distance = 6;
        result.distance = this.getUint24(index_distance, value);
        let index_time = 14;
        result.time = value.getUint16(index_time, /*littleEndian=*/true);
        // let energyPresent = flags & 0x8;
        // if (energyPresent) {
        //     result.energyExpended = value.getUint16(index, /*littleEndian=*/true);
        //     index += 2;
        // }
        console.log('result: ' + result.speed + 'km/h | ' + result.inclination + '% | '+ result.distance + 'm | ' + result.time + 's')
        return result;
        }

        getUint24(index_distance, value){
            let a = value.getUint16(index_distance, /*littleEndian=*/true);
            a << 8;
            let b = value.getUint8(2 + index_distance, /*littleEndian=*/true);
            return a + b;
        }

        /* Utils */

        _cacheCharacteristic(service, characteristicUuid) {
        return service.getCharacteristic(characteristicUuid)
        .then(characteristic => {
            this._characteristics.set(characteristicUuid, characteristic);
        });
        }
        _readCharacteristicValue(characteristicUuid) {
        let characteristic = this._characteristics.get(characteristicUuid);
        return characteristic.readValue()
        .then(value => {
            // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
            value = value.buffer ? value : new DataView(value);
            return value;
        });
        }
        _writeCharacteristicValue(characteristicUuid, value) {
        let characteristic = this._characteristics.get(characteristicUuid);
        return characteristic.writeValue(value);
        }
        _startNotifications(characteristicUuid) {
        let characteristic = this._characteristics.get(characteristicUuid);
        // Returns characteristic to set up characteristicvaluechanged event
        // handlers in the resolved promise.
        return characteristic.startNotifications()
        .then(() => characteristic);
        }
        _stopNotifications(characteristicUuid) {
        let characteristic = this._characteristics.get(characteristicUuid);
        // Returns characteristic to remove characteristicvaluechanged event
        // handlers in the resolved promise.
        return characteristic.stopNotifications()
        .then(() => characteristic);
        }
        getDeviceName(){
            return this.device.name;
        }
    }

    window.fitnessMachineDevice = new fitnessMachineDevice();
})();