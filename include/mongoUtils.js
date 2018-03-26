//  file mongoUtils.js

module.exports = {

    //  Order mongo utils

    getNewOrders: async function(res) {
        return Order.find().exec()
            .catch((err) => { myErrorHandler("getNewOrders tools: " + err, res); })
    },

    getOrders: async function(res) {
        const orders = await this.getNewOrders(res);
        if (orders == null || orders[0] == null)
            return myErrorHandler("getOrders tools: orders not foud", res);
        res.json({
            error: false,
            orders: orders
        });
    },

    findOrderByID: function(oid, res) {
        Order.findOne({ exchangeTxId: oid }).exec(function(err, order) {
            if (err) return myErrorHandler("getOrderByID exec: " + err, res);
            if (order == null) {
                ArhOrder.findOne({ exchangeTxId: oid }).exec(function(err, order) {
                    if (err)
                        return myErrorHandler("getOrderByID exec: " + err, res);
                    if (order == null) return myErrorHandler("order not foud", res);
                    res.json({
                        error: false,
                        arhorder: order
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

    findOrderByAddr: function(addr, res) {
        Order.findOne({ userAddrFrom: addr }).exec(function(err, order) {
            if (err)
                return myErrorHandler("findOrderByAddr exec1: " + err, res);
            if (order == null) {
                Order.findOne({ userAddrTo: addr }).exec(function(err, order) {
                    if (err)
                        return myErrorHandler("findOrderByAddr exec2: " + err, res);
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

    setOrderStatusID: function(orderID, status, res) {
        Order.findOne({ exchangeTxId: orderID }).exec(function(err, order) {
            if (err) return myErrorHandler(err, res);
            if (order == null) return myErrorHandler("order not foud", res);
            if (status != undefined) {
                order.status = status;
                tools.saveOrder(order, 'setOrderStatusID');
                //  console.log('Order ' + orderID + '  %s', order.status.toString());
                if (res) res.json({ error: false, status: order.status });
            }
        });
    },

    setOrderStatus: function(order, code, data) {
        order.status = { code: code, human: twist.humans[code], data: data };
        tools.saveOrder(order, 'setOrderStatus');
    },

    saveOrder: function(order, name) {
        order.save().catch((err) => {
            myErrorHandler(name + ': order save ' + err)
        });
    },


    deleteOrderByID: function(oid, res) {
        Order.findOneAndRemove({ exchangeTxId: oid }).exec(function(err, order) {
            if (err) return myErrorHandler("deleteOrderBeID exec: " + err, res);
            if (order == null) return myErrorHandler("order not foud", res);
            res.json({ error: false, response: 'removed' });
        });
    },

    arhOrderByID: function(oid, res) {
        Order.findOne({ exchangeTxId: oid }).exec(function(err, order) {
            if (err) return myErrorHandler("findOrderBeID exec: " + err, res);
            if (order == null) return myErrorHandler("order not foud", res);
            tools.arhOrder(order, res);
        });
    },

    arhOrder: function(order, res) {
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
        tools.saveOrder(arhorder, 'arhOrder')
        order.remove(function(err) {
            if (err) {myErrorHandler(
                "arhOrderByID: order " + arhorder.exchangeTxId + " remove, " + err, res);
            res = undefined};
        });
        if (res)
            res.json({
                error: false,
                arhorder: arhorder
            });
    },

    //  TX mongo utils

    incomingTx: async function(data) { //  web hook handler
        const tx = data.tx;
        existTx = await Tx.findOne({ hashTx: tx.hash })
        .exec(function(err) { if (err) return myErrorHandler("incoming Tx: " + err) });
        if (existTx != null) existTx.confirms = tx.confirmations;
        else {
            existTx = new Tx({
                hashTx: tx.hash,
                orderID: "",
                createDateUTC: tx.createDateUTC,
                confirms: tx.confirms,
                addrFrom: tx.addrFrom,
                value: tx.value,
                To: tx.To
            });
        }
        existTx.save(function(err) {
            if (err) myErrorHandler('incomingTx: save Tx ' + tx.hash + ' error: ' + err);
        });

    },

    getTxs: function(res) {
        TX.find().exec(function(err, txs) {
            if (err) return myErrorHandler("getTx exec: " + err, res);
            if (txs == null) return myErrorHandler("transactions not foud", res);
            res.json({
                error: false,
                txs: txs
            });
        });
    },

    arhTxByID: function(oid, res) {
        TX.findOne({ orderID: oid }).exec(function(err, tx) {
            if (err) return myErrorHandler("arhTxByID exec: " + err, res);
            if (tx == null) return myErrorHandler("transaction not foud", res);
            tools.arhTx(tx, res);
        });
    },

    arhTxByAddr: function(addrs, res) {
        TX.findOne({ addrFrom: addrs }).exec(function(err, tx) {
            if (err) return myErrorHandler("arhTxByAddr exec: " + err, res);
            if (tx == null) return myErrorHandler("transaction not foud", res);
            tools.arhTx(tx, res);
        });
    },

    arhTx: function(tx, res) {
        arhtx = new ArhTx({
            hashTx: tx.hashTx,
            orderID: tx.orderID,
            createDateUTC: tx.createDateUTC,
            confirms: tx.confirms,
            addrFrom: tx.addrFrom,
            value: tx.value,
            To: tx.To
        });
        arhtx.save(function(err) {
            if (err)
                return myErrorHandler(
                    "arhTx order " + tx.orderID + " save, " + err,
                    res
                );
        });
        tx.remove(function(err) {
            if (err)
                return myErrorHandler(
                    "arhTx order " + arhtx.orderID + " remove, " + err,
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