//  file orderApiUtils.js

module.exports = {

    runMethod: async function(method, action, order) {
        var resp, coinStatus, coin;
        mess('runMethod', 'order' + order.exchangeTxId + ' ' + method + ' ' + action + ' now');
        if (method == 'awaitDeposit') {
            coinStatus = 'canReceive';
            coin = order.symbolFrom;
        } else {
            coinStatus = 'canSend'
            coin = order.symbolTo;
        };
        if ((coins[coin])[coinStatus]) {
            resp = await methods[method](action, order) //  100ms, 20
            mess('runMetod', 'starts??? response: ' + resp);
            if (resp && !resp.error) return { error: false, method: method + coin };
            (coins[coin])[coinStatus] = false;
            myErrorHandler('runMethod ' + method + coin + ' ' + action + ': ' + resp);
        };
        myErrorHandler('runMethod ' + method + coin + ' ' + action + ' not aviable');
        return { error: true, message: method + ' ' + action + ' not aviable' };
    },

    awaitDeposit: async function(action, order) {
        mess('awaitDeposit', action + 'ing now for ' + coins[order.symbolFrom]);
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

    makeRefund: async function(data) {
        setTimeout(() => {
            return new Error('eroor in btc3');
        }, 1000)
    },

    awaitRefund: async function(data) {
        setTimeout(() => {
            return new Error('eroor in btc3');
        }, 1000)
    }
}