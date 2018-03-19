//  file symbols.js
//  load symbols and check API microservices connections
//global.symbol = [];

global.coins = require(twist.mode == 'dev' ? '../private/coins' : './coins');

getBalance = function(coin) {
    axios.get(coins[coin].api + 'balanceTwist/' + coins[coin].walletFrom)
        .then(function(response) {
            if (response) {
                if (response.status == 200) {
                    coins[coin].balance = response.data.balance;
                    coins[coin].minerFee = response.data.minerFee;
                    coinUpdated(coin);
                    return;
                };
            };
            myErrorHandler('getBalance: invalid balance response from service ' + coins[coin].symbol + ' API');
            coins[coin].enabled = false;
            coinUpdated(coin);
        })
        .catch(function(error) {
            myErrorHandler('getBalance: service ' + coins[coin].symbol + ' API ' + coins[coin].api + ' connection error' + error.message);
            coins[coin].enabled = false;
            coinUpdated(coin);
        });
};

getPrice = function(coin, base) {
    const isYODA = coins[coin].symbol === 'YODA';
    if (isYODA) coin = 'ETH';
    axios.get(twist.priceApiUrl + coins[coin].symbol + base)
        .then(function(response) {
            if (response) {
                if (response.status == 200) {
                    if (isYODA) {
                        coin = 'YODA';
                        coins[coin].price = response.data.price / 1000;
                    } else coins[coin].price = response.data.price;
                    coinUpdated(coin);
                    return
                };
            };
            myErrorHandler('getPrice: invalid response from price service for pair ' + coins[coin].symbol + base);
            coins[coin].enabled = false;
            coinUpdated(coin);
        })
        .catch(function(error) {
            coins[coin].enabled = false;
            myErrorHandler('getPrice: price service API ' + twist.priceApiUrl + ' connection error ' + error.message);
            coinUpdated(coin);
        });
};

getReserv = function(coin) {
    coins[coin].reserv = 0;
    coinUpdated(coin);
};

coinUpdated = function(coin) {
    if (++coins[coin].updated === 3) coins[coin].updated = true;
};

// regular check coins status !!!TODO update default coin options without reload service
var timerCheck = setTimeout(function check() {
    for (coin in coins) {
        coins[coin].updated = false;
        coins[coin].enabled = true;
        coins[coin].balance = 0;
        coins[coin].minerFee = 0;
        coins[coin].price = 0;
        coins[coin].reserv = 0;
        getPrice(coin, 'USD');
        getBalance(coin);
        getReserv(coin);
    };
    timerCheck = setTimeout(check, 60000);
}, 60000); //  check period 60s.