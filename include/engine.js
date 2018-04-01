/*!
 * @title twist engine - main function of Twist API service
 * @author Oleg Tomin - <2tominop@gmail.com>
 * @dev Basic implementaion of orders exec functions  
 * MIT Licensed Copyright(c) 2018-2019
 */  

// regular check coins status !!!TODO update default coin options without reload service

Coin = require("./coinUtils");

module.exports = {

    timerCheck: [],

    start: function(res) {
        this.setCallPeriod(this.coinsCheck, twist.coinsCheckPeriod, 0);
        this.setCallPeriod(this.helthCheck, twist.helthCheckPeriod, 1);
        //        this.setCallPeriod(this.orderCheck, twist.orderCheckPeriod);
        this.orderCheck();
        mess('twist onload', 'orders engine starts', res)
    },

    stop: function(clear, res) {
        clearTimeout(engine.timerCheck[0]);
        clearTimeout(engine.timerCheck[1]);
        if (clear === 'clear') {
            tools.removeOrders();
            tools.removeTxs();
            return mess('engine', 'stops and clears orders and txs', res)
        }
        mess('engine', 'stops and not clears orders and txs', res)
    },

    setCallPeriod: function(func, timeout, ind) {
        func();
        engine.timerCheck[ind] = setTimeout(function check() {
            func();
            engine.timerCheck[ind] = setTimeout(check, timeout * 60000);
        }, timeout * 60000); //  check period in min.
    },

    coinsCheck: function() {
        for (coin in coins) {
            if (coins[coin].active) {
                coins[coin].updated = false;
                coins[coin].enabled = true;
                coins[coin].balance = 0;
                coins[coin].minerFee = 0;
                coins[coin].price = 0;
                //        coins[coin].reserv = 0;
                Coin.getPrice(coin, twist.priceBase);
                Coin.getBalance(coin);
                Coin.getReserv(coin);
            }
        }
    },

    helthCheck: function() {},

    orderCheck: async function() {
        var key, order;
        var orders = await tools.getNewOrders();
        for (key in orders) {
            order = orders[key];
            if ( order.status.code == 0) exec.takeOrder(order);
            else if (order.status.code == 1 || order.status.code == 2) 
                exec.checkDepositStatus(order);
            else if (order.status.code == 3) utils.makeRefund(order);
            else if (order.status.code == 4)
                exec.checkRefundStatus1(order);
            else if (order.status.code == 5)
                exec.checkRefundStatus2(order);
            else if (order.status.code > 5) tools.arhOrder(order);
        };
    }
};