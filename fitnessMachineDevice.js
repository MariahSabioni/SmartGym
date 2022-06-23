(function(){
    class fitnessMachineDevice {

        constructor() {
        this.device = null;
        this.server = null;
        //this._characteristics = new Map();
        this.serviceUUID = '00001826-0000-1000-8000-00805f9b34fb';
        this.dataChUUID = "00002acd-0000-1000-8000-00805f9b34fb";
        this.controlChUUID = "00002ad9-0000-1000-8000-00805f9b34fb";
        this.controlCh = null;
        this.dataCh = null;
        }
        
        connect() {
        return navigator.bluetooth.requestDevice({filters:[{services:[ this.serviceUUID ]}]})
        .then(device => {
            this.device = device;
            return device.gatt.connect();
        })
        .then(server => {
            this.server = server;
            return server.getPrimaryService(this.serviceUUID);
        })
        .then(service => {
            //this._cacheCharacteristic(service, this.controlChUUID)
            this.controlCh = service.getCharacteristic(this.controlChUUID)
            .then(characteristic => {
                console.log('characteristic found: ', characteristic);
                let permissionStatus = this.askControlPermission(characteristic);
                console.log('permission: ', permissionStatus)
            })
            .then(() => this.dataCh = service.getCharacteristic(this.dataChUUID))
            .then(characteristic => {
                console.log('characteristic found: ', characteristic);
                this.startDataNotifications(characteristic);
            })
            .catch(error => {
                console.log(error);
            });
        });
        }

        askControlPermission(characteristic){
            console.log('asking control permission');
            let permission = Uint8Array.of(0);
            return characteristic.writeValue(permission);
            //return(this._writeCharacteristicValue(this.controlChUUID, permission));
        }

        startDataNotifications(characteristic) {
        console.log('Starting notifications...');
        return characteristic.startNotifications()
        .then(() => {
            console.log('Notifications started');
            characteristic.addEventListener('characteristicvaluechanged', this.parseTreadmillData);
        });
        }

        disconnect(){
            if (this.device == null) {
                console.log('The target device is null.');
                return;
            }
            this.device.gatt.disconnect();
        }

        /* Treadmill Service */

        startNotificationsData() {
        return this._startNotifications(this.dataCh);
        }
        stopNotificationsData() {
        return this._stopNotifications(this.dataChUUID);
        }
        parseTreadmillData(event) {
        // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
        let value = event.target.value;
        value = value.buffer ? value : new DataView(value);
        // let flags = value.getUint8(0);
        // let speed16Bits = flags & 0x0002;
        // console.log(speed16Bits)
        let result = {};
        let index_speed = 2;
        result.speed = Number(value.getUint16(index_speed, /*littleEndian=*/true)/100).toFixed(1);
        let index_inclination = 9;
        result.inclination = Number(value.getInt16(index_inclination, /*littleEndian=*/true)/10).toFixed(1);
        let index_distance = 6;
        //result.distance = this.getUint24(index_distance, value);
        let a = value.getUint16(index_distance, /*littleEndian=*/true);
        a << 8;
        let b = value.getUint8(2 + index_distance, /*littleEndian=*/true);
        result.distance = a + b;
        let index_time = 14;
        let seconds = value.getUint16(index_time, /*littleEndian=*/true);
        result.time = new Date(seconds * 1000).toISOString().slice(11, 19);
        // let energyPresent = flags & 0x8;
        // if (energyPresent) {
        //     result.energyExpended = value.getUint16(index, /*littleEndian=*/true);
        //     index += 2;
        // }
        console.log('result: ' + result.speed + 'km/h | ' + result.inclination + '% | '+ result.distance + 'm | ' + result.time)
        //return result;
            
        }

        increaseSpeedStep(){
            console.log('speed increased');
        }

        /* Utils */

        getUint24(index_distance, value){
            let a = value.getUint16(index_distance, /*littleEndian=*/true);
            a << 8;
            let b = value.getUint8(2 + index_distance, /*littleEndian=*/true);
            return a + b;
        }
        _cacheCharacteristic(service, characteristicUuid) {
        return service.getCharacteristic(characteristicUuid)
        .then(characteristic => {
            console.log('characteristic found: ', characteristicUuid);
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
            let wValue = Uint8Array.of(value)
            let characteristic = this._characteristics.get(characteristicUuid);
        return characteristic.writeValue(wValue);
        }
        _startNotifications(characteristic) {
        //let characteristic = this._characteristics.get(characteristicUuid);
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