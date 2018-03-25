// regular check coins status !!!TODO update default coin options without reload service

module.exports = {

    start: function() {
        this.statusCheck();
    },

    statusCheck: function () {
var timerCheck = setTimeout(function check() {
    for (coin in coins) {
        coins[coin].updated = false;
        coins[coin].enabled = true;
        coins[coin].balance = 0;
        coins[coin].minerFee = 0;
        coins[coin].price = 0;
        //        coins[coin].reserv = 0;
        getPrice(coin, 'USD');
        getBalance(coin);
        getReserv(coin);
    };
    timerCheck = setTimeout(check, 60000);
}, 6000000); //  check period 60s.
    }
}
