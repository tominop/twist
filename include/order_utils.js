//  file order_utils.js
//  local variables and function for order.js routes of twist exchange
const Order = require("../models/orders"),
    TX = require("../models/transactions");

newOrder = function(data, res) {
    const userID = data.userID,
        userAddrFrom = data.userAddrFrom,
        symbolFrom = data.symbolFrom,
        valueFrom = data.valueFrom,
        userAddrTo = data.userAddrTo,
        symbolTo = data.symbolTo,
        valueTo = data.valueTo;
    Order.findOne({ userID: userID }).exec(function(err, order) {
        if (err)
            return myErrorHandler("Order.findOne promise1: " + err.message, res);
        if (order != null)
            return myErrorHandler(
                "user have executed order ID " + order.exchangeTxId,
                res
            );
        const time = new Date().getTime();
        var order = new Order({
            exchangeTxId: time.toString(),
            createDateUTC: time,
            ttl: twist.ttl,
            status: 1,
            exchangeRate: 0.86,
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
            exchangeAddrTo: twist.btcAddrs,
            symbol: symbolFrom,
            amount: valueFrom
        });
        order.save(function(err) {
            if (err)
                return myErrorHandler(
                    "order ID " + order.exchangeTxId + " save1: " + err.message,
                    res
                );
            // Order is saved to DB
            res.json({
                error: false,
                order: order
            });
            order.eXecute(myErrorHandler);
        });
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
        if (err) return myErrorHandler("findOrderByAddr exec1: " + err.message, res);
        if (order == null) {
            Order.findOne({ userAddrTo: addr }).exec(function(err, order) {
                if (err) return myErrorHandler("findOrderByAddr exec2: " + err.message, res);
                if (order == null) return res.json({ error: true, response: "order not foud" });
                //  console.log('Order ' + orderID + '  %s', order.status.toString());
                res.json({ error: false, order: order });
            });
        } else {
            //  console.log('Order ' + orderID + '  %s', order.status.toString());
            res.json({ error: false, order: order });
        }
    });
};

Order.prototype.waitTxFrom = function() {
    console.log(
        timeNow() + "exec order " + this.exchangeTxId + " : wait incoming Tx starts"
    );
    var myInterval,
        newTx = true;
    var order = this;
    var ttlTimeOut = setTimeout(function() {
        clearInterval(myInterval);
        myErrorHandler(
            "exec order " +
            order.exchangeTxId +
            ": TX from " +
            order.userAddrFrom +
            " not receaved in ttl period"
        );
        //        incomingTxStop(order.symbolFrom);
        order.status = 8;
        order.save(function(err) {
            if (err)
                return myErrorHandler(
                    "exec order " + order.exchangeTxId + " save1: " + err.message,
                    res
                );
        });
    }, order.ttl * 60000);
    myInterval = setInterval(function() {
        order.findTxFrom(myInterval, ttlTimeOut);
    }, 20000);
};

Order.prototype.findTxFrom = function(interval, timeout) {
    var order = this;
    TX.findOne({ addrFrom: order.userAddrFrom }).exec(function(err, incTx) {
        if (err)
            return myErrorHandler(
                "exec order " + order.exchangeTxId + " Tx find: " + err.message
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
                incTx.confirms < twist.numConfirmations
            )
                order.status = 3;
            else if (order.status < 4 && incTx.confirms >= twist.numConfirmations) {
                order.status = 4;
                order.confirmTxFrom = true;
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
                        "exec order " + order.exchangeTxId + " save2: " + err.message,
                        res
                    );
            });
            if (order.status == 4) {
                incTx.remove(function(err) {
                    if (err)
                        return myErrorHandler(
                            "exec order " +
                            order.exchangeTxId +
                            "Tx " +
                            incTx.hash +
                            " remove: " +
                            err.message,
                            res
                        );
                    else {
                        clearTimeout(timeout);
                        clearInterval(interval);
                        order.makeTxTo("bob");
                    }
                });
            }
        }
    });
};

Order.prototype.makeTxTo = function(twistAccountName) {
    console.log(
        timeNow() +
        " order " +
        this.exchangeTxId +
        " exec continue: make Tx to user"
    );
    var order = this;
    var jsonData = JSON.stringify({
        from: twistAccountName, // account name in eth microservice
        to: order.userAddrTo,
        valueE: order.valueTo * 10 ** 18
    });
    axios
        .get(api.ETH + "makeTxAddrs/" + jsonData)
        .then(function(outTx) {
            order.status = 5;
            order.hashTxTo = outTx.data.hash;
            order.save(function(err) {
                if (err)
                    return myErrorHandler(
                        "exec order " + order.exchangeTxId + " save3: " + err.message
                    );
            });
            console.log(
                timeNow() +
                " exec order " +
                order.exchangeTxId +
                ": ETH Tx hash " +
                order.hashTxTo
            );
            axios
                .get(api.ETH + "waitTx/" + outTx.data.hash)
                .then(function(h) {
                    console.log(
                        timeNow() +
                        " exec order " +
                        order.exchangeTxId +
                        ": ETH Tx confirmed in block " +
                        h.data.block
                    );
                    order.status = 7;
                    order.confirmTxTo = true;
                    order.save(function(err) {
                        if (err)
                            return myErrorHandler(
                                "exec order " + order.exchangeTxId + " save4: " + err.message
                            );
                    });
                    console.log(
                        timeNow() + " exec order " + order.exchangeTxId + " finished!"
                    );
                })
                .catch(function(err) {
                    myErrorHandler(
                        "exec order " +
                        order.exchangeTxId +
                        ": Tx to " +
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

Order.prototype.eXecute = function() {
    console.log(timeNow() + " Order " + this.exchangeTxId + " exec starts");
    //  Start incoming Tx service
    var host;
    if (this.symbolFrom == "ETH") host = api.ETH;
    else if (this.symbolFrom == "BTC") host = api.BTC;
    else return false;
    var error = true;
    host = host + "ws/" + this.exchangeAddrTo;
    order = this;
    var myInterval;
    var timeOut = setTimeout(function() {
        clearInterval(myInterval);
        myErrorHandler(
            "exec order " +
            order.exchangeTxId +
            ": service " +
            order.symbolFrom +
            " error2"
        );
    }, 20000);
    myInterval = setInterval(function() {
        if (!error) {
            order.waitTxFrom();
            clearInterval(myInterval);
            clearTimeout(timeOut);
        }
    }, 1000);
    axios
        .get(host)
        .then(resp => {
            error = resp.error;
        })
        .catch(err => {
            myErrorHandler(
                "exec order " +
                order.exchangeTxId +
                ": service " +
                order.symbolFrom +
                " error1"
            );
        });
};