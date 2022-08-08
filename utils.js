// Convert a hex string to a byte array
function hexStringToByteArray(hexString) {
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

// Convert a byte array string to a hex string
function byteArrayToHexString(byteArray) {
    const hexParts = [];
    for (let i = 0; i < byteArray.byteLength; i++) {
        // convert value to hexadecimal
        const hex = byteArray.getUint8(i).toString(16).toUpperCase();
        // pad with zeros to length 2
        const paddedHex = ('00' + hex).slice(-2);
        // push to array
        hexParts.push(paddedHex);
    }
    // join all the hex values of the elements into a single string
    return hexParts.join('');
}

// Convert decimal to binary
function decIntToBinString(dec) {
    return (dec >>> 0).toString(2);
}

// Convert buffer array to binary
function bufferToBinString(buffer) {
    array = new Uint8Array(buffer);
    let bin = [];
    array.forEach(function (element) {
        let elementBin = (element >>> 0).toString(2).split();
        for (let i = 0; i < 8 - elementBin.length; i++) {
            elementBin.unshift("0");
        }
        bin.push(elementBin.join(''));
    });
    return bin.join('');
}

//get object key from value
function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

//get object key from property value
function getKeyByPropValue(object, value, property) {
    return Object.keys(object).find(key => object[key][property] === value);
}