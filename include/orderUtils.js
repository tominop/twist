//  file order_utils.js
//  local variables and function for order.js routes of twist exchange
module.exports = {

    newOrder: function(data, res) {
        const userID = data.userID,
            userAddrFrom = data.userAddrFrom,
            symbolFrom = data.symbolFrom,
            valueFrom = valueToFix(data.valueFrom),
            userAddrTo = data.userAddrTo,
            symbolTo = data.symbolTo,
            valueTofromUser = valueToFix(data.valueTo);
        const ratio = valueToFix(coins[symbolTo].price / coins[symbolFrom].price);
        const valueTo = valueToFix(valueFrom / ratio);
        if (!coins[symbolFrom].canReceive)
            return myErrorHandler('newOrder: twist can not receive ' + symbolFrom, res);
        if (!coins[symbolTo].canSend)
            return myErrorHandler('newOrder: twist can not send' + symbolTo, res);
        if (!coins[symbolFrom].enabled)
            return myErrorHandler('newOrder: ' + symbolFrom + ' api not enabled', res);
        if (coins[symbolFrom].price == 0)
            return myErrorHandler(
                'newOrder: ' + symbolFrom + ' price not enabled',
                res
            );
        if (!coins[symbolTo].enabled)
            return myErrorHandler('newOrder: ' + symbolTo + ' api not enabled', res);
        if (coins[symbolTo].price == 0)
            return myErrorHandler('newOrder: ' + symbolTo + ' price not enabled', res);
        if (
            coins[symbolTo].balance <
            valueTo + coins[symbolTo].minerFee + coins[symbolTo].reserv
        )
            return myErrorHandler('newOrder: insufficient funds ' + symbolTo, res);
        Order.findOne({ userID: userID }).exec(function(err, order) {
            if (err)
                return myErrorHandler(
                    'newOrder: order.findOne promise1 ' + err,
                    res
                );
            if (order != null)
                return myErrorHandler(
                    'newOrder: user have executed order ID ' + order.exchangeTxId,
                    res
                );
            const time = new Date().getTime();
            var order = new Order({
                exchangeTxId: time.toString(),
                createDateUTC: time,
                ttl: twist.ttl,
                status: { code: 0, human: twist.humans[0], data: { time: timeNow() } },
                exchangeRatio: ratio,
                userID: userID,
                userAddrFrom: userAddrFrom,
                symbolFrom: symbolFrom,
                valueFrom: valueFrom,
                hashTxFrom: '',
                confirmTxFrom: false,
                userAddrTo: userAddrTo,
                symbolTo: symbolTo,
                valueTo: valueTo,
                hashTxTo: '',
                confirmTxTo: false,
                exchangeAddrTo: coins[symbolFrom].addressTo,
                symbol: symbolFrom,
                amount: valueFrom,
                received: 0.0,
                sent: 0.0
            });
            coins[symbolTo].reserv = coins[symbolTo].reserv + valueTo;
            order.save(function(err) {
                if (err)
                    return myErrorHandler(
                        'newOrder: order ID ' + order.exchangeTxId + ' save1 ' + err,
                        res
                    );
                // Order is saved to DB and add to executed orders array
                execOrders[execOrder.length] = {id: exchangeTxId, time: new Date(), status: 0}
                res.json({
                    error: false,
                    order: order
                });
            });
        });
    },

    takeOrder: async function(order) {
        if (coins[order.symbolFrom].canReceive) {
            mess('take', 'order ' + order.exchangeTxId + ' exec starts');
            //  Start awaiting deposit (incoming Tx hook service)
            res = await methods.runMethod('awaitDeposit', 'start', order);
            if (!res.error) {
                //                order.waitDepositProvider = res.provider;
                tools.setOrderStatus(order, 1, { time: timeNow() });
                exec.waitDeposit(order);
            };
        };
    },



    waitDeposit: function(order) {
        mess('waitDeposit', 'order ' +
            order.exchangeTxId +
            ' : awaiting deposit starts');
        var myInterval;
        var ttlTimeOut = setTimeout(function() {
            clearInterval(myInterval);
            exec.awaitDepositStop(order);
            myErrorHandler(
                'waitDeposit: order ' +
                order.exchangeTxId +
                ' deposit from ' +
                order.userAddrFrom +
                ' not receaved in ttl period'
            );
            tools.setOrderStatus(order, 7, { code: 1, reason: 'deposit not received in ' + twist.ttl + 'min. period', time: timeNow() })
        }, order.ttl * 60000);
        myInterval = setInterval(function() {
            if (coins[order.symbolFrom].canReceive)
                exec.findTxFrom(order, myInterval, ttlTimeOut)
            else {
                tools.setOrderStatus(order, order.status.code + 10, { reason: 'awaitDeposit service not aviable', time: timeNow() })
            }
        }, 20000);
    },

    findTxFrom: async function(order, interval, timeout) {
        var depositIsFind = false;
        incTx = await Tx.findOne({ addrFrom: order.userAddrFrom }).exec()
            .catch((err) => {
                myErrorHandler('findTxFrom: exec order ' +
                    order.exchangeTxId +
                    ' Tx find, ' +
                    err
                )
            });
        if (incTx = null) return;
        if (incTx.confirms == 0 && order.status.code < 3) {
            order.status = {
                code: 2,
                human: twist.humans[2],
                data: {
                    confirmations: incTx.confirms,
                    wait: coins[order.symbolFrom].confirmations
                }
            };
            mess('findTxFrom', 'exec order ' +
                order.exchangeTxId +
                ' Tx ' +
                incTx.hashTx +
                ' confirms ' +
                incTx.confirms
            );
        } else if (
            order.status.code < 3 &&
            incTx.confirms >= coins[order.symbolFrom].confirmations
        ) {
            order.status = {
                code: 3,
                human: twist.humans[3],
                data: {
                    confirmations: incTx.confirms,
                    time: timeNow()
                }
            };
            order.confirmTxFrom = true;
            order.received = incTx.value;
        } else return;
        tools.saveOrder(order, 'findTxFrom');
        if (order.status.code == 3) {
            clearTimeout(timeout);
            clearInterval(interval);
            exec.awaitDepositStop(order);
            mess('findTxFrom', 'exec order ' +
                order.exchangeTxId + ' Tx ' +
                incTx.hashTx + ' confirmed '
            );
            return;
        };
        if (!depositIsFind) {
            depositIsFind = true;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                clearInterval(interval);
                exec.awaitDepositStop(order);
                myErrorHandler(
                    'waitDeposit: order ' +
                    order.exchangeTxId +
                    ' deposit from ' +
                    order.userAddrFrom +
                    ' not confirmed in confirm period'
                );
                tools.setOrderStatus(order, 7, { code: 2, reason: 'deposit not confirmed in ' + twist.waitConfirmPeriod + 'min. period', time: timeNow() })
            }, twist.waitConfirmPeriod * 60000);
        };
    },

    awaitDepositStop: function(order) {
        coins[order.symbolTo].reserv = coins[order.symbolTo].reserv - order.valueTo;
        methods.runMethod('awaitDeposit', 'stop', order)
            .catch((err) => {
                myErrorHandler(
                    'awaitDepositStop: exec order ' +
                    order.exchangeTxId +
                    ' Tx to ' +
                    order.exchangeAddrTo +
                    ' stop error - ' +
                    err
                );
            });
    },

    /// TODO !!!
    makeRefund: function(order) {
        var change,
            valueFact = valueToFix(order.received / order.exchangeRatio);
        change = valueToFix(
            order.received - twist.maxLimit / coins[order.symbolFrom].price
        );
        if (change > coins[order.symbolFrom].minerFee * 2) {
            //  change must be more 2 x minerFee
            valueFact = valueToFix(twist.maxLimit / coins[order.symbolTo].price);
            //        var changeOrder = new Order();
            //        makeChange(changeOrder, change - minerFee);
            console.log(
                ' twist must send change ' + change + order.symbolFrom + ' to user'
            );
        }
        console.log(
            timeNow() +
            ' order ' +
            order.exchangeTxId +
            ' exec continue: send ' +
            valueFact +
            order.symbolTo +
            ' to user'
        );
        var jsonData = JSON.stringify({
            from: coins[order.symbolFrom].walletFrom, // account name in api microservice
            to: order.userAddrTo,
            value: valueFact
        });
        axios
            .get(coins[order.symbolTo].api + 'makeTxAddrs/' + jsonData) //
            .then(function(outTx) {
                order.status = {
                    code: 4,
                    human: twist.humans[4],
                    data: { hash: outTx.data.hash }
                };
                order.hashTxTo = outTx.data.hash;
                order.save(function(err) {
                    if (err)
                        return myErrorHandler(
                            'makeTxTo: exec order ' +
                            order.exchangeTxId +
                            ' save, ' +
                            err
                        );
                });
                console.log(
                    timeNow() +
                    ' exec order ' +
                    order.exchangeTxId +
                    ': to user Tx hash ' +
                    order.hashTxTo
                ); //  !!!TODO correct awat Tx to user
                axios
                    .get(coins[order.symbolTo].api + 'waitTx/' + outTx.data.hash)
                    .then(function(h) {
                        console.log(
                            timeNow() +
                            ' exec order ' +
                            order.exchangeTxId +
                            ': ' +
                            coins[order.symbolTo].symbol +
                            ' Tx confirmed in block ' +
                            h.data.block
                        );
                        order.status = {
                            code: 6,
                            human: twist.humans[6],
                            data: { time: timeNow() }
                        };
                        order.confirmTxTo = true;
                        order.sent = valueFact;
                        arhOrder(order);
                        console.log(
                            timeNow() + ' exec order ' + order.exchangeTxId + ' finished!'
                        );
                    })
                    .catch((err) => {
                        myErrorHandler(
                            'makeTxTo: exec order ' +
                            order.exchangeTxId +
                            ' Tx to ' +
                            order.userAddrFrom +
                            ' not confirmed, ' +
                            err
                        );
                    });
            })
            .catch((err) => {
                myErrorHandler(
                    'exec order ' +
                    order.exchangeTxId +
                    ': Tx to ' +
                    order.userAddrFrom +
                    ' not created, ' +
                    err
                );
            });
    },

    //  TODO!!!!!
    waitRefund: function(order) {

        mess('waitDeposit', 'order ' +
            order.exchangeTxId +
            ' : awaiting deposit starts');
        return
        var myInterval;
        var ttlTimeOut = setTimeout(function() {
            clearInterval(myInterval);
            exec.awaitDepositStop(order);
            myErrorHandler(
                'waitDeposit: order ' +
                order.exchangeTxId +
                ' deposit from ' +
                order.userAddrFrom +
                ' not receaved in ttl period'
            );
            tools.setOrderStatus(order, 7, { code: 1, reason: 'deposit not received in ' + twist.ttl + 'min. period', time: timeNow() })
        }, order.ttl * 60000);
        myInterval = setInterval(function() {
            if (!order.waitDepositProvider == '')
                exec.findTxFrom(order, myInterval, ttlTimeOut)
            else {
                tools.setOrderStatus(order, order.status.code + 10, { reason: 'awaitDeposit service not aviable', time: timeNow() })
            }
        }, 20000);
    },

    //  TODO!!!!!
    checkRefundStatus: async function(order) {
        if (coins[order.symbolFrom].canReceive) {
            res = await methods.runMethod('awaitDeposit', 'check', order)
            if (!res.error) return
                //  need restart awaitDeposit
            res = await methods.runMethod('awaitDeposit', 'start', order);
            if (res.error) order.waitDepositProvider = ''
            else order.waitDepositProvider = res.provider;
        } else order.waitDepositProvider = '';
        tools.saveOrder(order, 'checkRefundStatus');
    }


}