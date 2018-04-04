/*!
 * @title orderUtils.js - service functions for orderExec.js
 * @dev Basic implementaion of service functions for orders exec functions  
 * MIT Licensed Copyright(c) 2018-2019
 */

//  file 
//  local variables and function for order.js routes of twist exchange
module.exports = {

    newOrder: async function(data, res) {
        if (!utils.validateUser(data.userID, res)) return;
        if (!utils.validateCoins(data.symbolFrom, data.valueFrom, data.symbolTo, data.valueTo, res)) return;
        const userID = data.userID,
            userAddrRefund = normilizeAddr(data.symbolFrom, data.userAddrRefund),
            symbolFrom = data.symbolFrom,
            valueFrom = valueToFix(data.valueFrom),
            userAddrTo = normilizeAddr(data.symbolTo, data.userAddrTo),
            symbolTo = data.symbolTo,
            valueTofromUser = valueToFix(data.valueTo);
        const ratio = valueToFix(coins[symbolTo].price / coins[symbolFrom].price);
        const valueTo = valueToFix(valueFrom / ratio);
        const time = new Date().getTime();
        const addrTo = await tools.getAddressTo(symbolFrom, userID);
        var order = new Order({
            exchangeTxId: time.toString(),
            createDateUTC: time,
            ttl: twist.ttl,
            status: { code: 0, human: twist.humans[0], data: { time: new Date() } },
            exchangeRatio: ratio,
            userID: userID,
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
            symbol: symbolFrom,
            amount: valueFrom,
            received: 0.0,
            sent: 0.0
        });
        order.save(function(err) {
            if (err)
                return myErrorHandler(
                    'newOrder: order ID ' + order.exchangeTxId + ' save1 ' + err,
                    res
                );
            // Order is saved to DB and added to executed orders array
            coins[symbolTo].reserv = coins[symbolTo].reserv + valueTo;
            execOrders[execOrders.length] = { id: order.exchangeTxId, time: new Date(), status: 0 }
            exec.takeOrder(order);
            res.json({
                error: false,
                order: order
            });
        });
    },

    startDepositWait: function(order) {
        mess('startDepositWait', 'order id ' +
            order.exchangeTxId +
            ' awaiting deposit starts now');
        var myInterval;
        //  awaiting deposit timer
        var ttlTimeOut = setTimeout(function() {
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
        myInterval = setInterval(function() {
            if (coins[order.symbolFrom].canReceive)
                utils.findTxTo(order, myInterval, ttlTimeOut)
            else {
                //                tools.setOrderStatus(order, order.status.code + 10, { reason: 'awaitDeposit service not aviable', time: new Date() })
            }
        }, 20000);
    },

    findTxTo: async function(order, interval, timeout) {
        var depositIsFind = false;
        if (order.hashTxFrom == '') {
            incTx = await Tx.findOne({ To: order.exchangeAddrTo }).exec()
                .catch((err) => {
                    myErrorHandler('findTxTo: exec order ' +
                        order.exchangeTxId +
                        ' Tx find, ' +
                        err
                    )
                })
        } else {
            incTx = await Tx.findOne({ hashTx: order.hashTxFrom }).exec()
                .catch((err) => {
                    myErrorHandler('findTxTo: exec order ' +
                        order.exchangeTxId +
                        ' Tx find, ' +
                        err
                    )
                })
        };
        if (incTx == null) return;
        if (incTx.confirms == 0 && order.status.code < 3) {
            if (order.status.code == 1 || incTx.confirms > order.status.data.confirmations) mess('findTxTo', 'exec order ' + order.exchangeTxId + ' Tx ' +
                incTx.hashTx + ' confirms ' + incTx.confirms);
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
        order.hashTxFrom = incTx.hashTx;
        order.userAddrFrom = incTx.addrFrom;
        tools.saveOrder(order, 'findTxTo');
        if (order.status.code == 3) {
            clearTimeout(timeout);
            clearInterval(interval);
            utils.stopDepositWait(order);
            tools.arhTx(incTx);
            mess('findTxTo', 'exec order ' +
                order.exchangeTxId + ' Tx ' +
                incTx.hashTx + ' confirmed '
            );
            return utils.makeRefund(order);
        };
        if (!depositIsFind) {
            depositIsFind = true;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                clearInterval(interval);
                utils.stopDepositWait(order);
                myErrorHandler(
                    'startDepositWait: order ' +
                    order.exchangeTxId +
                    ' deposit to ' +
                    order.exchangeAddrTo +
                    ' not confirmed in confirmation period'
                );
                tools.setOrderStatus(order, 7, { code: 2, reason: 'deposit not confirmed in ' + twist.waitConfirmPeriod + 'min. period', time: new Date() })
                tools.arhOrder(order);
            }, twist.waitConfirmPeriod * 60000);
        };
    },

    stopDepositWait: function(order) {
        methods.awaitDeposit(order, 'stop');
    },

    /// TODO !!!
    makeRefund: function(order, res) {
        if (order.symbolTo.substr(0,2) == 'ET' && (order.userAddrTo.substr(0,2)!= '0x')) order.userAddrTo = '0x' + order.userAddrTo;
        const valueFact = utils.calcValueFact(order)
        mess('makeRefund', 'order ' +
            order.exchangeTxId + ' exec continue: send ' +
            valueFact + order.symbolTo + ' to user');
        var jsonData = JSON.stringify({
            from: coins[order.symbolFrom].walletFrom, // account name in api microservice
            to: order.userAddrTo,
            value: valueFact
        });
        axios.get(coins[order.symbolTo].api + 'makeTxAddrs/' + jsonData) //
            .then(async function(outTx) {
                order.status = {
                    code: 4,
                    human: twist.humans[4],
                    data: { hash: outTx.data.hash }
                };
                order.hashTxTo = outTx.data.hash;
                if (res) res.json({ error: false, hash: outTx.data.hash });
                order.save(function(err) {
                    if (err)
                        return myErrorHandler(
                            'makeTxTo: exec order ' +
                            order.exchangeTxId +
                            ' save, ' +
                            err
                        );
                });
                mess('makeRefund', ' exec order ' +
                    order.exchangeTxId +
                    ': to user Tx hash ' +
                    order.hashTxTo
                ); //  !!!TODO correct awat Tx to user
                var tx = {
                    addrFrom: '',
                    hashTx: order.hashTxTo,
                    orderID: order.exchangeTxId,
                    createDateUTC: '',
                    confirms: 0,
                    value: valueFact,
                    To: order.userAddrTo
                };
                incomingTx(tx);
                startRefundWait(order);

                /*                axios
                                    .get(coins[order.symbolTo].api + 'waitTx/' + outTx.data.hash)
                                    .then(function(h) {
                                        mess('makeRefund',
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
                                            data: { archived: true, time: new Date() }
                                        };
                                        order.confirmTxTo = true;
                                        order.sent = valueFact;
                                        tools.arhOrder(order);
                                        mess('makeRefund', 'exec order ' + order.exchangeTxId + ' finished successfully!');
                                    })
                                    .catch((err) => {
                                        myErrorHandler(
                                            'makeRefund: exec order ' +
                                            order.exchangeTxId +
                                            ' Tx to ' +
                                            order.exchangeAddrTo +
                                            ' not confirmed, ' +
                                            err
                                        );
                                    }); */
            })
            .catch((err) => {
                myErrorHandler(
                    'exec order ' +
                    order.exchangeTxId +
                    ': Tx to ' +
                    order.exchangeAddrTo +
                    ' not created, ' +
                    err, res
                );
            });
    },

    //  TODO!!!!!
    startRefundWait: async function(order) {
        resp = await methods.awaitRefund(order, 'start');
        if (!resp || resp.error) return;
        mess('waitRefund', 'order ' +
            order.exchangeTxId +
            ' : awaiting refund confirmation starts');
        var myInterval;
        var ttlTimeOut = setTimeout(function() {
            clearInterval(myInterval);
            utils.stopRefundWait(order);
            myErrorHandler(
                'waitRefund: order ' +
                order.exchangeTxId +
                ' refund to ' +
                order.userAddrTo +
                ' not confirmed in confirmation period'
            );
            tools.setOrderStatus(order, 7, { code: 4, reason: 'refund not confirmed in ' + twist.waitConfirmPeriod + 'min. period', time: new Date() })
        }, twist.waitConfirmPeriod * 60000);
        myInterval = setInterval(function() {
            if (coins[order.symbolTo].enabled)
                utils.findTxFrom(order, myInterval, ttlTimeOut)
            else {
                //                tools.setOrderStatus(order, order.status.code + 10, { reason: 'awaitDeposit service not aviable', time: new Date() })
            }
        }, 20000);
    },


    stopRefundWait: function(order, timers) {
        methods.refund('stop', order)
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
    },

    findTxFrom: async function(order, interval, timeout) {
        if (order.hashTxTo == '') {
            outTx = await Tx.findOne({ To: order.userAddrTo }).exec()
                .catch((err) => {
                    myErrorHandler('findTxFrom: exec order ' +
                        order.exchangeTxId +
                        ' Tx find, ' +
                        err
                    )
                })
        } else {
            outTx = await Tx.findOne({ hashTx: order.hashTxTo }).exec()
                .catch((err) => {
                    myErrorHandler('findTxFrom: exec order ' +
                        order.exchangeTxId +
                        ' Tx find, ' +
                        err
                    )
                })
        };
        if (outTx = null) return;
        if (outTx.confirms == 0 && order.status.code < 5) {
            if (order.status.code < 5 || outTx.confirms > order.status.data.confirmations) mess('findTxFrom', 'exec order ' + order.exchangeTxId + ' Tx ' +
                outTx.hashTx + ' confirms ' + outTx.confirms);
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
            order.status = {
                code: 6,
                human: twist.humans[6],
                data: {
                    archived: true,
                    confirmations: outTx.confirms,
                    time: new Date()
                }
            };
            order.confirmTxTo = true;
            order.sent = outTx.value;
        } else return;
        tools.saveOrder(order, 'findTxFrom');
        if (order.status.code == 6) {
            clearTimeout(timeout);
            clearInterval(interval);
            utils.stopRefundWait(order);
            mess('findTxFrom', 'exec order ' +
                order.exchangeTxId + ' Tx ' +
                outTx.hashTx + ' confirmed '
            );
            tools.arhOrder(order);
            mess('makeRefund', 'exec order ' + order.exchangeTxId + ' finished successfully!');
            return;
        };
    },

    validateCoins: function(symbolFrom, valueFrom, symbolTo, valueTo, res) {
        if (coins[symbolFrom].testnet != coins[symbolTo].testnet)
            return myErrorHandler('newOrder: twist can not exchange real coins for testnet coins', res);
        if (!coins[symbolFrom].canReceive)
            return myErrorHandler('newOrder: twist can not receive ' + symbolFrom, res);
        if (!coins[symbolTo].canSend)
            return myErrorHandler('newOrder: twist can not send' + symbolTo, res);
        if (!coins[symbolFrom].enabled)
            return myErrorHandler('newOrder: ' + symbolFrom + ' api not enabled', res);
        if (coins[symbolFrom].price == 0)
            return myErrorHandler('newOrder: ' + symbolFrom + ' price not enabled', res);
        if (valueFrom * coins[symbolFrom].price > twist.maxLimit)
            return myErrorHandler('newOrder: twist max limit $' + twist.maxLimit.toString() + ' exceeded', res);
        if (valueFrom * coins[symbolFrom].price < twist.minLimit)
            return myErrorHandler('newOrder: order amount less twist min limit $' + twist.minLimit.toString(), res);
        if (!coins[symbolTo].enabled)
            return myErrorHandler('newOrder: ' + symbolTo + ' api not enabled', res);
        if (coins[symbolTo].price == 0)
            return myErrorHandler('newOrder: ' + symbolTo + ' price not enabled', res);
        if (coins[symbolTo].balance <
            valueTo + coins[symbolTo].minerFee + coins[symbolTo].reserv
        ) return myErrorHandler('newOrder: insufficient funds ' + symbolTo, res);
        return true;
    },

    validateUser: async function(userID, res) {
        return await Order.findOne({ userID: userID }).exec(async function(err, order) {
            if (err) return myErrorHandler('validateUser order.findOne  ' + err, res);
            if (order != null) return myErrorHandler('newOrder: user have executed order ID ' + order.exchangeTxId, res);
            return true;
        });
    },

    normilizeAddr: function(coin, address) {
        if (coin.substr(0,2) != 'ET') return address;
        address = address.toLowerCase();
        if (address.substr(0,2)!= '0x') address = '0x' + address;
        return address;
    },

    //  find orderId in array of executed orders
    orderToInd: function(oid) {
        for (ind = 0; ind < execOrders.length; ind++) {
            if (execOrders[ind].id == oid) return ind;
        };
        return -1;
    },

    rmOrderFromArray: function(oid) {
        var ind = this.orderToInd(oid);
        if (ind > -1) execOrders.splice(ind, 1)
    },

    calcValueFact: function(order) {
        var change, valueFact;
        valueFact = valueToFix(order.received / order.exchangeRatio);
        change = valueToFix(
            order.received - twist.maxLimit / coins[order.symbolFrom].price
        );
        if (change > coins[order.symbolFrom].minerFee * 2) {
            //  change must be more 2 x minerFee
            valueFact = valueToFix(twist.maxLimit / coins[order.symbolTo].price);
            //        var changeOrder = new Order();
            //        makeChange(changeOrder, change - minerFee);
            //  !!!!TODO - возможно новый статус ордера
            mess('makeRefund', 'twist must send change ' + change + order.symbolFrom + ' to user');
        };
        return valueFact;
    }

}