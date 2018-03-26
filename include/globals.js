//  file globals.js
//  global functions, parameters and variables of twist service
//  addresses in twist.js must be the same as in microservices

global.axios = require('axios'); //  AXIOS - compact lib for HttpRequest
//global.api = require("./twist_api"); //  microservices url
global.twist = require("./twist"); //  exchange parameters: symbols, ttl, numConfirmations;
global.coins = require(twist.mode == 'development' ? '../private/coins' : './coins');



//  global functions

global.mess = function(name, message) {
    console.log(timeNow() + name + ': ' + message);
};

global.myErrorHandler = function(message, res) {
    if (res) res.json({ error: true, response: 'Error: ' + message });
    console.log(timeNow() + ' Error: ' + message);
};

global.timeNow = function() {
    const time = new Date();
    return (
        [
            time.getFullYear(),
            time.getMonth() > 8 ? time.getMonth() + 1 : "0" + (time.getMonth() + 1),
            time.getDate() > 9 ? time.getDate() : "0" + time.getDate()
        ].join("/") +
        " " + [
            time.getUTCHours() < 10 ? "0" + time.getUTCHours() : time.getUTCHours(),
            time.getMinutes() < 10 ? "0" + time.getMinutes() : time.getMinutes(),
            time.getSeconds() < 10 ? "0" + time.getSeconds() : time.getSeconds()
        ].join(":") + [' ']
    );
};


global.wait = async function (timeout) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, timeout)
    })
};



global.valueToFix = function(value) {
    return parseFloat(value.toPrecision(twist.fix))
};


global.invalidData = function(data) {
    return (data == undefined || data == '' || data == null);
};

global.invalidUserStatus = function(status) {
    return (invalidData(status) || parseInt(status) > 9 || parseInt(status) == 0);
};


global.invalidUserID = function(uid) {
    return (invalidData(uid) || uid.length != 36);
};

global.invalidSymbolAddr = function(symbol) {
    return (invalidData(symbol) || (symbol != 'ETH' && symbol != 'BTC'));
};

global.invalidValue = function(symbol, value) {
    error = invalidData(value) || (valueToFix(coins[symbol].price * value) > twist.maxLimit);
    error = error || (valueToFix(coins[symbol].price * value) < twist.minLimit);
    return error;
};

global.invalidAddr = function(symbol, addr) {
    if (invalidData(addr)) return true
    else if (symbol == 'ETH') {
        return false
    } else if (symbol == 'BTC') {
        return false
    } else return true;
};