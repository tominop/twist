//  file api_connections.js
//  load symbols and check API microservices connections
//global.symbol = [];

global.coins = require(twist.mode == 'dev' ? './private/coins' : './coins');

getBalance = function(coin) {
    axios.get(coin.api + 'balance/' + coins[coin].wallet)
        .then(function(response) {
            if (response) {
                if (response.status == 200) {
                    coins[coin].balance = response.data.balance;
                    //coin.minerFee = response.data.fee;    TODO: modify coin_svc getBalance for return fee
                    coinUpdated(coin);
                    return;
                };
            }; 
            myErrorHandler('invalid balance response from service ' + coins[coin].symbol + ' API');
            coins[coin].enabled = false;
            coinUpdated(coin);
        })
        .catch(function(error) {
            myErrorHandler('service ' + coins[coin].symbol + ' API ' + coins[coin].api + ' connection error:' + error.message);
            coins[coin].enabled = false;
            coinUpdated(coin);
        });
};

getPrice = function(coin, base) {
    axios.get(twist.priceApiUrl + coins[coin].symbol + base)
    .then(function(response) {
        if (response) {
            if (response.status == 200) {
                coins[coin].price = response.data.price;
               coinUpdated(coin);
               return
            };
        }; 
        myErrorHandler('invalid response from price service for pair ' + coins[coin].symbol + base);
        coins[coin].enabled = false;
        coinUpdated(coin);
    })
    .catch(function(error) {
        coins[coin].enabled = false;
        myErrorHandler('price service API ' + twist.priceApiUrl + ' connection error:' + error.message);
        coinUpdated(coin);
    });
};

getReserv = function(coin) {
    coins[coin].reserv = 0;
    coinUpdated(coin);
};

coinUpdated = function (coin) {
    if (++coins[coin].updated === 3) coins[coin].updated = true;
};


// regular check coins status !!!TODO regular update default coin options
var checkCoins = setInterval(function () {
//    const newCoins = require('./coins');  TODO
    for (coin in coins) {
//        coins[coin] = newCoins[coin];
        coins[coin].updated = false;
        coins[coin].enabled = true;
        coins[coin].balance = 0;
        coins[coin].minerFee = 0;
        coins[coin].price = 0;
        coins[coin].reserv = 0;
        getPrice(coin,'USD');
        getBalance(coin);
        getReserv(coin);
    }
}, 60000);  //  check period 60s.
