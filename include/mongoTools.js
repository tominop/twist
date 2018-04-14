//  file mongoTools.js

module.exports = {

    //  Order mongo utils

    getNewOrders: async(res) => {
        return Order.find().exec()
            .catch((err) => { myErrorHandler('getNewOrders tools: ' + err, res); })
    },

    findOrderID: async(addr) => {
        order = await Order.findOne({ userAddrFrom: addr }).exec()
            .catch((err) => { return myErrorHandler('getNewOrders tools: ' + err, res); })
        if (order == null) return
        return order.exchangeTxId;
    },

    getAOrders: async(res) => {
        return ArhOrder.find().exec()
            .catch((err) => { myErrorHandler('getArhOrders tools: ' + err, res); })
    },

    getOrders: async(res) => {
        const orders = await tools.getNewOrders(res);
        if (orders == null || orders[0] == null)
            return myErrorHandler('getOrders tools: orders not found', res);
        res.json({
            error: false,
            orders: orders
        });
    },

    removeOrders: async(res) => {
        const orders = await tools.getNewOrders(res);
        if (orders == null || orders[0] == null) return myErrorHandler('getOrders tools: orders not found', res);
        for (order in orders) {
            await orders[order].remove((err) => {
                if (err) return myErrorHandler('removeOrders stop save hook ' + err);
            });
        }
        mess('removeOrders', 'all orders removed', res)
    },

    getArhOrders: async(res) => {
        const orders = await tools.getAOrders(res);
        if (orders == null || orders[0] == null)
            return myErrorHandler('getArhOrders tools: orders not found', res);
        res.json({
            error: false,
            orders: orders
        });
    },

    findOrderByID: (oid, res) => {
        Order.findOne({ exchangeTxId: oid }).exec((err, order) => {
            if (err) return myErrorHandler('getOrderByID exec: ' + err, res);
            if (order == null) {
                ArhOrder.findOne({ exchangeTxId: oid }).exec((err, order) => {
                    if (err) return myErrorHandler('getOrderByID exec: ' + err, res);
                    if (order == null) return myErrorHandler('order not found', res);
                    return res.json({ error: false, order: order });
                });
            } else res.json({ error: false, order: order });
        });
    },

    findOrderByUserId: (uid, res) => {
        Order.findOne({ userID: uid }).exec((err, order) => {
            if (err) return myErrorHandler('findOrderByUserId exec: ' + err, res);
            if (order == null) {
                ArhOrder.findOne({ userID: uid }).exec((err, order) => {
                    if (err)
                        return myErrorHandler('findOrderByUserId exec: ' + err, res);
                    if (order == null) return myErrorHandler('order not found', res);
                    res.json({
                        error: false,
                        order: null,
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

    findOrderByAddr: (addr, res) => {
        Order.findOne({ userAddrFrom: addr }).exec((err, order) => {
            if (err)
                return myErrorHandler('findOrderByAddr exec1: ' + err, res);
            if (order == null) {
                Order.findOne({ userAddrTo: addr }).exec((err, order) => {
                    if (err)
                        return myErrorHandler('findOrderByAddr exec2: ' + err, res);
                    if (order == null)
                    //                    return res.json({ error: true, response: 'order not found' });
                        return tools.findArhOrderByAddr(addr, res);
                    //  console.log('Order ' + orderID + '  %s', order.status.toString());
                    res.json({ error: false, order: order });
                });
            } else {
                //  console.log('Order ' + orderID + '  %s', order.status.toString());
                res.json({ error: false, order: order });
            }
        });
    },

    findArhOrderByAddr: (addr, res) => {
        ArhOrder.findOne({ userAddrFrom: addr }).exec((err, order) => {
            if (err)
                return myErrorHandler('findOrderByAddr exec1: ' + err, res);
            if (order == null) {
                ArhOrder.findOne({ userAddrTo: addr }).exec((err, order) => {
                    if (err)
                        return myErrorHandler('findOrderByAddr exec2: ' + err, res);
                    if (order == null)
                        return res.json({ error: true, response: 'order not found' });
                    //  console.log('Order ' + orderID + '  %s', order.status.toString());
                    res.json({ error: false, order: order });
                });
            } else {
                //  console.log('Order ' + orderID + '  %s', order.status.toString());
                res.json({ error: false, order: order });
            }
        });
    },

    findOrdersByUid: async(uid, res) => {
        var orders = [],
            ords = [];
        ords = await Order.find({ userID: uid }).exec()
            .catch((err) => {
                return myErrorHandler('findOrdersByAddr ' + addr + ' ' + err, res);
            })
        if (ords != null) {
            for (key in ords) {
                orders[orders.length] = Object.assign({}, ords[key]._doc);
            };
        }


        ords = await ArhOrder.find({ userID: uid }).exec()
            .catch((err) => {
                return myErrorHandler('findOrdersByAddr ' + addr + ' ' + err, res);
            })
        if (ords != null)
            for (key in ords) {
                orders[orders.length] = Object.assign({}, ords[key]._doc)
            }
        if (orders == null) return res.json({ error: true, response: 'orders not found' });
        res.json({ error: false, orders: orders });
    },

    findOrdersByAddr: async(addr, res) => {
        var orders = [],
            ords = [];
        var query = Order.find({});
        ords = await query.or([{ userAddrFrom: addr }, { userAddrRefund: addr }, { userAddrTo: addr }, { exchangeAddrTo: addr }]).exec()
            .catch((err) => {
                return myErrorHandler('findOrdersByAddr ' + addr + ' ' + err, res);
            })
        if (ords != null && ords[0] != null)
            for (key in ords) { orders[orders.length] = ords[key]._doc };
        var query = ArhOrder.find({});
        ords = await query.or([{ userAddrFrom: addr }, { userAddrRefund: addr }, { userAddrTo: addr }, { exchangeAddrTo: addr }]).exec()
            .catch((err) => {
                return myErrorHandler('findOrdersByAddr ' + addr + ' ' + err, res);
            })
        if (ords != null && ords[0] != null)
            for (key in ords) { orders[orders.length] = ords[key]._doc }
        if (orders == null || orders[0] == null) return res.json({ error: true, response: 'orders not found' });
        res.json({ error: false, orders: orders });
    },


    setOrderStatusID: (orderID, status, reason, res) => {
        Order.findOne({ exchangeTxId: orderID }).exec((err, order) => {
            if (err) return myErrorHandler(err, res);
            if (order == null) return myErrorHandler('order not found', res);
            if (status != undefined) {
                data = { reason: reason, time: timeNow() }
                tools.setOrderStatus(order, status, data);
                if (res) res.json({ error: false, order: order });
            }
        });
    },

    saveOrder: (order, name) => {
        order.save().catch((err) => {
            myErrorHandler(name + ': order save ' + err)
        });
    },

    deleteOrderByID: (oid, res) => {
        Order.findOneAndRemove({ exchangeTxId: oid }).exec((err, order) => {
            if (err) return myErrorHandler('deleteOrderBeID exec: ' + err, res);
            if (order == null) return myErrorHandler('order not found', res);
            res.json({ error: false, response: 'removed' });
        });
    },

    arhOrderByID: (oid, res) => {
        Order.findOne({ exchangeTxId: oid }).exec((err, order) => {
            if (err) return myErrorHandler('findOrderBeID exec: ' + err, res);
            if (order == null) return myErrorHandler('order not found', res);
            tools.arhOrder(order, res);
        });
    },

    arhOrder: (order, res) => {
        arhorder = new ArhOrder({
            exchangeTxId: order.exchangeTxId,
            createDateUTC: order.createDateUTC,
            ttl: order.ttl,
            status: order.status,
            exchangeRatio: order.exchangeRatio,
            userID: order.userID,
            userEmail: order.userEmail || '',
            userPhone: order.userPhone || '',
            userAddrFrom: order.userAddrFrom,
            symbolFrom: order.symbolFrom,
            valueFrom: order.valueFrom,
            hashTxFrom: order.hashTxFrom,
            confirmTxFrom: order.confirmTxFrom,
            userAddrRefund: order.userAddrRefund,
            valueRefund: order.valueRefund,
            hashTxRefund: order.hashTxRefund,
            confirmTxRefund: order.confirmTxRefund,
            userAddrTo: order.userAddrTo,
            symbolTo: order.symbolTo,
            valueTo: order.valueTo,
            hashTxTo: order.hashTxTo,
            confirmTxTo: order.confirmTxTo,
            exchangeAddrTo: order.exchangeAddrTo,
            exchangeAddrFrom: order.exchangeAddrFrom,
            symbol: order.symbol,
            fee: order.fee,
            received: order.received,
            sent: order.sent
        });
        tools.saveOrder(arhorder, 'arhOrder')
        order.remove((err) => {
            if (err) {
                myErrorHandler(
                    'arhOrderByID: order ' + arhorder.exchangeTxId + ' remove, ' + err, res);
                res = undefined
            };
        });
        if (res) res.json({ error: false, arhorder: arhorder });
        order = null;
        tools.arhOrderTxs(order);
    },

    deArhOrderByID: (oid, res) => {
        ArhOrder.findOne({ exchangeTxId: oid }).exec((err, order) => {
            if (err) return myErrorHandler('findOrderBeID exec: ' + err, res);
            if (order == null) return myErrorHandler('order not found', res);
            tools.deArhOrder(order, res);
        });
    },

    deArhOrder: (order, res) => {
        neworder = new Order({
            exchangeTxId: order.exchangeTxId,
            createDateUTC: order.createDateUTC,
            ttl: order.ttl,
            status: order.status,
            exchangeRatio: order.exchangeRatio,
            userID: order.userID,
            userEmail: order.userEmail || '',
            userPhone: order.userPhone || '',
            userAddrFrom: order.userAddrFrom,
            symbolFrom: order.symbolFrom,
            valueFrom: order.valueFrom,
            hashTxFrom: '',
            confirmTxFrom: 0,
            userAddrRefund: order.userAddrRefund,
            valueRefund: 0,
            hashTxRefund: '',
            confirmTxRefund: 0,
            userAddrTo: order.userAddrTo,
            symbolTo: order.symbolTo,
            valueTo: order.valueTo,
            hashTxTo: '',
            confirmTxTo: 0,
            exchangeAddrTo: order.exchangeAddrTo,
            exchangeAddrFrom: order.exchangeAddrFrom,
            symbol: order.symbol,
            fee: order.fee,
            received: 0,
            sent: false
        });
        neworder.status = { code: 0, human: twist.humans[0], data: { reason: 'manual resore from archive', time: timeNow() } };
        tools.saveOrder(neworder, 'deArhOrder')
        order.remove((err) => {
            if (err) {
                myErrorHandler(
                    'deArhOrderByID: order ' + neworder.exchangeTxId + ' remove, ' + err, res);
                res = undefined
            };
        });
        if (res)
            res.json({
                error: false,
                order: neworder
            });
    },

    refundOrderByID: (oid, res) => {
        Order.findOne({ exchangeTxId: oid }).exec((err, order) => {
            if (err) return myErrorHandler('findOrderBeID exec: ' + err, res);
            if (order == null) return myErrorHandler('order not found', res);
            exec.makeWithdraw(order, res);
        });
    },

    //  Tx mongo utils

    incomingTx: async(tx, res) => { //  web hook handler
        // const tx = data.tx;
        Tx.findOne({ hashTx: tx.hash })
            .exec(async(err, existTx) => {
                var oid;
                if (err) return myErrorHandler('incoming Tx: ' + err, res)
                if (existTx == null) {
                    if (tx.orderID == '') oid = await tools.findOrderID(tx.addrFrom)
                    else oid = tx.orderID;
                    existTx = new Tx({
                        hashTx: tx.hash,
                        orderID: oid,
                        createDateUTC: tx.createDateUTC,
                        confirms: tx.confirms,
                        addrFrom: tx.addrFrom,
                        value: tx.value,
                        To: tx.To
                    });
                } else {
                    existTx.confirms = tx.confirms;
                    existTx.addrFrom = tx.addrFrom;
                    existTx.createDateUTC = tx.createDateUTC;
                }
                existTx.save((err) => {
                    if (err) return myErrorHandler('incomingTx: save Tx ' + tx.hash + ' error: ' + err, res);
                    if (res) res.status(200).send('Ok');
                });
            });
    },

    findTxById1: (oid) => {
        Tx.findOne({ orderID: oid }).exec((err, tx) => {
            if (err) return;
            if (tx == null) return;
            return tx;
        });
    },

    findTxByAddr: async addr => {
        return await tools.findTx({ To: addr });
    },


    findTx: param => {
        return Tx.findOne(param)
        .exec()
            .catch(err => {
                myErrorHandler('findTx param ' + JSON.stringify(param) + ' ' + err)
            })
    },

    findArhTx: param => {
        return ArhTx.findOne(param)
        .exec()
            .catch(err => {
                myErrorHandler('findArhTx param ' + JSON.stringify(param) + ' ' + err)
            })
    },

    findTxByAddr: async addr => {
        tx = Tx.findOne({ To: addr }).exec()
            .catch((err) => { return myErrorHandler('findTxByAddr : ' + err) })
        return tx;
    },


    getTxs: (res) => {
        Tx.find().exec((err, txs) => {
            if (err) return myErrorHandler('getTx exec: ' + err, res);
            if (txs == null) return myErrorHandler('transactions not found', res);
            res.json({
                error: false,
                txs: txs
            });
        });
    },

    removeTxs: async(res) => {
        Tx.find().exec(async(err, txs) => {
            if (err) return myErrorHandler('getTx exec: ' + err, res);
            if (txs == null || txs[0] == null) return myErrorHandler('transactions not found', res);
            for (tx in txs) {
                await txs[tx].remove((err) => {
                    if (err) return myErrorHandler('removeTxs ' + err);
                });
            };
            mess('removeTxs', 'all txs removed', res)
        });
    },

    arhOrderTxs: async order => {
        txs = await tools.findTxs({ addrFrom: order.userAddrFrom, To: order.exchangeAddrTo });
        for (tx in txs) await tools.arhTx(txs[tx]);
        txs = await tools.findTxs({ To: order.userAddrTo });
        for (tx in txs) await tools.arhTx(txs[tx]);
    },


    arhTxByID: (oid, res) => {
        Tx.findOne({ orderID: oid }).exec((err, tx) => {
            if (err) return myErrorHandler('arhTxByID exec: ' + err, res);
            if (tx == null) return myErrorHandler('transaction not found', res);
            tools.arhTx(tx, res);
        });
    },

    arhTxByAddr: (addrs, res) => {
        Tx.findOne({ addrFrom: addrs }).exec((err, tx) => {
            if (err) return myErrorHandler('arhTxByAddr exec: ' + err, res);
            if (tx == null) return myErrorHandler('transaction not found', res);
            tools.arhTx(tx, res);
        });
    },

    arhTx: (tx, res) => {
        arhtx = new ArhTx({
            hashTx: tx.hashTx,
            orderID: tx.orderID,
            createDateUTC: tx.createDateUTC,
            confirms: tx.confirms,
            addrFrom: tx.addrFrom,
            value: tx.value,
            To: tx.To
        });
        arhtx.save((err) => {
            if (err)
                return myErrorHandler(
                    'arhTx order ' + tx.orderID + ' save, ' + err,
                    res
                );
        });
        tx.remove((err) => {
            if (err)
                return myErrorHandler(
                    'arhTx order ' + arhtx.orderID + ' remove, ' + err,
                    res
                );
        });
        if (res)
            res.json({
                error: false,
                arhtx: arhtx
            });
    },

    removeTxByAddrFrom: (addrs, res) => {
        Tx.findOneAndRemove({ addrFrom: addrs }).exec((err, tx) => {
            if (err) return myErrorHandler('removeTxByAddrFrom exec: ' + err, res);
            if (tx == null) return myErrorHandler('tx not found', res);
            res.json({ error: false, response: 'removed' });
        });
    },

    removeTxByAddrTo: (addrs, res) => {
        Tx.findOneAndRemove({ To: addrs }).exec((err, tx) => {
            if (err) return myErrorHandler('removeTxByAddrTo exec: ' + err, res);
            if (tx == null) return myErrorHandler('tx not found', res);
            if (res) res.json({ error: false, response: 'removed' });
        });
    },

    getAddressTo: async(coin, uid, res) => {
        var adr;
        adr = await Addrs.findOne({ coin: coin, userId: uid, active: true }).exec().catch((err) => {
            return myErrorHandler('getAddrTo: ' + err, res)
        });
        if (adr == null) {
            adr = await Addrs.findOne({ coin: coin, userId: '', active: true }).exec().catch((err) => {
                return myErrorHandler('getAddrTo: ' + err, res)
            });
        }
        if (adr == null) return myErrorHandler('getAddrTo ' + coin + ' adresses not available ', res)
        adr.userId = uid;
        if (++adr.counter > 0) adr.active = false;
        adr.save().catch((err) => {
            myErrorHandler('getAddrTo address save ' + err)
        });
        if (res) res.json({ error: false, coin: coin, address: addr, counter: adr.counter });
        return adr.address;
    },
}