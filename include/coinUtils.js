//  file coinUtils.js

module.exports = {

    getBalance: function (coin, cb) {
        axios.get(coins[coin].api + 'balanceTwist/' + coins[coin].walletFrom)
            .then(function (response) {
                if (response) {
                    if (response.status == 200) {
                        coins[coin].balance = response.data.balance;
                        coins[coin].minerFee = response.data.minerFee;
                        this.cb(coin);
                        return;
                    };
                };
                myErrorHandler('getBalance: invalid balance response from service ' + coins[coin].symbol + ' API');
                coins[coin].enabled = false;
                this.cb(coin);
            })
            .catch(function (error) {
                myErrorHandler('getBalance: service ' + coins[coin].symbol + ' API ' + coins[coin].api + ' connection error' + error.message);
                coins[coin].enabled = false;
                cb(coin);
            });
    },

    getPrice: function (coin, base, cb) {
        const isYODA = coins[coin].symbol === 'YODA';
        if (isYODA) coin = 'ETH';
        axios.get(twist.priceApiUrl + coins[coin].symbol + base)
            .then(function (response) {
                if (response) {
                    var k = 1;
                    if (response.status == 200) {
                        if (new Date().getTime() - Date.parse(response.data.uptime) > twist.ttlPrice * 60000) k = 0;
                        if (isYODA) {
                            coin = 'YODA';
                            coins[coin].price = valueToFix(response.data.price / 1000 * k);
                        } else coins[coin].price = valueToFix(response.data.price * k);
                        cb(coin);
                        return
                    };
                };
                myErrorHandler('getPrice: invalid response from price service for pair ' + coins[coin].symbol + base);
                coins[coin].price = 0;
                cb(coin);
            })
            .catch(function (error) {
                coins[coin].price = 0;
                myErrorHandler('getPrice: price service API ' + twist.priceApiUrl + ' connection error ' + error.message);
                cb(coin);
            });
    },

    getReserv: function (coin, cb) {
        //    coins[coin].reserv = 0;
        cb(coin);
    },

    coinUpdated: function (coin) {
        if (++coins[coin].updated === 3) coins[coin].updated = true;
    }

}