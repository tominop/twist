/*!
 * @title orderExec.js - local functions of order.js routes of twist exchange
 * @author Oleg Tomin - <2tominop@gmail.com>
 * @dev Basic implementaion of orders exec functions  
 * MIT Licensed Copyright(c) 2018-2019
 */

module.exports = {

    newOrder: async(exchange, data, res) => {
        if (!utils.validateUser(data.userID, res)) return;
        if (!utils.validateCoins(data.symbolFrom, data.valueFrom, data.symbolTo, data.valueTo, res)) return;
        mess('newOrder', 'new order from user ' + data.userID + ' creating starts now');
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
        if (resp == null || resp.data.error) return myErrorHandler('newOrder, new addrTo generation fail', res)
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
            exchangeAddrFrom: coins[symbolFrom].walletFrom, //..!!!TODO addrFrom,
            symbol: symbolFrom,
            amount: valueFrom,
            received: 0.0,
            sent: 0.0
        });
        tools.saveOrder(order, 'newOrder');
        // Order is saved to DB and added to executed orders array
        coins[symbolTo].reserv = coins[symbolTo].reserv + valueTo;
        execOrders[execOrders.length] = { id: order.exchangeTxId, time: new Date(), status: 0 }
        res.json({ error: false, order: order });
        exec.startDepositWait(order);
    },

    startDepositWait: order => {
        mess('startDepositWait', 'order id ' + order.exchangeTxId + ' awaiting deposit starts now');
        if ((order.status).code != 0) utils.setOrderStatus(order, 0, { reason: 'retake order by restart service', time: new Date })
            //  Start awaiting deposit (incoming Tx hook service)
        if (!methods.awaitDeposit(order, 'start')) return;
        utils.setOrderStatus(order, 1, { time: new Date() });
        var myInterval;
        order.depositIsFind = false;
        order.waitConfirm = false;
        //  awaiting deposit timer
        var ttlTimeOut = setTimeout(() => {
            const mess = 'deposit not received in ' + twist.ttl + 'min. period';
            exec.stopDepositWait(order, myInterval, ttlTimeOut, true, mess);
            utils.setOrderStatus(order, 7, { code: 1, reason: mess, time: new Date() })
            tools.arhOrder(order);
        }, order.ttl * 60000);
        //  checking incoming tx timer
        myInterval = setInterval(() => {
            utils.findDepositTx(order, myInterval, ttlTimeOut);
            if (order.depositIsFind && !order.waitConfrim) exec.startDepositWaitConfirm(order, myInterval, ttlTimeOut);
        }, 20000);
    },

    startDepositWaitConfirm: (order, interval, timeout) => {
        order.waitConfirm = true;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const mess = 'deposit not confirmed in ' + twist.waitConfirmPeriod + 'min. period';
            exec.stopDepositWait(order, interval, timeout, true, mess);
            tools.setOrderStatus(order, 7, { code: 2, reason: mess, time: new Date() })
            tools.arhOrder(order);
        }, twist.waitConfirmPeriod * 60000);
    },

    stopDepositWait: (order, interval, timeout, err, mess) => {
        clearTimeout(timeout);
        clearInterval(interval);
        methods.awaitDeposit(order, 'stop');
        if (err) return myErrorHandler('stopDepositWait order ' + order.exchangeTxId + ' ' + mess);
        mess('stopDepositWait ' + order.exchangeTxId, mess);
        exec.startWithdrawWait(order);
    },

    startWithdrawWait: async order => {
        mess('startWithdrawWait', 'order id ' + order.exchangeTxId + ' awaiting withdraw starts now');
        if ((order.status).code != 3) utils.setOrderStatus(order, 3, { reason: 'retake order by restart service', time: new Date })
            //  Start awaiting withdrawal (outgoing Tx hook service)
        if (!methods.awaitWithdraw(order, 'start')) return;
        var myInterval;
        var ttlTimeOut = setTimeout(() => {
            const mess = 'withdraw not confirmed in ' + twist.waitConfirmPeriod + 'min. period';
            exec.stopWithdrawWait(order, myInterval, ttlTimeOut, true, mess);
            utils.setOrderStatus(order, 7, { code: 4, reason: mess, time: new Date() })
        }, twist.waitConfirmPeriod * 60000);
        myInterval = setInterval(() => {
            utils.findWithdrawTx(order, myInterval, ttlTimeOut)
        }, 20000);
        exec.makeWithdraw(order, myInterval, ttlTimeOut);
    },

    makeWithdraw: (order, interval, timeout) => {
        const valueFact = utils.calcValueFact(order)
        mess('makeWithdraw', 'order ' +
            order.exchangeTxId + ' exec continue: send ' +
            valueFact + order.symbolTo + ' to user');
        var hash = methods.makeWithdrawTX(order, valueFact);
        if (hash == null) {
            const mess = 'withdraw Tx not created';
            exec.stopWithdrawWait(order, interval, timeout, true, mess);
            utils.setOrderStatus(order, 7, { code: 3, reason: mess, time: new Date() })
            tools.arhOrder(order);
            return;
        } else {
            if (hash.length > 15) {
                order.hashTxTo = outTx.data.hash;
                //  !!!TODO correct await Tx to user
                var tx = {
                    addrFrom: '',
                    hash: order.hashTxTo,
                    orderID: order.exchangeTxId,
                    createDateUTC: '',
                    confirms: 0,
                    value: valueFact,
                    To: order.userAddrTo
                };
                tools.incomingTx(tx);
            };
            utils.setOrderStatus(order, 4, { hash: hash, time: new Date() });
        };
    },

    stopWithdrawWait: (order, interval, timeout, err, mess) => {
        clearTimeout(timeout);
        clearInterval(interval);
        methods.awaitWithdraw(order, 'stop')
        if (err) return myErrorHandler('stopWithdrawWait order ' + order.exchangeTxId + ' ' + mess);
        mess('stopWithdrawWait ' + order.exchangeTxId, mess);
    }
}