// regular check coins status !!!TODO update default coin options without reload service

Coin = require("./coinUtils");

module.exports = {
    start: function () {
        this.setCallPeriod(this.coinsCheck, twist.coinsCheckPeriod);
        this.setCallPeriod(this.helthCheck, twist.helthCheckPeriod);
        //        this.setCallPeriod(this.orderCheck, twist.orderCheckPeriod);
        this.orderCheck();
    },

    setCallPeriod: function (func, timeout) {
        func();
        var timerCheck = setTimeout(function check() {
            func();
            timerCheck = setTimeout(check, timeout * 60000);
        }, timeout * 60000); //  check period in min.
    },

    coinsCheck: function () {
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

    helthCheck: function () { },

    orderCheck: async function () {
        var orders = await tools.getNewOrders();
        for (order in orders) {
            if (orders[order].status.code == 0) exec.takeOrder(orders[order]);
            else if (orders[order].status.code == 1)
                exec.checkDepositStatus1(orders[order]);
            else if (orders[order].status.code == 2)
                //  => if
                exec.checkDepositStatus2(orders[order]);
            else if (orders[order].status.code == 3) exec.makeRefund(orders[order]);
            else if (orders[order].status.code == 4)
                exec.checkRefundStatus1(orders[order]);
            else if (orders[order].status.code == 5)
                exec.checkRefundStatus2(orders[order]);
            else if (orders[order].status.code > 5) tools.arhOrder(orders[order]);
        }
    }
};