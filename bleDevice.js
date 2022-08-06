/*
Documentation: 
Code example: https://googlechrome.github.io/samples/web-bluetooth/discover-services-and-characteristics.html
*/

class BleDevice {
    constructor() {
        this.device = null;
        this.server = null;
    }

    connect() {
        let serviceUUID = this.getAndCheckUUID();
        if (serviceUUID == null) {
            return;
        }
        return navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [serviceUUID],
        })
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
                        showToast("Connection to BLE device failed. Try again.", "BLE device");
                        updateDisconnectedBleUI();
                    }
                }
            })
            .then(server => {
                this.server = server;
                this.findAllCharacteristics(server, serviceUUID);
            })
    }

    getAndCheckUUID() {
        //validate and get UUID input field
        let uuid = uuidInput.value;
        if (uuid == "" || uuid == undefined) {
            console.log('empty input');
            showToast("provide a service UUID", "BLE device");
            return null;
        } else {
            console.log('correct input')
        }
        return uuid.toLowerCase();
    }

    findAllCharacteristics(server, serviceUUID) {
        $("#uuidInput").attr('disabled', 'disabled');
        let response = 'Services & Characteristics <br />';
        server.getPrimaryServices(serviceUUID)
            .then(services => {
                console.log('Getting Characteristics...');
                let queue = Promise.resolve();
                services.forEach(service => {
                    queue = queue.then(_ => service.getCharacteristics().then(characteristics => {
                        console.log('> Service: ' + service.uuid);
                        response = response + '> Service: ' + service.uuid + '<br />';
                        characteristics.forEach(characteristic => {
                            console.log('>> Characteristic: ' + characteristic.uuid + ' ' +
                                bleDevice.getSupportedProperties(characteristic));
                            response = response + '>> Characteristic: ' + characteristic.uuid + ' ' +
                                this.getSupportedProperties(characteristic) + '<br />';
                        });
                        console.log(response);
                        updateBleUI(response);
                    }));
                });
                return queue;
            })
            .catch(error => {
                console.log('Argh! ' + error);
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
        console.log('"' + device.name + '" bluetooth device disconnected');
        showToast("Connection to BLE device lost. Try again.", "BLE device");
    }

    disconnect() {
        if (this.device == null) {
            console.log('The target device is null.');
            return;
        }
        this.device.removeEventListener('gattserverdisconnected', this.onDisconnected);
        this.device.gatt.disconnect();
        updateDisconnectedBleUI();
    }

    /* UTILS */
    getDeviceName() {
        return this.device.name;
    }
}
