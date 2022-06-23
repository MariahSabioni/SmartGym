(function(){
    class fitnessMachineDevice {

        constructor() {
        this.device = null;
        this.server = null;
        this.serviceUUID = '00001826-0000-1000-8000-00805f9b34fb';
        //characteristics
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
            this.findDataCharacteristic(service);
            this.findControlCharacteristic(service);
        });
        }

        findDataCharacteristic(service) {
        service.getCharacteristic(this.dataChUUID)
        .then(characteristic => {
        console.log('characteristic found: ', characteristic);
        return characteristic.startNotifications();
        })
        .then(characteristic => {
        characteristic.addEventListener('characteristicvaluechanged', this.parseTreadmillData);
        })
        .catch(error => {
        console.log(error);
        });
        }

        findControlCharacteristic(service) {
        service.getCharacteristic(this.controlChUUID)
        .then(characteristic => {
            console.log('characteristic found: ', characteristic);
            const val = Uint8Array.of(0);
            characteristic.writeValue(val);
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

        increaseSpeedStep(){
            console.log('speed increased');
        }

        /* Utils */
        parseTreadmillData(event) {
        let value = event.target.value;
        value = value.buffer ? value : new DataView(value); // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
        let result = {};
        let index_speed = 2;
        result.speed = Number(value.getUint16(index_speed, /*littleEndian=*/true)/100).toFixed(1);
        let index_inclination = 9;
        result.inclination = Number(value.getInt16(index_inclination, /*littleEndian=*/true)/10).toFixed(1);
        let index_distance = 6;
        result.distance = ((value.getUint16(index_distance, true)) << 8) + value.getUint8(2 + index_distance, true);
        let index_time = 14;
        let seconds = value.getUint16(index_time, /*littleEndian=*/true);
        result.time = new Date(seconds * 1000).toISOString().slice(11, 19);
        console.log('result: ' + result.speed + 'km/h | ' + result.inclination + '% | '+ result.distance + 'm | ' + result.time)
        updateFTMSUI(result);
        }
        getDeviceName(){
            return this.device.name;
        }
    }

    window.fitnessMachineDevice = new fitnessMachineDevice();

})();