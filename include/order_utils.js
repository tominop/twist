//  file order_utils.js
//  local variables and function for order.js routes of twist exchange
const Order = require("../models/orders"),
    ArhOrder = require("../models/orders"),
    TX = require("../models/transactions");

newOrder = function(data, res) {
    const userID = data.userID,
        userAddrFrom = data.userAddrFrom,
        symbolFrom = data.symbolFrom,
        valueFrom = valueToFix(data.valueFrom),
        userAddrTo = data.userAddrTo,
        symbolTo = data.symbolTo,
        valueTofromUser = valueToFix(data.valueTo);
    Order.findOne({ userID: userID }).exec(function(err, order) {
        if (err)
            return myErrorHandler("newOrder: order.findOne promise1 " + err.message, res);
        if (order != null)
            return myErrorHandler(
                "newOrder: user have executed order ID " + order.exchangeTxId,
                res
            );
        const time = new Date().getTime(),
            ratio = valueToFix(coins[symbolTo].price / coins[symbolFrom].price);
        var order = new Order({
            exchangeTxId: time.toString(),
            createDateUTC: time,
            ttl: twist.ttl,
            status: 1,
            exchangeRatio: raito,
            userID: userID,
            userAddrFrom: userAddrFrom,
            symbolFrom: symbolFrom,
            valueFrom: valueFrom,
            hashTxFrom: "",
            confirmTxFrom: false,
            userAddrTo: userAddrTo,
            symbolTo: symbolTo,
            valueTo: valueToFix(valueFrom * ratio),
            hashTxTo: "",
            confirmTxTo: false,
            exchangeAddrTo: coins[symbolFrom].addressTo,
            symbol: symbolFrom,
            amount: valueFrom,
            recieved: 0,
            sends: 0
        });
        order.save(function(err) {
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
};

eXecute = function(order) {
    console.log(timeNow() + " order " + order.exchangeTxId + " exec starts");
    //  Start incoming Tx service
    var url = coins[order.symbolFrom].api;
    var error = true;
    url =
        url +
        "waitTwistTx/" +
        JSON.stringify({
            addrs: order.exchangeAddrTo,
            confirms: coins[order.symbolFrom].confirmations
        });
    var myInterval;
    var timeOut = setTimeout(function() {
        clearInterval(myInterval);
        myErrorHandler(
            "eXecute: exec order " +
            order.exchangeTxId +
            ": service " +
            order.symbolFrom +
            " error2"
        );
    }, 20000);
    myInterval = setInterval(function() {
        if (!error) {
            waitTxFrom(order);
            clearInterval(myInterval);
            clearTimeout(timeOut);
        }
    }, 1000);
    axios
        .get(url)
        .then(resp => {
            error = resp.error;
        })
        .catch(err => {
            myErrorHandler(
                "eXecute: exec order " +
                order.exchangeTxId +
                " service " +
                order.symbolFrom +
                err.message
            );
        });
};

waitTxFrom = function(order) {
    console.log(
        timeNow() +
        "exec order " +
        order.exchangeTxId +
        " : wait incoming Tx starts"
    );
    var myInterval,
        newTx = true;
    var ttlTimeOut = setTimeout(function() {
        clearInterval(myInterval);
        myErrorHandler(
            "waitTxFrom: exec order " +
            order.exchangeTxId +
            " TX from " +
            order.userAddrFrom +
            " not receaved in ttl period"
        );
        //        incomingTxStop(order.symbolFrom);
        order.status = 8;
        order.save(function(err) {
            if (err)
                return myErrorHandler(
                    "waitTxFrom: exec order " + order.exchangeTxId + " save1, " + err.message,
                    res
                );
        });
    }, order.ttl * 60000);
    myInterval = setInterval(function() {
        findTxFrom(order, myInterval, ttlTimeOut);
    }, 20000);
};

findTxFrom = function(order, interval, timeout) {
    TX.findOne({ addrFrom: order.userAddrFrom }).exec(function(err, incTx) {
        var numConfirmations = coins[order.symbolFrom].confirmations;
        if (err)
            return myErrorHandler(
                "findTxFrom: exec order " + order.exchangeTxId + " Tx find, " + err.message
            );
        if (incTx != null) {
            if (incTx.confirms == 0 && order.status == 1) {
                order.status = 2;
                console.log(
                    timeNow() +
                    "exec order " +
                    order.exchangeTxId +
                    " Tx : " +
                    incTx.hashTx +
                    " confirms :" +
                    incTx.confirms
                );
            } else if (
                order.status < 3 &&
                incTx.confirms > 0 &&
                incTx.confirms < numConfirmations
            )
                order.status = 3;
            else if (order.status < 4 && incTx.confirms >= numConfirmations) {
                order.status = 4;
                order.confirmTxFrom = true;
                order.recieved = incTx.value;
                console.log(
                    timeNow() +
                    "exec order " +
                    order.exchangeTxId +
                    " Tx : " +
                    incTx.hashTx +
                    " confirms :" +
                    incTx.confirms
                );
            } else return;
            order.hashTxFrom = incTx.hashTx;
            order.save(function(err) {
                if (err)
                    return myErrorHandler(
                        "findTxFrom: exec order " + order.exchangeTxId + " save2, " + err.message,
                        res
                    );
            });
            if (order.status == 4) {
                incTx.remove(function(err) {
                    if (err) myErrorHandler(
                        "findTxFrom: exec order " +
                        order.exchangeTxId +
                        "Tx " +
                        incTx.hash +
                        " remove, " +
                        err.message,
                        res
                    );
                    clearTimeout(timeout);
                    clearInterval(interval);
                    makeTxTo(order);

                });
            }
        }
    });
};

/// TODO !!!
makeTxTo = function(order) {
    console.log(
        timeNow() +
        " order " +
        order.exchangeTxId +
        " exec continue: make Tx to user"
    );
    var jsonData = JSON.stringify({
        from: coins[order.symbolFrom].walletFrom, // account name in eth microservice
        to: order.userAddrTo,
        value: valueToFix(order.recieved * order.exchangeRatio)
    });
    axios
        .get(coins[order.symbolTo].api + "makeTxAddrs/" + jsonData) // 
        .then(function(outTx) {
            order.status = 5;
            order.hashTxTo = outTx.data.hash;
            order.save(function(err) {
                if (err)
                    return myErrorHandler(
                        "makeTxTo: exec order " + order.exchangeTxId + " save, " + err.message
                    );
            });
            console.log(
                timeNow() +
                " exec order " +
                order.exchangeTxId +
                ": to user Tx hash " +
                order.hashTxTo
            );
            axios
                .get(coins[order.symbolTo].api + "waitTx/" + outTx.data.hash)
                .then(function(h) {
                    console.log(
                        timeNow() +
                        " exec order " +
                        order.exchangeTxId +
                        ": " + coins[order.symbolTo].symbol + " Tx confirmed in block " +
                        h.data.block
                    );
                    order.status = 7;
                    order.confirmTxTo = true;
                    order.sends =
                        arhorder = new ArhOrder(order);
                    arhorder.save(function(err) {
                        if (err)
                            return myErrorHandler(
                                "makeTxTo: exec order " + order.exchangeTxId + " arhorder save, " + err.message
                            );
                    });
                    order.remove(function(err) {
                        if (err)
                            return myErrorHandler("makeTxTo: order " + order.exchangeTxId +
                                +" remove, " + err.message, res);
                    });
                    console.log(
                        timeNow() + " exec order " + order.exchangeTxId + " finished!"
                    );
                })
                .catch(function(err) {
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
        .catch(function(err) {
            myErrorHandler(
                "exec order " +
                order.exchangeTxId +
                ": Tx to " +
                order.userAddrFrom +
                " not created, " +
                err.message
            );
        });
};

findOrderByID = function(oid, res) {
    Order.findOne({ exchangeTxId: oid }).exec(function(err, order) {
        if (err) return myErrorHandler("findOrderBeID exec: " + err.message, res);
        if (order == null) return myErrorHandler("order not foud", res);
        res.json({
            error: false,
            order: order
        });
    });
};

deleteOrderByID = function(oid, res) {
    Order.findOneAndRemove({ exchangeTxId: oid }).exec(function(err, order) {
        if (err) return myErrorHandler("deleteOrderBeID exec: " + err.message, res);
        if (order == null) return myErrorHandler("order not foud", res);
        res.json({ error: false });
    });
};

findOrderByAddr = function(addr, res) {
    Order.findOne({ userAddrFrom: addr }).exec(function(err, order) {
        if (err)
            return myErrorHandler("findOrderByAddr exec1: " + err.message, res);
        if (order == null) {
            Order.findOne({ userAddrTo: addr }).exec(function(err, order) {
                if (err)
                    return myErrorHandler("findOrderByAddr exec2: " + err.message, res);
                if (order == null)
                    return res.json({ error: true, response: "order not foud" });
                //  console.log('Order ' + orderID + '  %s', order.status.toString());
                res.json({ error: false, order: order });
            });
        } else {
            //  console.log('Order ' + orderID + '  %s', order.status.toString());
            res.json({ error: false, order: order });
        }
    });
};