//  file userUtils.js
//  function for userAddr route of twist exchange

module.exports = {

    uarFunc: function (url) {
        return axios.get(url)
            .catch(function (error) {
                myErrorHandler('uarFunc: ' + error.message)
            });
    },

    symbolConvert: function (symbol) {
        switch (symbol) {
            case "ETH":
                return "ET";
            case "BTC":
                return "BT";
            case "BTC3":
                return "B3";
            case "YODA":
                return "YD";
            default:
                return "";
        };
    }
}