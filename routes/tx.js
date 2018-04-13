//  file tx.js
//  add/check/set/execute order functions routes

Tx = require("../models/transactions"),
    ArhTx = require("../models/arhtransacts");

//  main route - webhook    //  incoming Tx processing

//  getincomingTxs() route
app.post("/twist/incomingtx", (req, res) => {
    tools.incomingTx(req.body, res);
});

//  service routes

//  getTxs() route
app.get("/twist/txs", (req, res) => {
    tools.getTxs(res);
});

//  getTxs() route
app.get("/twist/findtx/:addr", async (req, res) => {
    var tx = await tools.findTx({ To: req.params.addr })
    if (tx != null) return res.json({ error: false, tx: tx, archived: false });
    tx = await tools.findArhTx({ To: req.params.addr });
    if (tx != null) return res.json({ error: false, tx: tx, archived: true });
    res.json({ error: true, tx: null });
});

//  arhTxByID() route
app.get("/twist/arhtx/:orderID", (req, res) => {
    if (invalidData(req.params.orderID))
        return myErrorHandler("arhtx: invalid order ID", res);
    tools.arhTxByID(req.params.orderID, res);
});

//  arhTxByAddr() route
app.get("/twist/arhaddrtx/:addrs", (req, res) => {
    if (invalidData(req.params.addrs))
        return myErrorHandler("arhtx: invalid address", res);
    tools.arhTxByAddr(req.params.addrs, res);
});

//  removeTxByAddrFrom() route
app.get("/twist/removetxaddrfrom/:addrs", (req, res) => {
    if (invalidData(req.params.addrs))
        return myErrorHandler("removeTxByAddrFrom: invalid address", res);
    tools.removeTxByAddrFrom(req.params.addrs, res);
});

//  removeTxByAddrTo() route
app.get("/twist/removetxaddrto/:addrs", (req, res) => {
    if (invalidData(req.params.addrs))
        return myErrorHandler("removeTxByAddrTo: invalid address", res);
    tools.removeTxByAddrTo(req.params.addrs, res);
});