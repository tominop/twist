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
        var valueTo = valueToFix(valueFrom * ratio);
        const fee = coins[symbolTo].minerFee + valueToFix(twist.fee * valueTo / 100);
        valueTo = valueTo - fee;
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
            received: 0.0,
            sent: 0.0,
            fee: fee
        });
        tools.saveOrder(order, 'newOrder');
        // Order is saved to DB and added to executed orders array
        coins[symbolTo].reserv = coins[symbolTo].reserv + valueTo;
        execOrders[execOrders.length] = { id: order.exchangeTxId, time: new Date(), status: 0 }
        res.json({ error: false, order: order });
        exec.startDepositWait(order);
    },

    startDepositWait: order => {
        order.myInterval = null;
        order.ttlTimeOut = null;
        order.depositIsFind = false;
        order.waitConfirm = false;
        mess('startDepositWait', 'order id ' + order.exchangeTxId + ' awaiting deposit starts now');
        if ((order.status).code != 0) utils.setOrderStatus(order, 0, { reason: 'retake order by restart service', time: new Date })
            //  Start awaiting deposit (incoming Tx hook service)
        if (!methods.awaitDeposit(order, 'start')) return;
        utils.setOrderStatus(order, 1, { time: new Date() });
        //  awaiting deposit timer
        order.ttlTimeOut = setTimeout(() => {
            const mess1 = 'deposit not received in ' + twist.ttl + 'min. period';
            exec.stopDepositWait(order, true, mess1);
            utils.setOrderStatus(order, 7, { code: 1, reason: mess1, time: new Date() })
            tools.arhOrder(order);
        }, order.ttl * 60000);
        //  checking incoming tx timer
        order.myInterval = setInterval(() => {
            exec.findDepositTx(order);
            if (order.depositIsFind && order.waitConfirm) exec.startDepositWaitConfirm(order);
        }, 20000);
    },

    findDepositTx: async(order) => {
        var incTx = null;
        if (order.hashTxFrom != '') incTx = await tools.findTx({ hashTx: order.hashTxFrom });
        if (incTx == null) incTx = await tools.findTx({ To: order.exchangeAddrTo });
        if (incTx == null) return incTx;
        if (incTx.confirms == 0 && order.status.code < 3) {
            if (order.status.code == 1 || incTx.confirms > order.status.data.confirmations) mess('findTxTo', 'exec order ' +
            order.exchangeTxId + ' deposit Tx confirms ' + incTx.confirms);
            order.status = {
                code: 2,
                human: twist.humans[2],
                data: {
                    confirmations: incTx.confirms,
                    wait: coins[order.symbolFrom].confirmations
                }
            };
        } else if (
            order.status.code < 3 &&
            incTx.confirms >= coins[order.symbolFrom].confirmations
        ) {
            order.status = {
                code: 3,
                human: twist.humans[3],
                data: {
                    confirmations: incTx.confirms,
                    time: new Date()
                }
            };
            order.confirmTxFrom = true;
            order.received = incTx.value;
        } else return;
        if (!order.depositIsFind) order.depositIsFind = true;
        order.hashTxFrom = incTx.hashTx;
        order.userAddrFrom = incTx.addrFrom;
        tools.saveOrder(order, 'findTxTo');
        if (order.status.code == 3) {
            exec.stopDepositWait(order, false, ' Tx ' + incTx.hashTx + ' confirmed ');
            tools.arhTx(incTx);
        };
    },

    startDepositWaitConfirm: order => {
        order.waitConfirm = true;
        order.attemtCount = 0;  //  make withdrawal tx attempts counter
        clearTimeout(order.ttlTimeOut);
        order.ttlTimeOut = setTimeout(() => {
            const mess1 = 'deposit not confirmed in ' + twist.waitConfirmPeriod + 'min. period';
            exec.stopDepositWait(order, true, mess1);
            utils.setOrderStatus(order, 7, { code: 2, reason: mess1, time: new Date() })
            tools.arhOrder(order);
        }, twist.waitConfirmPeriod * 60000);
        return;
    },

    stopDepositWait: (order, err, mess1) => {
        clearTimeout(order.ttlTimeOut);
        clearInterval(order.myInterval);
        methods.awaitDeposit(order, 'stop');
        if (err) return myErrorHandler('stopDepositWait order ' + order.exchangeTxId + ' ' + mess1);
        mess('stopDepositWait ' + order.exchangeTxId, mess1);
        exec.startWithdrawWait(order);
    },

    startWithdrawWait: async order => {
        order.waitConfirm = true;
        order.attemptCount = 0;
        mess('startWithdrawWait', 'order id ' + order.exchangeTxId + ' awaiting withdraw starts now');
        if ((order.status).code != 3) utils.setOrderStatus(order, 3, { reason: 'retake order by restart service', time: new Date })
            //  Start awaiting withdrawal (outgoing Tx hook service)
        if (!methods.awaitWithdraw(order, 'start')) return;
        order.ttlTimeOut = setTimeout(() => {
            const mess1 = 'withdraw not confirmed in ' + twist.waitConfirmPeriod + 'min. period';
            exec.stopWithdrawWait(order, true, mess1);
            utils.setOrderStatus(order, 7, { code: 4, reason: mess1, time: new Date() })
        }, twist.waitConfirmPeriod * 60000);
        order.myInterval = setInterval(() => {
            exec.findWithdrawTx(order);
            if (!order.waitConfirm) exec.makeWithdraw(order);
        }, 20000);
        exec.makeWithdraw(order);
    },

    findWithdrawTx: async(order) => { //  !!!TODO - check all variants!
        var outTx = null;
        if (order.hashTxTo != '') outTx = await tools.findTx({ hashTx: order.hashTxTo });
        if (outTx == null) outTx = await tools.findTx({ To: order.userAddrTo });
        if (outTx == null) return;
        if (outTx.confirms == 0 && order.status.code < 5) {
            if (order.status.code < 5 || outTx.confirms > order.status.data.confirmations) mess('findTxFrom', 'exec order ' + order.exchangeTxId
             + ' withdrawal Tx confirms ' + outTx.confirms);
            order.status = {
                code: 5,
                human: twist.humans[5],
                data: {
                    confirmations: outTx.confirms,
                    wait: coins[order.symbolTo].confirmations
                }
            };
        } else if (
            order.status.code < 6 &&
            outTx.confirms >= coins[order.symbolTo].confirmations
        ) {
            order.confirmTxTo = true;
            order.sent = outTx.value;
        } else return;
        tools.saveOrder(order, 'findTxFrom');
        if (order.confirmTxTo) {
            const mess1 = 'withdraw Tx confirmed, order ' + order.exchangeTxId + ' executed successfully!';
            exec.stopWithdrawWait(order, false, mess1);
            utils.setOrderStatus(order, 6, {
                archived: true,
                confirmations: outTx.confirms,
                time: new Date()
            });
            tools.arhTx(outTx);
            tools.arhOrder(order);
            return;
        };
    },

    makeWithdraw: async(order) => {
        const valueFact = utils.calcValueFact(order);
        mess('makeWithdraw', 'order ' + order.exchangeTxId + ' exec continue: send ' +
            valueFact + order.symbolTo + ' to user');
        if ((order.status).code != 3) utils.setOrderStatus(order, 3, { reason: 'retake order by restart service', time: new Date });
        var outTx = await methods.makeWithdrawTX(order, valueFact);
        if (outTx == null || outTx.data.hash == null) {
            const mess1 = 'withdraw Tx not created attempt ' + order.attemptCount.toString();
            order.waitConfirm = false;
            if (order.attemptCount++ < twist.withAtt) return;
            exec.stopWithdrawWait(order, true, mess1);
            utils.setOrderStatus(order, 7, { code: 3, reason: mess1, time: new Date() })
            tools.arhOrder(order);
            return;
        } else {
            if (outTx.data.hash.length > 15) {
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
            order.waitConfirm = true;
            mess('makeWithdraw', order.symbolTo + ' Tx created, hash ' + outTx.data.hash);
            utils.setOrderStatus(order, 4, { hash: outTx.data.hash, time: new Date() });
        };
    },

    stopWithdrawWait: (order, err, mess1) => {
        clearTimeout(order.ttlTimeOut);
        clearInterval(order.myInterval);
        methods.awaitWithdraw(order, 'stop')
        if (err) return myErrorHandler('stopWithdrawWait order ' + order.exchangeTxId + ' ' + mess1);
        mess('stopWithdrawWait ' + order.exchangeTxId, mess1);
    }
};