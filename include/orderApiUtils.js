//  file orderApiUtils.js

module.exports = {
    
    runMethod: async function (method, order) {
        mess('runMethod', 'starts now');
        var res;
        for (provider in this[method]) {
            if (this[method][provider].aviable) {
                mess('runMethod', 'run func ' + method + ', provider ' + provider);
                res = await this.runM(this[this[method][provider].name], order, this.wait, 100, 20);   //  100ms, 20
                if (!res.error) return res
                this[method][provider].aviable = false;
                myErrorHandler('runMethod ' + method + ', provider ' + provider + ': ' + res.message);
            };
        };
        myErrorHandler('runMethod ' + method + ' not aviable');
        return {error: true, message: method + ' not aviable'};
    },

    wait: async function (timeout) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve()
            }, timeout)
        })
    },

    runM: async function (func, data, wait, period, num) {
        let response;
        func(data, wait)    //  async function call
            .then((res) => { response = {error: res.error || true, response: res.response || 'unknown error'} })
            .catch((err) => {
                response = { error: true, message: err };
            })
        for (var i = 0; i < num; i++) { //  number of loops
            if (response != undefined) return response
            await wait(period) //  period in msec.
        };
        myErrorHandler('runM ' + method + ': not starts in period ' + (num * period / 1000).toString + 'sec.');
        return { error: true, message: 'not starts in timeout' }
    },

    awaitTxbtc1: async function (data, wait) {
        let res;
        setTimeout(() => {
            res = new Error('await error1')
        }, 100);
        setTimeout((data) => {
            res = false;
        }, data * 3);
        for (var i = 0; i < 1000; i++) {
            if (res != undefined) return res;
            await wait(100);
        }
        return new Error('awat1 error3')
    },

    awaitTxbtc2: async function (data, wait) {
        let res
        setTimeout(() => {
            res = new Error('await2 error1')
        }, 3000)
        setTimeout((data) => {
            res = true
        }, data)
        for (var i = 0; i < 1000; i++) {
            if (res != undefined) return res
            await wait(100);
        }
        return new Error('awat2 error2')
    },

    awaitTxbtc3: async function (data) {
        let res
        setTimeout(() => {
            res = new Error('await3 error1')
        }, 7000)
        setTimeout((data) => {
            res = true
        }, data * 3)
        for (var i = 0; i < 1000; i++) {
            if (res != undefined) return res
            await wait(100);
        }
        return new Error('awat3 error2')
    },

    sendTxbtc1: async function (data) {
        setTimeout(() => {
            return new Error('eroor in btc3');
        }, 1000)
    },

    sendTxbtc2: async function (data) {
        setTimeout(() => {
            return new Error('eroor in btc3');
        }, 1000)
    },

    sendTxbtc3: async function (data) {
        setTimeout(() => {
            return new Error('eroor in btc3');
        }, 1000)
    },


    awaitTx: {
        btc1: { aviable: true, name: 'awaitTxbtc1' }, btc2: { aviable: true, name: 'awaitTxbtc2' },
        btc3: { aviable: true, name: 'awaitTxbtc3' }
    },
    sendTx: {
        btc1: { aviable: false, name: 'sendTxbtc1' }, btc2: { aviable: false, name: 'sendTxbtc2' },
        btc3: { aviable: false, name: 'sendTxbtc3' }
    },


    newBtc3: function () {

        var url = coins[order.symbolFrom].api;
        axios
            .get(
                url +
                "waitTwistTx/" +
                JSON.stringify({
                    addrs: order.exchangeAddrTo,
                    confirms: coins[order.symbolFrom].confirmations
                })
            )
            .then(resp => {
                error = resp.data.error;
                if (error)
                    myErrorHandler(
                        "waiting tx to address " + resp.data.address + " not starts"
                    );
                mess( "eXecute",
                    "exec order " +
                    order.exchangeTxId +
                    " wait tx to address " +
                    resp.data.address
                );
            })
            .catch(err => {
                myErrorHandler(
                    "eXecute: exec order " +
                    order.exchangeTxId +
                    " service " +
                    order.symbolFrom +
                    err.message
                );
            });
    }
}