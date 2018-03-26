//  file orderApiUtils.js

module.exports = {

    runMethod: async function(method, action, order) {
        var res;
        mess('runMethod', order.exchangeTxId + ' ' + method + ' ' + action + ' now');
        if (method == 'awaitDeposit') {
            coinStatus = 'canReceive';
            coin = order.symbolFrom;
        } else {
            coinStatus = 'canSend'
            coin = order.symbolTo;
        };
        if ([coins][coin][coinStatus]) {
            mess('runMethod', 'run func ' + method + coin + ' ' + action);
            res = await this.runM(this[method + coin], action, order, 100, 20); //  100ms, 20
            if (!res.error) {
                return { error: false, method: method + coin };
            }
            [coins][coin][coinStatus] = false;
            myErrorHandler('runMethod ' + method + coin + ' ' + action + ': ' + res);
        };
        myErrorHandler('runMethod ' + method + coin + ' ' + action + ' not aviable');
        return { error: true, message: method + ' ' + action + ' not aviable' };
    },

    runM: async function(func, aciton, data, period, num) {
        let response;
        func(action, data, wait) //  async function call
            .then((res) => { response = { error: res.error || true, response: res.response || 'unknown error' } })
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

    awaitDepositBTC3: async function(action, order) {
        return axios.get(
            coins[order.symbolFrom].api + action +
            "WaitTx/" +
            JSON.stringify({
                addrs: order.exchangeAddrTo,
                confirms: coins[order.symbolFrom].confirmations,
                url: twist.url + '/twist/incomingtx'
            })
        ).catch((err) => {
            myErrorHandler(
                "eXecute: exec order " +
                order.exchangeTxId +
                " service " +
                order.symbolFrom +
                err
            );
        });
    },

    awaitDepositBTC: async function(data) {
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

    awaitDepositETH: async function(data) {
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

    makeRefundBTC: async function(data) {
        setTimeout(() => {
            return new Error('eroor in btc3');
        }, 1000)
    },

    makeRefundETH: async function(data) {
        setTimeout(() => {
            return new Error('eroor in btc3');
        }, 1000)
    },

    makeRefundBTC3: async function(data) {
        setTimeout(() => {
            return new Error('eroor in btc3');
        }, 1000)
    },

    awaitRefundBTC: async function(data) {
        setTimeout(() => {
            return new Error('eroor in btc3');
        }, 1000)
    },

    awaitRefundETH: async function(data) {
        setTimeout(() => {
            return new Error('eroor in btc3');
        }, 1000)
    },

    awaitRefundBTC3: async function(data) {
        setTimeout(() => {
            return new Error('eroor in btc3');
        }, 1000)
    }
}