//  file tx.js
//  add/check/set/execute order functions routes

TX = require("../models/transactions"),
    ArhTx = require("../models/arhtransacts");

//  main route - webhook    //  incoming Tx processing

//  getincomingTxs() route
app.post("/twist/incomingtx", function(req, res) {
    tools.incomingTx(req.body);
    res.status(200).send('Ok');
});

//  service routes

//  getTxs() route
app.get("/twist/txs", function(req, res) {
    tools.getTxs(res);
});

//  arhTxByID() route
app.get("/twist/arhtx/:orderID", function(req, res) {
    if (invalidData(req.params.orderID))
        return myErrorHandler("arhtx: invalid order ID", res);
        tools.arhTxByID(req.params.orderID, res);
});

//  arhTxByAddr() route
app.get("/twist/arhaddrtx/:addrs", function(req, res) {
    if (invalidData(req.params.addrs))
        return myErrorHandler("arhtx: invalid address", res);
        tools.arhTxByAddr(req.params.addrs, res);
});
