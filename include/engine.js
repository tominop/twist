// regular check coins status !!!TODO update default coin options without reload service

Coin = require("./coinUtils");

module.exports = {

    start: function () {
        this.setCallPeriod(this.coinsCheck, twist.coinsCheckPeriod, twist.priceBase, Coin.coinUpdated);
        this.setCallPeriod(this.helthCheck, twist.helthCheckPeriod);
        this.setCallPeriod(this.orderCheck, twist.orderCheckPeriod);
    },

    setCallPeriod: function (func, timeout, param, cb) {
        func(param, cb);
        var timerCheck = setTimeout(function check() {
            func(param, cb);
            timerCheck = setTimeout(check, timeout * 60000);
        }, timeout * 60000); //  check period in min.
    },

    coinsCheck: function (base, cb) {
        for (coin in coins) {
            coins[coin].updated = false;
            coins[coin].enabled = true;
            coins[coin].balance = 0;
            coins[coin].minerFee = 0;
            coins[coin].price = 0;
            //        coins[coin].reserv = 0;
            Coin.getPrice(coin, base, cb);
            Coin.getBalance(coin, cb);
            Coin.getReserv(coin, cb);
        }
    },

    helthCheck: function () {
    },

    orderCheck: async function () {
        var orders = await tools.getNewOrders();
        mess('orderCheck', orders);
        for (order in orders) {
            mess('orderCheck', orders[order]);
            if (orders[order].status.code == 0) exec.takeOrder(orders[order])
            else if (orders[order].status.code == 1) exec.checkDepositStatus(orders[order])    //  => if 
            else if (orders[order].status.code == 2) exec.checkDepositStatus(orders[order])
            else if (orders[order].status.code == 3) exec.makeRefund(orders[order])
            else if (orders[order].status.code == 4) exec.waitRefundConfirm(orders[order])
            else if (orders[order].status.code == 5) exec.checkRefundStatus(orders[order])
            else if (orders[order].status.code > 5) tools.arhOrder(orders[order]);
        }
    }
}