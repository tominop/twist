//  file api_connections.js
//  load symbols and check API microservices connections
//global.symbol = [];

global.coins = require('./coins');

checkConnection = function(symbol) {
    axios.get(symbol.api + 'api/TWIST')
        .then(function(response) {
            if (response) {
                if (response.status == 200) {
                    symbol.enabled = true;
                    symbol.balance = response.data.balance;
                    symbol.reserv = 0;
                    symbol.baseFee = response.data.fee;
                    console.log(timeNow() + ' сервис ' + symbol + ' API enabled on host ' + response.data.host);
                } else myErrorHandler('invalid response from service ' + symbol + ' API');
            }
        })
        .catch(function(error) {
            myErrorHandler('service ' + symbol + ' API not aviable on ' + symbol.api);
            symbol.enabled = false;
            process.exit();
        });
};


//  check API connections
for (coin in coins) {
    checkConnection(coins[coin]);
}
