/*!
 * @title orderMethods.js - API service functions of twist exchange
 * @author Oleg Tomin - <2tominop@gmail.com>
 * @dev Basic implementaion of functions  
 * MIT Licensed Copyright(c) 2018-2019
 */

module.exports = {

    awaitDeposit: async(order, action) => {
        mess('awaitDeposit', action + 'ing now for odrer id ' + order.exchangeTxId + ', coin ' + order.symbolFrom);
        var data = {
            addrs: order.exchangeAddrTo
        };
        if (action == 'start') {
            data.confirms = coins[order.symbolFrom].confirmations;
            data.url = twist.url + '/twist/incomingtx';
            data.hash = ''
        };
        var resp = await axios.post(coins[order.symbolFrom].api + action + 'WaitTx', data)
            .catch(err => {
                myErrorHandler('awaitDeposit ' + action + 'ing for order id ' +
                    order.exchangeTxId + ', coin ' + order.symbolFrom + ' ' + err);
            });
        if (!resp || resp == null || resp.error == true) return false;
        return true;
    },

    awaitWithdraw: async(order, action) => {
        mess('awaitWithdraw', action + 'ing now for odrer id ' + order.exchangeTxId + ', coin ' + order.symbolTo);
        var data = {
            addrs: order.userAddrTo
        };
        if (action == 'start') {
            data.confirms = coins[order.symbolTo].confirmations;
            data.url = twist.url + '/twist/incomingtx';
            data.hash = order.hashTxTo
        };
        var resp = await axios.post(
                coins[order.symbolTo].api + action + 'WaitTx', data)
            .catch((err) => {
                myErrorHandler('awaitWithdraw ' + action + 'ing for order id ' +
                    order.exchangeTxId + ', coin ' + order.symbolTo + ' ' + err);
            });
        if (!resp || resp == null || resp.error == true) return false;
        return true;
    },

    /// TODO !!!
    makeWithdrawTX: async(order, value) => {
        var outTx;
        var jsonData = JSON.stringify({
            // from: coins[order.symbolFrom].walletFrom, // account name in api microservice
            from: order.exchangeAddrFrom, // account name in api microservice
            to: order.userAddrTo,
            value: value
        });
        return axios.get(coins[order.symbolTo].api + 'makeTxAddrs/' + jsonData) //
            .catch(err => {
                myErrorHandler('exec order ' + order.exchangeTxId +
                    ': Tx to ' + order.userAddrTo + ' chain API error ' + err);
            });
    },

    getAddressTo: async(symbolFrom, exchange, attrib, userId, orderId) => {
        mess('getAddressTo', 'new addres for exchange ' + exchange + ' generating starts now');
        var data = {
            exchange: exchange,
            attrib: attrib,
            userId: userId,
            orderId: orderId
        };
        return axios.post(coins[symbolFrom].api + 'newaddrgen', data)
            .catch(err => {
                myErrorHandler('getAddressTo order ' +
                    orderId + ', coin ' + symbolFrom + ' new address generation fail ' + err);
            });
    },

    getAddressFrom: async(symbolTo, exchange) => {
        mess('getAddressFrom', 'wallet addres for exchange ' + exchange + ' searching starts now');
        return axios.get(coins[symbolTo].api + 'addrfrom/' + exchange)
            .catch(err => {
                myErrorHandler('getAddressFrom for exchange ' +
                    exchange + ', coin ' + symbolFrom + ' fail ' + err);
            });
    }

}