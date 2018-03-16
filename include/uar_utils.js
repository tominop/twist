//  file uar_utils.js
//  local variables and function for userAddr route of twist exchange

uarFunc = function(url) {
    return axios.get(url)
        .catch(function(error) {
            console.log('err: ' + error)
        });
};

symbolConvert = function(symbol) {
    switch (symbol) {
        case "ETH":
            return "ET";
        case "BTC":
            return "BT";
        case "BTC3":
            return "B3";
        default:
            return "";
    };
};