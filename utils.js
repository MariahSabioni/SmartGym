/*
> Description:
This file contains some utility functions used by several JS files.
*/

/* DATA OPERATIONS*/

// convert a hex string to a byte array
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

// convert a byte array string to a hex string
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

// convert a byte array string to a hex string array
function byteArrayToHexArray(byteArray) {
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
    return hexParts;
}

// convert decimal to binary
function decIntToBinString(dec) {
    return (dec >>> 0).toString(2);
}

// convert buffer array to binary
function bufferToBinString(buffer) {
    array = new Uint8Array(buffer);
    let bin = [];
    array.forEach(function (element) {
        let elementBin = (element >>> 0).toString(2).split('');
        for (let i = 0; i < 8 - elementBin.length; i++) {
            elementBin.unshift("0");
        }
        bin.push(elementBin.join(''));
    });
    return bin.join('');
}

function bufferToReverseBinString(buffer) {
    array = new Uint8Array(buffer);
    let bin = [];
    array.forEach(function (element) {
        let elementBin = (element >>> 0).toString(2);
        let elementBin8 = elementBin.padStart(8, '0');
        bin.push(elementBin8.split('').reverse().join(''));
    });
    return bin.join('');
}

function bitStringToSignedInt(binStr) {
    if (binStr.length >64) throw new RangeError('parsing only supports ints up to 32 bits');
    return parseInt(binStr[0] === "1" ? binStr.padStart(32, "1") : binStr.padStart(32, "0"), 2) >> 0;
}

function bufferToReverseBinArray(buffer) {
    array = new Uint8Array(buffer);
    let bin = [];
    array.forEach(function (element) {
        let elementBin = (element >>> 0).toString(2).split();
        for (let i = 0; i < 8 - elementBin.length; i++) {
            elementBin.unshift("0");
        }
        bin.push(elementBin.reverse().join(''));
    });
    return bin;
}

/* OBJECTS AND ARRAYS UTILS*/

// get object key from value
function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

// get object key from property value
function getKeyByPropValue(object, value, property) {
    return Object.keys(object).find(key => object[key][property] === value);
}

// remove element from list
function removeElement(list, element) {
    return list.filter(item => item !== element);
}