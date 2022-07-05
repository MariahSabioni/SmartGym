(function () {
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
                            showToast("Connection to treadmill failed. Try again.", "Fitness machine device");
                            updateDisconnectedFTMSUI();
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
                    this.findControlCharacteristic(service);
                });
        }

        onDisconnected(event) {
            let device = event.target;
            console.log('"' + device.name + '" bluetooth device disconnected');
            showToast("Connection to treadmill lost. Try again.", "Fitness machine device");
            updateDisconnectedFTMSUI();
            for (var key in window.fitnessMachineDevice) {
                window.fitnessMachineDevice[key] = null;
            };
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

        disconnect() {
            if (this.device == null) {
                console.log('The target device is null.');
                return;
            }
            this.device.removeEventListener('gattserverdisconnected', this.onDisconnected);
            this.device.gatt.disconnect();
            for (var key in window.fitnessMachineDevice) {
                window.fitnessMachineDevice[key] = null;
            };
            updateDisconnectedFTMSUI();
        }

        increaseSpeedStep(currSpeed, speedIncrement) {
            console.log('speed increase clicked');
            console.log(currSpeed);
            var newSpeed = (parseFloat(currSpeed) + parseFloat(speedIncrement));
            console.log(newSpeed);
            let server = this.server;
            return server.getPrimaryService(this.serviceUUID)
                .then(service => {
                    this.setNewSpeed(service, newSpeed);
                });
        }

        decreaseSpeedStep(currSpeed, speedIncrement) {
            console.log('speed decrease clicked');
            console.log(currSpeed);
            var newSpeed = (parseFloat(currSpeed) - parseFloat(speedIncrement));
            console.log(newSpeed);
            let server = this.server;
            return server.getPrimaryService(this.serviceUUID)
                .then(service => {
                    this.setNewSpeed(service, newSpeed);
                });
        }

        increaseInclinationStep(currInclination, inclinationIncrement) {
            console.log('inclination increase clicked');
            console.log(currInclination);
            var newInclination = (parseFloat(currInclination) + parseFloat(inclinationIncrement));
            console.log(newInclination);
            let server = this.server;
            return server.getPrimaryService(this.serviceUUID)
                .then(service => {
                    this.setNewInclination(service, newInclination);
                });
        }

        decreaseInclinationStep(currInclination, inclinationIncrement) {
            console.log('inclination decrease clicked');
            console.log(currInclination);
            var newInclination = (parseFloat(currInclination) - parseFloat(inclinationIncrement));
            console.log(newInclination);
            let server = this.server;
            return server.getPrimaryService(this.serviceUUID)
                .then(service => {
                    this.setNewInclination(service, newInclination);
                });
        }

        setNewSpeed(service, newSpeed) {
            service.getCharacteristic(this.controlChUUID)
                .then(characteristic => {
                    console.log('characteristic found: ', characteristic);
                    let b = new Uint8Array(2);
                    let newSpeedInt = parseInt(newSpeed * 100);
                    for (var i = 0; i < b.length; i++) {
                        b[i] = newSpeedInt >> 8 * i;
                    }
                    let val = new Uint8Array(3);
                    val[0] = 2;
                    val[1] = b[0];
                    val[2] = b[1];
                    console.log('val', val);
                    characteristic.writeValue(val);
                })
                .catch(error => {
                    console.log(error);
                });
        }

        setNewInclination(service, newInclination) {
            service.getCharacteristic(this.controlChUUID)
                .then(characteristic => {
                    console.log('characteristic found: ', characteristic);
                    let b = new Uint8Array(2);
                    let newInclinationInt = parseInt(newInclination * 10);
                    for (var i = 0; i < b.length; i++) {
                        b[i] = newInclinationInt >> 8 * i;
                    }
                    let val = new Uint8Array(3);
                    val[0] = 3;
                    val[1] = b[0];
                    val[2] = b[1];
                    console.log('val', val);
                    characteristic.writeValue(val);
                })
                .catch(error => {
                    console.log(error);
                });
        }

        /* Utils */
        parseTreadmillData(event) {
            let value = event.target.value;
            value = value.buffer ? value : new DataView(value); // In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
            let result = {};
            let index_speed = 2;
            result.speed = Number(value.getUint16(index_speed, /*littleEndian=*/true) / 100).toFixed(1);
            let index_inclination = 9;
            result.inclination = Number(value.getInt16(index_inclination, /*littleEndian=*/true) / 10).toFixed(1);
            let index_distance = 6;
            result.distance = ((value.getUint16(index_distance, true)) << 8) + value.getUint8(2 + index_distance, true);
            let index_time = 14;
            let seconds = value.getUint16(index_time, /*littleEndian=*/true);
            result.duration = new Date(seconds * 1000).toISOString().slice(11, 19);
            result.time = Date.now();
            console.log(`timestamp: ${result.time} | Treadmill: ${result.speed}km/h | ${result.inclination}% | ${result.distance}m | ${result.duration}`)
            updateFTMSUI(result);
        }
        getDeviceName() {
            return this.device.name;
        }
    }

    window.fitnessMachineDevice = new fitnessMachineDevice();

})();