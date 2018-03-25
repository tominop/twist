//  file order_utils.js
//  local variables and function for order.js routes of twist exchange
module.exports = {
newOrder: function (data, res) {
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
        return myErrorHandler("newOrder: twist can not receive " + symbolFrom, res);
    if (!coins[symbolTo].canSend)
        return myErrorHandler("newOrder: twist can not send" + symbolTo, res);
    if (!coins[symbolFrom].enabled)
        return myErrorHandler("newOrder: " + symbolFrom + " api not enabled", res);
    if (coins[symbolFrom].price == 0)
        return myErrorHandler(
            "newOrder: " + symbolFrom + " price not enabled",
            res
        );
    if (!coins[symbolTo].enabled)
        return myErrorHandler("newOrder: " + symbolTo + " api not enabled", res);
    if (coins[symbolTo].price == 0)
        return myErrorHandler("newOrder: " + symbolTo + " price not enabled", res);
    if (
        coins[symbolTo].balance <
        valueTo + coins[symbolTo].minerFee + coins[symbolTo].reserv
    )
        return myErrorHandler("newOrder: insufficient funds " + symbolTo, res);
    Order.findOne({ userID: userID }).exec(function (err, order) {
        if (err)
            return myErrorHandler(
                "newOrder: order.findOne promise1 " + err.message,
                res
            );
        if (order != null)
            return myErrorHandler(
                "newOrder: user have executed order ID " + order.exchangeTxId,
                res
            );
        const time = new Date().getTime();
        var order = new Order({
            exchangeTxId: time.toString(),
            createDateUTC: time,
            ttl: twist.ttl,
            status: { code: 1, human: twist.humans[1], data: { time: timeNow() } },
            exchangeRatio: ratio,
            userID: userID,
            userAddrFrom: userAddrFrom,
            symbolFrom: symbolFrom,
            valueFrom: valueFrom,
            hashTxFrom: "",
            confirmTxFrom: false,
            userAddrTo: userAddrTo,
            symbolTo: symbolTo,
            valueTo: valueTo,
            hashTxTo: "",
            confirmTxTo: false,
            exchangeAddrTo: coins[symbolFrom].addressTo,
            symbol: symbolFrom,
            amount: valueFrom,
            received: 0.0,
            sent: 0.0
        });
        coins[symbolTo].reserv = coins[symbolTo].reserv + valueTo;
        order.save(function (err) {
            if (err)
                return myErrorHandler(
                    "newOrder: order ID " + order.exchangeTxId + " save1 " + err.message,
                    res
                );
            // Order is saved to DB
            res.json({
                error: false,
                order: order
            });
            eXecute(order);
        });
    });
},

eXecute: function (order) {
    mess(" order " + order.exchangeTxId + " exec starts");
    //  Start awaiting deposit (incoming Tx hook service)

    var error = true;
    var myInterval;
    var timeOut = setTimeout(function () {
        clearInterval(myInterval);
        myErrorHandler(
            "eXecute: exec order " +
            order.exchangeTxId +
            ": service " +
            order.symbolFrom +
            " not aviable"
        );
    }, 60000);
    myInterval = setInterval(function () {
        if (!error) {
            waitTxFrom(order);
            clearInterval(myInterval);
            clearTimeout(timeOut);
        }
    }, 10000);
    error = runMethod('startAwaitDeposit', order);
},

waitTxFrom: function (order) {
    console.log(
        timeNow() +
        " exec order " +
        order.exchangeTxId +
        " : wait incoming Tx starts"
    );
    var myInterval,
        newTx = true;
    var ttlTimeOut = setTimeout(function () {
        clearInterval(myInterval);
        myErrorHandler(
            "waitTxFrom: exec order " +
            order.exchangeTxId +
            " TX from " +
            order.userAddrFrom +
            " not receaved in ttl period"
        );
        incomingTxStop(order);
        order.status = {
            code: 7,
            human: twist.humans[7],
            data: { reason: "deposit not received in " + twist.ttl + "min. period" }
        };
        order.save(function (err) {
            if (err)
                return myErrorHandler(
                    "waitTxFrom: exec order " +
                    order.exchangeTxId +
                    " save1, " +
                    err.message,
                    res
                );
            arhOrder(order);
        });
    }, order.ttl * 60000);
    myInterval = setInterval(function () {
        findTxFrom(order, myInterval, ttlTimeOut);
    }, 20000);
},

findTxFrom: function (order, interval, timeout) {
    TX.findOne({ addrFrom: order.userAddrFrom }).exec(function (err, incTx) {
        if (err)
            return myErrorHandler(
                "findTxFrom: exec order " +
                order.exchangeTxId +
                " Tx find, " +
                err.message
            );
        if (incTx != null) {
            if (incTx.confirms == 0 && order.status.code == 1) {
                order.status = {
                    code: 2,
                    human: twist.humans[2],
                    data: {
                        confirmations: incTx.confirms,
                        wait: coins[order.symbolFrom].confirmations
                    }
                };
                console.log(
                    timeNow() +
                    " findTxFrom: exec order " +
                    order.exchangeTxId +
                    " Tx " +
                    incTx.hashTx +
                    " confirms " +
                    incTx.confirms
                );
            } else if (
                order.status.code < 3 &&
                incTx.confirms > 0 &&
                incTx.confirms < coins[order.symbolFrom].confirmations
            )
                order.status = {
                    code: 2,
                    human: twist.humans[2],
                    data: {
                        confirmations: incTx.confirms,
                        wait: coins[order.symbolFrom].confirmations
                    }
                };
            else if (
                order.status.code < 3 &&
                incTx.confirms >= coins[order.symbolFrom].confirmations
            ) {
                order.status = {
                    code: 3,
                    human: twist.humans[3],
                    data: { time: timeNow() }
                };
                order.confirmTxFrom = true;
                order.received = incTx.value;
                console.log(
                    timeNow() +
                    " findTxFrom: exec order " +
                    order.exchangeTxId +
                    " Tx " +
                    incTx.hashTx +
                    " confirms " +
                    incTx.confirms
                );
            } else return;
            order.hashTxFrom = incTx.hashTx;
            clearTimeout(timeout);
            order.save(function (err) {
                if (err)
                    return myErrorHandler(
                        "findTxFrom: exec order " +
                        order.exchangeTxId +
                        " save Order error - " +
                        err.message,
                        res
                    );
            });
            if (order.status.code >= 3) {
                incTx.orderID = order.exchangeTxId;
                incTx.save(function (err) {
                    if (err)
                        return myErrorHandler(
                            "findTxFrom: exec order " +
                            order.exchangeTxId +
                            " save Order error - " +
                            err.message
                        );
                });
                arhTx(incTx);
                incomingTxStop(order);
                makeTxTo(order);
                clearInterval(interval);
            }
        }
    });
},

incomingTxStop: function (order) {
    coins[order.symbolTo].reserv = coins[order.symbolTo].reserv - order.valueTo;
    axios
        .get(coins[order.symbolFrom].api + "waitTxStop/" + order.exchangeAddrTo) //
        .then(function () {
            console.log(
                timeNow() +
                " findTxFrom: exec order " +
                order.exchangeTxId +
                " wait incoming Tx stops"
            );
        })
        .catch(function (err) {
            myErrorHandler(
                "findTxFrom: exec order " +
                order.exchangeTxId +
                " Tx to " +
                order.exchangeAddrTo +
                " stop error - " +
                err.message
            );
        });
},

/// TODO !!!
makeTxTo: function (order) {
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
            " twist must send change " + change + order.symbolFrom + " to user"
        );
    }
    console.log(
        timeNow() +
        " order " +
        order.exchangeTxId +
        " exec continue: send " +
        valueFact +
        order.symbolTo +
        " to user"
    );
    var jsonData = JSON.stringify({
        from: coins[order.symbolFrom].walletFrom, // account name in api microservice
        to: order.userAddrTo,
        value: valueFact
    });
    axios
        .get(coins[order.symbolTo].api + "makeTxAddrs/" + jsonData) //
        .then(function (outTx) {
            order.status = {
                code: 4,
                human: twist.humans[4],
                data: { hash: outTx.data.hash }
            };
            order.hashTxTo = outTx.data.hash;
            order.save(function (err) {
                if (err)
                    return myErrorHandler(
                        "makeTxTo: exec order " +
                        order.exchangeTxId +
                        " save, " +
                        err.message
                    );
            });
            console.log(
                timeNow() +
                " exec order " +
                order.exchangeTxId +
                ": to user Tx hash " +
                order.hashTxTo
            ); //  !!!TODO correct awat Tx to user
            axios
                .get(coins[order.symbolTo].api + "waitTx/" + outTx.data.hash)
                .then(function (h) {
                    console.log(
                        timeNow() +
                        " exec order " +
                        order.exchangeTxId +
                        ": " +
                        coins[order.symbolTo].symbol +
                        " Tx confirmed in block " +
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
                        timeNow() + " exec order " + order.exchangeTxId + " finished!"
                    );
                })
                .catch(function (err) {
                    myErrorHandler(
                        "makeTxTo: exec order " +
                        order.exchangeTxId +
                        " Tx to " +
                        order.userAddrFrom +
                        " not confirmed, " +
                        err.message
                    );
                });
        })
        .catch(function (err) {
            myErrorHandler(
                "exec order " +
                order.exchangeTxId +
                ": Tx to " +
                order.userAddrFrom +
                " not created, " +
                err.message
            );
        });
}
}