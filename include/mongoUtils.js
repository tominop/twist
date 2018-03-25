//  file mongoUtils.js

module.exports = {

//  Order mongo utils

    getOrders: function (res) {
        Order.find({}).exec(function (err, orders) {
            if (err) return myErrorHandler("getOrders exec: " + err.message, res);
            if (orders == null || orders[0] == null)
                return myErrorHandler("orders not foud", res);
            res.json({
                error: false,
                orders: orders
            });
        });
    },

    findOrderByID: function (oid, res) {
        Order.findOne({ exchangeTxId: oid }).exec(function (err, order) {
            if (err) return myErrorHandler("getOrderByID exec: " + err.message, res);
            if (order == null) {
                ArhOrder.findOne({ exchangeTxId: oid }).exec(function (err, order) {
                    if (err)
                        return myErrorHandler("getOrderByID exec: " + err.message, res);
                    if (order == null) return myErrorHandler("order not foud", res);
                    res.json({
                        error: false,
                        order: order
                    });
                });
            } else {
                res.json({
                    error: false,
                    order: order
                });
            }
        });
    },

    findOrderByAddr: function (addr, res) {
        Order.findOne({ userAddrFrom: addr }).exec(function (err, order) {
            if (err)
                return myErrorHandler("findOrderByAddr exec1: " + err.message, res);
            if (order == null) {
                Order.findOne({ userAddrTo: addr }).exec(function (err, order) {
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
    },

    setOrderStatusID: function (orderID, status, res) {
        Order.findOne({ exchangeTxId: orderID }).exec(function (err, order) {
            if (err) return myErrorHandler(err.message, res);
            if (order == null) return myErrorHandler("order not foud", res);
            if (status != undefined) {
                order.status = status;
                order.save(function (err) {
                    if (err)
                        return myErrorHandler(
                            "setOrderStatusID order.save: " + err.message,
                            res
                        );
                });
                //  console.log('Order ' + orderID + '  %s', order.status.toString());
                if (res) res.json({ error: false, status: order.status });
            }
        });
    },

    deleteOrderByID: function (oid, res) {
        Order.findOneAndRemove({ exchangeTxId: oid }).exec(function (err, order) {
            if (err) return myErrorHandler("deleteOrderBeID exec: " + err.message, res);
            if (order == null) return myErrorHandler("order not foud", res);
            res.json({ error: false });
        });
    },

    arhOrderByID: function (oid, res) {
        Order.findOne({ exchangeTxId: oid }).exec(function (err, order) {
            if (err) return myErrorHandler("findOrderBeID exec: " + err.message, res);
            if (order == null) return myErrorHandler("order not foud", res);
            arhOrder(order, res);
        });
    },

    arhOrder: function (order, res) {
        arhorder = new ArhOrder({
            exchangeTxId: order.exchangeTxId,
            createDateUTC: order.createDateUTC,
            ttl: order.ttl,
            status: order.status,
            exchangeRatio: order.exchangeRatio,
            userID: order.userID,
            userAddrFrom: order.userAddrFrom,
            symbolFrom: order.symbolFrom,
            valueFrom: order.valueFrom,
            hashTxFrom: order.hashTxFrom,
            confirmTxFrom: order.confirmTxFrom,
            userAddrTo: order.userAddrTo,
            symbolTo: order.symbolTo,
            valueTo: order.valueTo,
            hashTxTo: order.hashTxTo,
            confirmTxTo: order.confirmTxTo,
            exchangeAddrTo: order.exchangeAddrTo,
            symbol: order.symbol,
            amount: order.amount,
            received: order.received,
            sent: order.sent
        });
        arhorder.save(function (err) {
            if (err)
                return myErrorHandler(
                    "arhOrderByID : arhorder " + oid + " save, " + err.message,
                    res
                );
        });
        order.remove(function (err) {
            if (err)
                return myErrorHandler(
                    "arhOrderByID: order " + oid + +" remove, " + err.message,
                    res
                );
        });
        if (res)
            res.json({
                error: false,
                arhorder: arhorder
            });
    },

//  TX mongo utils

    getTxs: function (res) {
        TX.find({}).exec(function (err, txs) {
            if (err) return myErrorHandler("getTx exec: " + err.message, res);
            if (txs == null || txs[0] == null)
                return myErrorHandler("transactions not foud", res);
            res.json({
                error: false,
                txs: txs
            });
        });
    },

    arhTxByID: function (oid, res) {
        TX.findOne({ orderID: oid }).exec(function (err, tx) {
            if (err) return myErrorHandler("arhTxByID exec: " + err.message, res);
            if (tx == null) return myErrorHandler("transaction not foud", res);
            arhTx(tx, res);
        });
    },

    arhTxByAddr: function (addrs, res) {
        TX.findOne({ addrFrom: addrs }).exec(function (err, tx) {
            if (err) return myErrorHandler("arhTxByAddr exec: " + err.message, res);
            if (tx == null) return myErrorHandler("transaction not foud", res);
            arhTx(tx, res);
        });
    },

    arhTx: function (tx, res) {
        arhtx = new ArhTx({
            hashTx: tx.hashTx,
            orderID: tx.orderID,
            createDateUTC: tx.createDateUTC,
            confirms: tx.confirms,
            addrFrom: tx.addrFrom,
            value: tx.value,
            To: tx.To
        });
        arhtx.save(function (err) {
            if (err)
                return myErrorHandler(
                    "arhTx order " + tx.orderID + " save, " + err.message,
                    res
                );
        });
        tx.remove(function (err) {
            if (err)
                return myErrorHandler(
                    "arhTx order " + arhtx.orderID + " remove, " + err.message,
                    res
                );
        });
        if (res)
            res.json({
                error: false,
                arhtx: arhtx
            });
    }
}