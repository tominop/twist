//  file api_connections.js
//  check API microservices connections

checkConnection = function(url) {
    axios.get(eval('api.' + url) + 'api/TWIST')
        .then(function(response) {
            if (response) {
                if (response.status == 200) {
                    gasPrice = response.data.gasPrice;
                    console.log(timeNow() + ' сервис ' + url + ' API enabled on host ' + response.data.host);
                } else myErrorHandler('invalid response from service ' + url + ' API');
            }
        })
        .catch(function(error) {
            myErrorHandler('service API not aviable on ' + eval('api.' + url));
            process.exit();
        });
};

//  check API connections
checkConnection('YODA');
checkConnection('ETH');
checkConnection('BTC');