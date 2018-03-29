//  file orderApiUtils.js

module.exports = {

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
                "awaitDeposit: exec order " +
                order.exchangeTxId +
                " service " +
                order.symbolFrom +
                err
            );
        });
    },

    refund1: async function(action, order, summ) {
        mess('refund', action + 'ing now for ' + coins[order.symbolFrom]);
        return axios.post(
            coins[order.symbolFrom].api + action +
            "TxAddrs", {
                addrs: order.exchangeAddrTo,
                confirms: coins[order.symbolFrom].confirmations,
                url: twist.url + '/twist/incomingtx'
            }).catch((err) => {
            myErrorHandler(
                "awaitDeposit: exec order " +
                order.exchangeTxId +
                " service " +
                order.symbolFrom +
                err
            );
        });
    },

    awaitRefund1: async function(data) {
        setTimeout(() => {
            return new Error('eroor in btc3');
        }, 1000)
    }
}