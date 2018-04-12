//  file coinUtils.js

module.exports = {

    getCoinBase: coin => {
        axios
            .get(coins[coin].api + "balanceTwist/" + coins[coin].walletFrom)
            .then(response => {
                if (response) {
                    if (response.status == 200) {
                        coins[coin].balance = response.data.balance;
                        coins[coin].minerFee = response.data.minerFee;
                        Coin.coinUpdated(coin);
                        return;
                    }
                }
                myErrorHandler(
                    "getBalance: invalid balance response from service " +
                    coins[coin].symbol +
                    " API"
                );
                coins[coin].enabled = false;
                Coin.coinUpdated(coin);
            })
    },

    getBalance: coin => {
        axios
            .get(coins[coin].api + "balanceTwist/" + coins[coin].walletFrom)
            .then(response => {
                if (response) {
                    if (response.status == 200) {
                        coins[coin].balance = response.data.balance;
                        coins[coin].minerFee = response.data.minerFee;
                        Coin.coinUpdated(coin);
                        return;
                    }
                }
                myErrorHandler(
                    "getBalance: invalid balance response from service " +
                    coins[coin].symbol +
                    " API"
                );
                coins[coin].enabled = false;
                Coin.coinUpdated(coin);
            })
            .catch((err) => {
                myErrorHandler(
                    "getBalance: service " +
                    coins[coin].symbol +
                    " API " +
                    coins[coin].api +
                    " connection error" +
                    err
                );
                coins[coin].enabled = false;
                Coin.coinUpdated(coin);
            });
    },

    getPrice: (coin, base) => {
        const isYODA = coins[coin].symbol === "YODA";
        const isETHR = coins[coin].symbol === "ETHR";
        const isBTC3 = coins[coin].symbol === "BTC3";
        if (isYODA) coin = "ETH"
        else if (isETHR) coin = "ETH"
        else if (isBTC3) coin = "BTC"
        axios
            .get(twist.priceApiUrl + coins[coin].symbol + base)
            .then(response => {
                if (response) {
                    var k = 1;
                    if (response.status == 200) {
                        if (
                            new Date().getTime() - Date.parse(response.data.uptime) >
                            twist.ttlPrice * 60000
                        )
                            k = 0;
                        if (isYODA) {
                            coin = "YODA";
                            coins[coin].price = valueToFix(response.data.price / 1000 * k);
                        } else {
                            if (isETHR) coin = "ETHR"
                            else if (isBTC3) coin = "BTC3";
                            coins[coin].price = valueToFix(response.data.price * k);
                        }
                        Coin.coinUpdated(coin);
                        return;
                    }
                }
                myErrorHandler(
                    "getPrice: invalid response from price service for pair " +
                    coins[coin].symbol +
                    base
                );
                coins[coin].price = 0;
                Coin.coinUpdated(coin);
            })
            .catch(err => {
                coins[coin].price = 0;
                myErrorHandler(
                    "getPrice: price service API " +
                    twist.priceApiUrl +
                    " connection error " +
                    err
                );
                Coin.coinUpdated(coin);
            });
    },

    getReserv: coin => {
        Coin.coinUpdated(coin);
        //    coins[coin].reserv = 0;
    },

    coinUpdated: coin => {
        if (++coins[coin].updated === 3) coins[coin].updated = true;
    }
};