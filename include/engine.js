// regular check coins status !!!TODO update default coin options without reload service

Coin = require("./coinUtils");

module.exports = {

    start: function () {
        this.setCallPeriod(this.coinsCheck, twist.coinsCheckPeriod, twist.priceBase, Coin.coinUpdated);
        this.setCallPeriod(this.helthCheck, twist.helthCheckPeriod);
        this.setCallPeriod(this.orderCheck, twist.orderCheckPeriod);
    },

    setCallPeriod: function (func, timeout, param, cb) {
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
        orders = await tools.getNewOrders();
        for (order in orders) {
            if (order.status.code = 0) exec.takeOrder(order)
            else if (order.status.code = 1) exec.checkDepositStatus(order)    //  => if 
            else if (order.status.code = 2) exec.checkDepositStatus(order)
            else if (order.status.code = 3) exec.makeRefund(order)
            else if (order.status.code = 4) exec.waitRefundConfirm(order)
            else if (order.status.code = 5) exec.checkRefundProvider(order)
            else if (order.status.code > 5) exec.arhivate(order);
        }
    }
}