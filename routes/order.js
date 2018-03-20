//  file order.js
//  add/check/set/execute order functions routes

//  Load local parameters and functions
require("../include/order_utils");

//  Route - newOrder() function - main algorithm
app.post("/twist/neworder", function(req, res) {
    if (invalidUserID(req.body.userID))
        return myErrorHandler("neworder: invalid userID", res);
    if (invalidAddr(req.body.symbolFrom, req.body.userAddrFrom))
        return myErrorHandler("neworder: invalid user Address From", res);
    if (invalidAddr(req.body.symbolTo, req.body.userAddrTo))
        return myErrorHandler("neworder: invalid user Address To", res);
    if (invalidValue(req.body.symbolFrom, req.body.valueFrom))
        return myErrorHandler("neworder: invalid user valueFrom ", res);
    newOrder(req.body, res);
});

//  Route - orderStatusCheck() function
app.get("/twist/order/:orderID", function(req, res) {
    if (invalidData(req.params.orderID))
        return myErrorHandler("orderStatusCheck: invalid order ID", res);
    findOrderByID(req.params.orderID, res);
});

//  Route - setOrderStatus() function
app.get("/twist/status", function(req, res) {
    const query = require("url").parse(req.url, true).query;
    const orderID = query.order,
        status = parseInt(query.status);
    if (invalidData(orderID) || invalidData(status))
        return myErrorHandler("setOrderStatus: invalid parameters", res);
    setOrderStatusID(orderID, status, res);
});

//  Route - getOrderByAddr() function
app.get("/twist/addr/:addr", function(req, res) {
    const addr = req.params.addr;
    if (addr == undefined || addr == "")
        return myErrorHandler("getOrderByAddr: invalid address", res);
    findOrderByAddr(addr, res);
});

//  Route - getCions function
app.get("/twist/getcoins", function(req, res) {
    var info = {};
    for (coin in coins) {
        var c = {};
        for (key in coins[coin]) {
            if (key != "api" && key != "walletFrom") c[key] = coins[coin][key];
        }
        info[coin] = c;
    }
    res.json({ error: false, coins: info });
});

//  Route - getPrice() function
app.get("/twist/price/:pair", function(req, res) {
    const pair = req.params.pair,
        price = 0.085;
    error = pair == undefined || (pair != "BTCETH" && pair != "ETHBTC");
    if (error) myErrorHandler("invalid parameter pair " + pair, res);
    else res.json({ error: false, price: pair == "ETHBTC" ? price : 1 / price });
});

setOrderStatusID = function(orderID, status, res) {
    Order.findOne({ exchangeTxId: orderID }).exec(function(err, order) {
        if (err) return myErrorHandler(err.message, res);
        if (order == null) return myErrorHandler("order not foud", res);
        if (status != undefined) {
            order.status = status;
            order.save(function(err) {
                if (err)
                    return myErrorHandler(
                        "setOrderStatusID order.save: " + err.message,
                        res
                    );
            });
            //  console.log('Order ' + orderID + '  %s', order.status.toString());
            if (res) res.json({ error: false, status: order.status });
        }
    });
};