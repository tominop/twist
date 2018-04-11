/*!
 * @title orderExec.js - local functions of order.js routes of twist exchange
 * @author Oleg Tomin - <2tominop@gmail.com>
 * @dev Basic implementaion of orders exec functions  
 * MIT Licensed Copyright(c) 2018-2019
 */

module.exports = {

    newOrder: async function (exchange, data, res) {
        if (!utils.validateUser(data.userID, res)) return;
        if (!utils.validateCoins(data.symbolFrom, data.valueFrom, data.symbolTo, data.valueTo, res)) return;
        const userID = data.userID,
            userEmail = data.userEmail || '',
            userPhone = data.userPhone || '',
            userAddrRefund = utils.normalizeAddr(data.symbolFrom, data.userAddrRefund),
            symbolFrom = data.symbolFrom,
            valueFrom = valueToFix(data.valueFrom),
            userAddrTo = utils.normalizeAddr(data.symbolTo, data.userAddrTo),
            symbolTo = data.symbolTo,
            valueTofromUser = valueToFix(data.valueTo);
        const ratio = valueToFix(coins[symbolFrom].price / coins[symbolTo].price);
        const valueTo = valueToFix(valueFrom * ratio);
        const time = new Date().getTime();
        var resp = await methods.getAddressTo(symbolFrom, exchange, 0, userID, time.toString()); //  deposit to address
        if (resp == null || resp.data.error) return myErrorHandler('newOrder, new addrTo generation fail')
        const addrTo = resp.data.address;
        // !!!TODO        resp = await methods.getAddressFrom(symbolTo, exchange); //  withdrawal form address
        //        if (resp == null || resp.data.error) return myErrorHandler('newOrder, get exchangeAddrFrom fail')
        //        const addrFrom = resp.data.address;
        var order = new Order({
            exchangeTxId: time.toString(),
            exchange: exchange,
            createDateUTC: time,
            ttl: twist.ttl,
            status: { code: 0, human: twist.humans[0], data: { time: new Date() } },
            exchangeRatio: ratio,
            userID: userID,
            userEmail: userEmail,
            userPhone: userPhone,
            userAddrFrom: '',
            symbolFrom: symbolFrom,
            valueFrom: valueFrom,
            hashTxFrom: '',
            confirmTxFrom: false,
            userAddrRefund: userAddrRefund,
            valueRefund: 0,
            hashTxRefund: '',
            confirmTxRefund: false,
            userAddrTo: userAddrTo,
            symbolTo: symbolTo,
            valueTo: valueTo,
            hashTxTo: '',
            confirmTxTo: false,
            exchangeAddrTo: addrTo,
            exchangeAddrFrom: coins[order.symbolFrom].walletFrom, //..!!!TODO addrFrom,
            symbol: symbolFrom,
            amount: valueFrom,
            received: 0.0,
            sent: 0.0
        });
        tools.saveOrder(order, 'newOrder');
        // Order is saved to DB and added to executed orders array
        coins[symbolTo].reserv = coins[symbolTo].reserv + valueTo;
        execOrders[execOrders.length] = { id: order.exchangeTxId, time: new Date(), status: 0 }
        res.json({error: false, order: order});
        exec.takeOrder(order);
    },

    takeOrder: async order => {
    },

    startDepositWait: function (order) {
        mess('startDepositWait', 'order id ' + order.exchangeTxId + ' awaiting deposit starts now');
            if ((order.status).code != 0) tools.setOrderStatus(order, 0, { reason: 'retake order by restart service', time: new Date })
            //  Start awaiting deposit (incoming Tx hook service)
            var resp = methods.awaitDeposit(order, 'start');
            if (!resp) {
                coins[order.symbolFrom].canReceive = false;
                myErrorHandler('startDepositWait: order id ' +
                order.exchangeTxId + ' API ' +
                order.symbolFrom + ' not response');
                return;
            };
            tools.setOrderStatus(order, 1, { time: new Date() });
            var myInterval;
        //  awaiting deposit timer
        var ttlTimeOut = setTimeout(function () {
            clearInterval(myInterval);
            utils.stopDepositWait(order);
            myErrorHandler('startDepositWait: order id ' +
                order.exchangeTxId +
                ' deposit to ' +
                order.exchangeAddrTo +
                ' not received in order ttl period'
            );
            tools.setOrderStatus(order, 7, { code: 1, reason: 'deposit not received in ' + twist.ttl + 'min. period', time: new Date() })
            tools.arhOrder(order);
        }, order.ttl * 60000);
        //  checking incoming tx timer
        myInterval = setInterval(function () {
            if (coins[order.symbolFrom].canReceive)
                utils.findTxTo(order, myInterval, ttlTimeOut)
            else {
                //                tools.setOrderStatus(order, order.status.code + 10, { reason: 'awaitDeposit service not available', time: new Date() })
            }
        }, 20000);
    },

    stopDepositWait: function (order) {
        methods.awaitDeposit(order, 'stop');
    },
    
    /// TODO !!!
    makeWithdrawTx: async order => {
        var resp;
        if ((order.status).code != 3) tools.setOrderStatus(order, 3, { reason: 'retake order by restart service', time: new Date })
        if (coins[order.symbolFrom].canSend) {
            mess('makeWithdrawTx', 'order ' + order.exchangeTxId + ' make Tx to user starts');
            resp = await methods.refund('send', order);
            if (!resp || resp.error) return utils.stopWithdrawWait(order, refundTimers); //..in error stop awaiting refund Tx and outgoing Tx hook service
            tools.setOrderStatus(order, 4, { hash: resp.hash, time: new Date() });
        } else {
            //   !!!!! TODO set counter errors and abort order
            var counterr;
            counterr++;
        };
        //   !!!!! TODO
    },

    startWithdrawTxWait: order => {             //  start awaiting tx (run outgoing Tx hook service)
        resp = await methods.refund('start', order);
        if (!resp || resp.error) return coins[order.symbolTo].canSend = false; //   outgoing tx awating service not wotks, do not refund!!!
        //  in succsess start awaiting refund Tx and send data for outgoing tx (run outgoing Tx send service)
        var refundTimers = utils.waitWithdraw(order);
    },

    //  TODO!!!!!
    startWithdrawWait: async function (order) {
        resp = await methods.awaitWithdraw(order, 'start');
        if (!resp || resp.error) return;
        mess('waitWithdraw', 'order ' +
            order.exchangeTxId +
            ' : awaiting refund confirmation starts');
        var myInterval;
        var ttlTimeOut = setTimeout(function () {
            clearInterval(myInterval);
            utils.stopWithdrawWait(order);
            myErrorHandler(
                'waitWithdraw: order ' +
                order.exchangeTxId +
                ' refund to ' +
                order.userAddrTo +
                ' not confirmed in confirmation period'
            );
            tools.setOrderStatus(order, 7, { code: 4, reason: 'refund not confirmed in ' + twist.waitConfirmPeriod + 'min. period', time: new Date() })
        }, twist.waitConfirmPeriod * 60000);
        myInterval = setInterval(function () {
            if (coins[order.symbolTo].enabled)
                utils.findTxFrom(order, myInterval, ttlTimeOut)
            else {
                //                tools.setOrderStatus(order, order.status.code + 10, { reason: 'awaitDeposit service not available', time: new Date() })
            }
        }, 20000);
    },


    stopWithdrawWait: function (order) {
        methods.awaitWithdraw(order, 'stop')
    },


}