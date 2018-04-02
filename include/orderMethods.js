/*!
 * @title orderMethods.js - API service functions of twist exchange
 * @author Oleg Tomin - <2tominop@gmail.com>
 * @dev Basic implementaion of functions  
 * MIT Licensed Copyright(c) 2018-2019
 */

module.exports = {

    awaitDeposit: async function(order, action) {
        mess('awaitDeposit', action + 'ing now for odrer id ' + order.exchangeTxId + ', coin ' + order.symbolFrom);
        var data = {
            addrs: order.exchangeAddrTo
        };
        if (action == 'start') {
            data.confirms = coins[order.symbolFrom].confirmations;
            data.url = twist.url + '/twist/incomingtx';
        };
        return axios.post(
                coins[order.symbolFrom].api + action + 'WaitTx', data)
            .catch((err) => {
                myErrorHandler('awaitDeposit ' + action + 'ing for order id ' +
                    order.exchangeTxId + ', coin ' + order.symbolFrom + ' ' + err);
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
            'TxAddrs', data).catch((err) => {
            myErrorHandler(
                'awaitDeposit: exec order ' +
                order.exchangeTxId +
                ' service ' +
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