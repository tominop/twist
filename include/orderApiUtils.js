//  file orderApiUtils.js


module.exports = {

    awaitDeposit: async function(action, order) {
        mess('awaitDeposit', action + 'ing now for ' + order.symbolFrom);
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

    refund: async function(action, order, summ) {
        var data;
        mess('refund', action + 'ing now for order' + order.exchangeTxId + ' coin ' + coins[order.symbolFrom]);
        if (action == 'send') {
            const valueFact = utils.calcValueFact(order);
            data = {
                orderId: order.exchangeAddrTo,
                from: coins[order.symbolFrom].walletFrom, // account name in api microservice
                to: order.userAddrTo,
                value: valueFact,
            };
        };
        return axios.post(
            coins[order.symbolFrom].api + action +
            "TxAddrs", data).catch((err) => {
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