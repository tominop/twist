//  file tx.js
//  add/check/set/execute order functions routes

Tx = require("../models/transactions"),
    ArhTx = require("../models/arhtransacts");

//  main route - webhook    //  incoming Tx processing

//  getincomingTxs() route
app.post("/twist/incomingtx", function(req, res) {
    tools.incomingTx(req.body, res);
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

//  removeTxByAddrFrom() route
app.get("/twist/removetxaddrfrom/:addrs", function(req, res) {
    if (invalidData(req.params.addrs))
        return myErrorHandler("removeTxByAddrFrom: invalid address", res);
    tools.removeTxByAddrFrom(req.params.addrs, res);
});

//  removeTxByAddrTo() route
app.get("/twist/removetxaddrto/:addrs", function(req, res) {
    if (invalidData(req.params.addrs))
        return myErrorHandler("removeTxByAddrTo: invalid address", res);
    tools.removeTxByAddrTo(req.params.addrs, res);
});