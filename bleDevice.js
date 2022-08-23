/*
Documentation: 
Code example: https://googlechrome.github.io/samples/web-bluetooth/discover-services-and-characteristics.html
*/

class BleDevice {
    constructor() {
        this.device = null;
        this.server = null;
        //services
        this.serviceUUID = null;
    }

    connect(uuid) {
        this.serviceUUID = this.getAndCheckUUID(uuid);
        if (this.serviceUUID == null) {
            return;
        }
        return navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
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
                    if (tries <= 5) {
                        console.log('> attempting to connect to', device.name);
                        setTimeout(function () {
                            connect();
                        }, 1000);
                    } else {
                        console.log('> could not connect to ', device.name);
                        showToast("Connection to BLE device failed. Try again.", "BLE device");
                        updateDisconnectedBle('failed_connection');
                    }
                }
            })
            .then(server => {
                this.server = server;
                this.findAllCharacteristics(server, this.serviceUUID);
            })
    }

    getAndCheckUUID(uuid) {
        //validate and get UUID input field
        if (uuid == "" || uuid == undefined) {
            console.log('> UUID empty input');
            showToast("Provide a service UUID", "BLE device");
            return null;
        }
        return uuid.toLowerCase();
    }

    findAllCharacteristics(server, serviceUUID) {
        $("#uuidInput").attr('disabled', 'disabled');
        let response = 'Services & Characteristics <br />';
        server.getPrimaryServices(serviceUUID)
            .then(services => {
                console.log('> Getting Characteristics for ', this.device.name);
                let queue = Promise.resolve();
                services.forEach(service => {
                    queue = queue.then(_ => service.getCharacteristics().then(characteristics => {
                        console.log('> Service: ' + service.uuid);
                        response = response + '> Service: ' + service.uuid + '<br />';
                        characteristics.forEach(characteristic => {
                            console.log('>> Characteristic: ' + characteristic.uuid + ' ' +
                                this.getSupportedProperties(characteristic));
                            response = response + '>> Characteristic: ' + characteristic.uuid + ' ' +
                                this.getSupportedProperties(characteristic) + '<br />';
                        });
                        updateConnectedBle(response);
                    }));
                });
                return queue;
            })
            .catch(e => {
                if (e.name == 'NotFoundError') {
                    this.device.removeEventListener('gattserverdisconnected', this.onDisconnected);
                    this.device.gatt.disconnect();
                    console.log(`> ${this.device.name} bluetooth device disconnected due to error ${e.name} : ${e.message}`);
                    updateDisconnectedBle('invalid_uuid', e);
                } else {
                    console.log(e);
                }
            });
    }

    getSupportedProperties(characteristic) {
        let supportedProperties = [];
        for (const p in characteristic.properties) {
            if (characteristic.properties[p] === true) {
                supportedProperties.push(p.toUpperCase());
            }
        }
        return '[' + supportedProperties.join(', ') + ']';
    }

    onDisconnected(event) {
        let device = event.target;
        console.log(`> ${device.name} bluetooth device connection lost`);
        updateDisconnectedBle('lost_connection');
    }

    disconnect() {
        if (this.device == null) {
            console.log('> The target device is null.');
            return;
        }
        this.device.removeEventListener('gattserverdisconnected', this.onDisconnected);
        this.device.gatt.disconnect();
        console.log(`> ${this.device.name} bluetooth device disconnected`);
        updateDisconnectedBle('disconnected');
    }

    /* UTILS */
    getDeviceName() {
        return this.device.name;
    }
}
