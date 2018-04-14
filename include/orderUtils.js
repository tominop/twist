/*!
 * @title orderUtils.js - service functions for orderExec.js
 * @dev Basic implementaion of service functions for orders exec functions  
 * MIT Licensed Copyright(c) 2018-2019
 */

//  file 
//  local variables and function for order.js routes of twist exchange
module.exports = {

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
        change = order.received - valueToFix(twist.maxLimit / coins[order.symbolFrom].price);
        if (change > coins[order.symbolTo].minerFee * 2) {
            //  change must be more 2 x minerFee
            valueFact = valueToFix(twist.maxLimit / coins[order.symbolTo].price);
            //        var changeOrder = new Order();
            //        makeChange(changeOrder, change - minerFee);
            //  !!!!TODO - возможно новый статус ордера
            mess('makeWithdraw', 'twist must send change ' + change + order.symbolFrom + ' to user');
            order.valueRefund = change;
        };
        const fee = coins[order.symbolTo].minerFee + valueToFix(twist.fee * valueFact / 100);
        order.fee = fee;
        valueFact = valueToFix(valueFact - fee);
        return valueFact;
    }

}