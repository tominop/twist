//  file mongoUtils.js

module.exports = {

    //  Order mongo utils

    getNewOrders: async function(res) {
        return Order.find().exec()
            .catch((err) => { myErrorHandler('getNewOrders tools: ' + err, res); })
    },

    findOrderID: async function(addr) {
        order = await Order.findOne({ userAddrFrom: addr }).exec()
            .catch((err) => { return myErrorHandler('getNewOrders tools: ' + err, res); })
        if (order == null) return
        return order.exchangeTxId;
    },

    getAOrders: async function(res) {
        return ArhOrder.find().exec()
            .catch((err) => { myErrorHandler('getArhOrders tools: ' + err, res); })
    },

    getOrders: async function(res) {
        const orders = await this.getNewOrders(res);
        if (orders == null || orders[0] == null)
            return myErrorHandler('getOrders tools: orders not found', res);
        res.json({
            error: false,
            orders: orders
        });
    },

    removeOrders: async function(res) {
        const orders = await this.getNewOrders(res);
        if (orders == null || orders[0] == null) return myErrorHandler('getOrders tools: orders not found', res);
        for (order in orders) {
            await orders[order].remove(function(err) {
                if (err) return myErrorHandler('removeOrders stop save hook ' + err);
            });
        }
        mess('removeOrders', 'all orders removed', res)
    },

    getArhOrders: async function(res) {
        const orders = await this.getAOrders(res);
        if (orders == null || orders[0] == null)
            return myErrorHandler('getArhOrders tools: orders not found', res);
        res.json({
            error: false,
            orders: orders
        });
    },

    findOrderByID: function(oid, res) {
        Order.findOne({ exchangeTxId: oid }).exec(function(err, order) {
            if (err) return myErrorHandler('getOrderByID exec: ' + err, res);
            if (order == null) {
                ArhOrder.findOne({ exchangeTxId: oid }).exec(function(err, order) {
                    if (err) return myErrorHandler('getOrderByID exec: ' + err, res);
                    if (order == null) return myErrorHandler('order not found', res);
                    return res.json({ error: false, order: order });
                });
            } else res.json({ error: false, order: order });
        });
    },

    findOrderByUserId: function(uid, res) {
        Order.findOne({ userID: uid }).exec(function(err, order) {
            if (err) return myErrorHandler('findOrderByUserId exec: ' + err, res);
            if (order == null) {
                ArhOrder.findOne({ userID: uid }).exec(function(err, order) {
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

    findOrderByAddr: function(addr, res) {
        Order.findOne({ userAddrFrom: addr }).exec(function(err, order) {
            if (err)
                return myErrorHandler('findOrderByAddr exec1: ' + err, res);
            if (order == null) {
                Order.findOne({ userAddrTo: addr }).exec(function(err, order) {
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

    findArhOrderByAddr: function(addr, res) {
        ArhOrder.findOne({ userAddrFrom: addr }).exec(function(err, order) {
            if (err)
                return myErrorHandler('findOrderByAddr exec1: ' + err, res);
            if (order == null) {
                ArhOrder.findOne({ userAddrTo: addr }).exec(function(err, order) {
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

    findOrdersByUid: async function(uid, res) {
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

    findOrdersByAddr: async function(addr, res) {
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


    setOrderStatusID: function(orderID, status, reason, res) {
        Order.findOne({ exchangeTxId: orderID }).exec(function(err, order) {
            if (err) return myErrorHandler(err, res);
            if (order == null) return myErrorHandler('order not found', res);
            if (status != undefined) {
                data = { reason: reason, time: timeNow() }
                tools.setOrderStatus(order, status, data);
                if (res) res.json({ error: false, order: order });
            }
        });
    },

    setOrderStatus: function(order, code, data) {
        order.status = { code: code, human: twist.humans[code], data: data };
        tools.saveOrder(order, 'setOrderStatus');
        var ind = utils.orderToInd(order.exchangeTxId); //  find orderId in array of executed orders
        if (ind < 0) {
            execOrders[execOrders.length] = { id: order.exchangeTxId, status: code, time: new Date() };
            coins[order.symbolTo].reserv = coins[order.symbolTo].reserv + order.valueTo;
            return;
        };
        if (code < 6) return;
        execOrders.splice(ind, 1); //  remove order from order exec array
        coins[order.symbolTo].reserv = coins[order.symbolTo].reserv - order.valueTo;
    },

    saveOrder: function(order, name) {
        order.save().catch((err) => {
            myErrorHandler(name + ': order save ' + err)
        });
    },

    deleteOrderByID: function(oid, res) {
        Order.findOneAndRemove({ exchangeTxId: oid }).exec(function(err, order) {
            if (err) return myErrorHandler('deleteOrderBeID exec: ' + err, res);
            if (order == null) return myErrorHandler('order not found', res);
            res.json({ error: false, response: 'removed' });
        });
    },

    arhOrderByID: function(oid, res) {
        Order.findOne({ exchangeTxId: oid }).exec(function(err, order) {
            if (err) return myErrorHandler('findOrderBeID exec: ' + err, res);
            if (order == null) return myErrorHandler('order not found', res);
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
            symbol: order.symbol,
            amount: order.amount,
            received: order.received,
            sent: order.sent
        });
        tools.saveOrder(arhorder, 'arhOrder')
        order.remove(function(err) {
            if (err) {
                myErrorHandler(
                    'arhOrderByID: order ' + arhorder.exchangeTxId + ' remove, ' + err, res);
                res = undefined
            };
        });
        if (res)
            res.json({
                error: false,
                arhorder: arhorder
            });
    },

    deArhOrderByID: function(oid, res) {
        ArhOrder.findOne({ exchangeTxId: oid }).exec(function(err, order) {
            if (err) return myErrorHandler('findOrderBeID exec: ' + err, res);
            if (order == null) return myErrorHandler('order not found', res);
            tools.deArhOrder(order, res);
        });
    },

    deArhOrder: function(order, res) {
        neworder = new Order({
            exchangeTxId: order.exchangeTxId,
            createDateUTC: order.createDateUTC,
            ttl: order.ttl,
            status: order.status,
            exchangeRatio: order.exchangeRatio,
            userID: order.userID,
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
            symbol: order.symbol,
            amount: order.amount,
            received: 0,
            sent: false
        });
        neworder.status = { code: 0, human: twist.humans[0], data: { reason: 'manual resore from archive', time: timeNow() } };
        tools.saveOrder(neworder, 'deArhOrder')
        order.remove(function(err) {
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

    refundOrderByID: function(oid, res) {
        Order.findOne({ exchangeTxId: oid }).exec(function(err, order) {
            if (err) return myErrorHandler('findOrderBeID exec: ' + err, res);
            if (order == null) return myErrorHandler('order not found', res);
            utils.makeRefund(order, res);
        });
    },

    //  Tx mongo utils

    incomingTx: async function(tx, res) { //  web hook handler
        // const tx = data.tx;
        Tx.findOne({ hashTx: tx.hash })
            .exec(async function(err, existTx) {
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
                } else existTx.confirms = tx.confirms;
                existTx.save(function(err) {
                    if (err) return myErrorHandler('incomingTx: save Tx ' + tx.hash + ' error: ' + err, res);
                    if (res) res.status(200).send('Ok');
                });
            });
    },

    findTxById: function(oid) {
        Tx.findOne({ orderID: oid }).exec(function(err, tx) {
            if (err) return;
            if (tx == null) return;
            return tx;
        });
    },


    findTxByAddr: async function(addr) {
        tx = await Tx.findOne({ addrFrom: addr }).exec()
            .catch((err) => { return myErrorHandler('findTxByAddr : ' + err) })
        return tx;
    },


    getTxs: function(res) {
        Tx.find().exec(function(err, txs) {
            if (err) return myErrorHandler('getTx exec: ' + err, res);
            if (txs == null) return myErrorHandler('transactions not found', res);
            res.json({
                error: false,
                txs: txs
            });
        });
    },

    removeTxs: async function(res) {
        Tx.find().exec(async function(err, txs) {
            if (err) return myErrorHandler('getTx exec: ' + err, res);
            if (txs == null || txs[0] == null) return myErrorHandler('transactions not found', res);
            for (tx in txs) {
                await txs[tx].remove(function(err) {
                    if (err) return myErrorHandler('removeTxs ' + err);
                });
            };
            mess('removeTxs', 'all txs removed', res)
        });
    },



    arhTxByID: function(oid, res) {
        Tx.findOne({ orderID: oid }).exec(function(err, tx) {
            if (err) return myErrorHandler('arhTxByID exec: ' + err, res);
            if (tx == null) return myErrorHandler('transaction not found', res);
            tools.arhTx(tx, res);
        });
    },

    arhTxByAddr: function(addrs, res) {
        Tx.findOne({ addrFrom: addrs }).exec(function(err, tx) {
            if (err) return myErrorHandler('arhTxByAddr exec: ' + err, res);
            if (tx == null) return myErrorHandler('transaction not found', res);
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
                    'arhTx order ' + tx.orderID + ' save, ' + err,
                    res
                );
        });
        tx.remove(function(err) {
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

    removeTxByAddrFrom: function(addrs, res) {
        Tx.findOneAndRemove({ addrFrom: addrs }).exec(function(err, tx) {
            if (err) return myErrorHandler('removeTxByAddrFrom exec: ' + err, res);
            if (tx == null) return myErrorHandler('tx not found', res);
            res.json({ error: false, response: 'removed' });
        });
    },

    removeTxByAddrTo: function(addrs, res) {
        Tx.findOneAndRemove({ To: addrs }).exec(function(err, tx) {
            if (err) return myErrorHandler('removeTxByAddrTo exec: ' + err, res);
            if (tx == null) return myErrorHandler('tx not found', res);
            if (res) res.json({ error: false, response: 'removed' });
        });
    },

    getAddressTo: async function(coin, uid, res) {
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

    saveDepositToAddr: async function(order) {
        var adr = await Addrs.findOne({ address: order.exchangeAddrTo }).exec().catch((err) => {
            return myErrorHandler('saveDepositToAddr: ' + err, res)
        });
        if (adr == null) return myErrorHandler('saveDepositToAddr ' + coin + ' ' + order.exchangeAddrTo + ' adress not available ', res)
        adr.balance = adr.balance + order.received;
        adr.save().catch((err) => {
            myErrorHandler('saveDepositToAddr address save ' + err)
        });
    },

    getAddressWithBalance: async function(coin, res) {
        var adrs;
        adrs = await Addrs.find({ coin: coin, balance: { $gt: 0 } }).exec().catch((err) => {
            return myErrorHandler('getAddressWithBalance: ' + err, res)
        });
        res.json({ error: false, addrs: adrs });
    },


    setAddressWithUser: async function(coin, res) {
        var adrs;
        mess('setAddressWithUser', 'load starts', res);
        adrs = await Addrs.find({ coin: coin, userId: { $ne: '' } }).exec().catch((err) => {
            return myErrorHandler('setAddressWithUser: ' + err)
        });
        for (adr in adrs) {

            var bal = await tools.getBalanceAddr(coin, adrs[adr].address);
            adrs[adr].balance = bal.data.balance;
            await adrs[adr].save().catch((err) => {
                myErrorHandler('setAddressWithUser address save ' + err)
            });
        }
        mess('address', 'load finished');
    },

    getAddressWithUser: async function(coin, res) {
        var adrs;
        adrs = await Addrs.find({ coin: coin, userId: { $gt: "" } }).exec().catch((err) => {
            return myErrorHandler('getAddressWithUser: ' + err, res)
        });
        res.json({ error: false, addrs: adrs });
    },

    getBalanceAddr: function(coin, addr) {
        mess('getBalanceAddr', 'coin ' + coin + ' address ' + addr)
        return axios.get(coins[coin].api + "address/" + addr)
            .catch((err) => {
                myErrorHandler(
                    "getBalanceAddr: service " +
                    coin +
                    " API " +
                    coins[coin].api +
                    " connection error" +
                    err
                );
            });
    }
}