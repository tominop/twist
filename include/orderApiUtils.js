//  file orderApiUtils.js

module.exports = {

    runMethod: async function(method, action, order) {
        var res, coinStatus, coin;
        mess('runMethod', order.exchangeTxId + ' ' + method + ' ' + action + ' now');
        if (method == 'awaitDeposit') {
            coinStatus = 'canReceive';
            coin = order.symbolFrom;
        } else {
            coinStatus = 'canSend'
            coin = order.symbolTo;
        };
        if ((coins[coin])[coinStatus]) {
            mess('runMethod', 'run func ' + method + coin + ' ' + action);
            res = await this[method + coin](action, order) //  100ms, 20
            if (!res.error) return { error: false, method: method + coin };
            (coins[coin])[coinStatus] = false;
            myErrorHandler('runMethod ' + method + coin + ' ' + action + ': ' + res.response);
        };
        myErrorHandler('runMethod ' + method + coin + ' ' + action + ' not aviable');
        return { error: true, message: method + ' ' + action + ' not aviable' };
    },

    awaitDepositBTC3: async function(action, order) {
        return axios.post(
            coins[order.symbolFrom].api + action +
            "WaitTx", {
                addrs: order.exchangeAddrTo,
                confirms: coins[order.symbolFrom].confirmations,
                url: twist.url + '/twist/incomingtx'
            }).catch((err) => {
            myErrorHandler(
                "awaitDepositBTC3: exec order " +
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

    makeRefundETHR: async function(data) {
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