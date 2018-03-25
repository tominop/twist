//  file tx.js
//  add/check/set/execute order functions routes

TX = require("../models/transactions"),
    ArhTx = require("../models/arhtransacts");

//  Route - getTxs() function
app.get("/twist/txs", function(req, res) {
    tools.getTxs(res);
});

//  Route - arhTxByID() function
app.get("/twist/arhtx/:orderID", function(req, res) {
    if (invalidData(req.params.orderID))
        return myErrorHandler("arhtx: invalid order ID", res);
        tools.arhTxByID(req.params.orderID, res);
});

//  Route - arhTxByAddr() function
app.get("/twist/arhaddrtx/:addrs", function(req, res) {
    if (invalidData(req.params.addrs))
        return myErrorHandler("arhtx: invalid address", res);
        tools.arhTxByAddr(req.params.addrs, res);
});
