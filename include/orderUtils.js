/*!
 * @title orderUtils.js - service functions for orderExec.js
 * @dev Basic implementaion of service functions for orders exec functions  
 * MIT Licensed Copyright(c) 2018-2019
 */

//  file 
//  local variables and function for order.js routes of twist exchange
module.exports = {

    findDepositTx: async(order, interval, timeout) => {
        if (order.hashTxFrom != '') Tx.findOne({ hashTx: order.hashTxFrom }).exec()
            .then(incTx => {
                if (incTx == null) return Tx.findOne({ To: order.exchangeAddrTo }).exec()
                return incTx;
            })
            .then(incTx => { utils.workDepositTx(order, incTx, interval, timeout) })
            .catch(err => { myErrorHandler('findDepositTx order ' + order.exchangeTxId + ' ' + err); })
        else Tx.findOne({ To: order.exchangeAddrTo }).exec()
            .then(incTx => { utils.workDepositTx(order, incTx, interval, timeout) })
            .catch(err => { myErrorHandler('findDepositTx order ' + order.exchangeTxId + ' ' + err); });
    },

    workDepositTx: (order, incTx, interval, timeout) => {
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
        if (!order.depositIsFind) order.depositIsFind = true;
        order.hashTxFrom = incTx.hashTx;
        order.userAddrFrom = incTx.addrFrom;
        tools.saveOrder(order, 'findTxTo');
        if (order.status.code == 3) {
            exec.stopDepositWait(order, interval, timeout, false,
                ' Tx ' + incTx.hashTx + ' confirmed ');
            tools.arhTx(incTx);
        };
    },

    findWithdrawTx: async(order, interval, timeout) => {
        if (order.hashTxFrom != '') Tx.findOne({ hashTx: order.hashTxFrom }).exec()
            .then(outTx => {
                if (outTx == null) return Tx.findOne({ To: order.userAddrTo }).exec()
                return outTx;
            })
            .then(outTx => { utils.workWithdrawTx(order, outTx, interval, timeout) })
            .catch(err => { myErrorHandler('findWithdrawTx order ' + order.exchangeTxId + ' ' + err); })
        else Tx.findOne({ To: order.userAddrTo }).exec()
            .then(outTx => { utils.workWithdrawTx(order, outTx, interval, timeout) })
            .catch(err => { myErrorHandler('findWithdrawTx order ' + order.exchangeTxId + ' ' + err); });
    },

    workWithdrawTx: (order, outTx, interval, timeout) => {
        if (outTx == null) return;
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
            order.confirmTxTo = true;
            order.sent = outTx.value;
        } else return;
        tools.saveOrder(order, 'findTxFrom');
        if (order.confirmTxTo) {
            const mess1 = 'withdraw Tx ' + outTx.hashTx + ' confirmed, order ' + order.exchangeTxId + ' finished successfully!';
            exec.stopWithdrawWait(order, timeout, interval, false, mess1);
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

    validateCoins: (symbolFrom, valueFrom, symbolTo, valueTo, res) => {
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

    validateUser: async(userID, res) => {
        return await Order.findOne({ userID: userID }).exec(async(err, order) => {
            if (err) return myErrorHandler('validateUser order.findOne  ' + err, res);
            if (order != null) return myErrorHandler('newOrder: user have executed order ID ' + order.exchangeTxId, res);
            return true;
        });
    },

    normalizeAddr: (coin, address) => {
        if (coin.substr(0, 2) != 'ET') return address;
        address = address.toLowerCase();
        if (address.substr(0, 2) != '0x') address = '0x' + address;
        return address;
    },

    setOrderStatus: (order, code, data) => {
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

    //  find orderId in array of executed orders
    orderToInd: oid => {
        for (ind = 0; ind < execOrders.length; ind++) {
            if (execOrders[ind].id == oid) return ind;
        };
        return -1;
    },

    rmOrderFromArray: oid => {
        var ind = utils.orderToInd(oid);
        if (ind > -1) execOrders.splice(ind, 1)
    },

    calcValueFact: order => {
        var change, valueFact;
        valueFact = valueToFix(order.received * order.exchangeRatio);
        change = valueToFix(
            order.received - twist.maxLimit / coins[order.symbolFrom].price
        );
        if (change > coins[order.symbolFrom].minerFee * 2) {
            //  change must be more 2 x minerFee
            valueFact = valueToFix(twist.maxLimit / coins[order.symbolTo].price);
            //        var changeOrder = new Order();
            //        makeChange(changeOrder, change - minerFee);
            //  !!!!TODO - возможно новый статус ордера
            mess('makeWithdraw', 'twist must send change ' + change + order.symbolFrom + ' to user');
            order.valueRefund = change;
        };
        return valueFact;
    }

}