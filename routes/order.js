//  file order.js
//  add/check/set/execute order functions routes

//  global variables
Order = require("../models/orders");
ArhOrder = require("../models/arhorders");
Addrs = require("../models/addresses");
execOrders = []; //  array of executed orders

//  global functions
methods = require("../include/orderMethods");
tools = require("../include/mongoTools");
exec = require("../include/orderExec");
utils = require("../include/orderUtils");

//  main newOrder() route  //  create new order and start exchange

app.post("/twist/neworder", function(req, res) {
    if (invalidUserID(req.body.userID))
        return myErrorHandler("neworder: invalid userID", res);
    if (invalidAddr(req.body.symbolFrom, req.body.userAddrRefund))
        return myErrorHandler("neworder: invalid user Refund address", res);
    if (invalidAddr(req.body.symbolTo, req.body.userAddrTo))
        return myErrorHandler("neworder: invalid user Address To", res);
    if (invalidValue(req.body.symbolFrom, req.body.valueFrom))
        return myErrorHandler("neworder: invalid user valueFrom ", res);
    exec.newOrder(req.user.user.split('@')[0], req.body, res);
});

//  newAddresTo() route  //  create new order and start exchange
app.post("/twist/newaddress", async(req, res) => {
    const resp = await methods.getAddressTo(req.body.coin, req.user.user.split('@')[0], 0, req.body.userId, req.body.orderId);
    if (resp == null) return myErrorHandler("newaddress new adrress generation fail", res);
    res.json(resp.data);
});

//  service routes


//  start engine route
app.get("/twist/startengine", function(req, res) {
    engine.start(res);
});

//  stop engine route
app.get("/twist/stopengine/:clear", function(req, res) {
    engine.stop(req.params.clear, res);
});

//  getOrders() route
app.get("/twist/orders", function(req, res) {
    tools.getOrders(res);
});

//  getArhOrders() route
app.get("/twist/arhorders", function(req, res) {
    tools.getArhOrders(res);
});

//  getOrderByID() route
app.get("/twist/order/:orderID", function(req, res) {
    if (invalidData(req.params.orderID))
        return myErrorHandler("orderStatusCheck: invalid order ID", res);
    tools.findOrderByID(req.params.orderID, res);
});

//  setOrderStatus() route
app.get("/twist/status", function(req, res) {
    const query = require("url").parse(req.url, true).query;
    const orderID = query.order,
        status = parseInt(query.status),
        reason = query.reason;
    if (invalidData(orderID))
        return myErrorHandler("setOrderStatus: invalid parameters", res);
    tools.setOrderStatusID(orderID, status, reason, res);
});

//  getOrderByAddrFrom() route
app.get("/twist/addr/:addr", function(req, res) {
    const addr = req.params.addr;
    if (addr == undefined || addr == "")
        return myErrorHandler("getOrderByAddr: invalid address", res);
    tools.findOrderByAddr(addr, res);
});

//  getOrderByAddrFrom() route
app.get("/twist/ordersaddr/:addr", function(req, res) {
    const addr = req.params.addr;
    if (addr == undefined || addr == "")
        return myErrorHandler("getOrdersByAddr: invalid address", res);
    tools.findOrdersByAddr(addr, res);
});

//  getOrderByUserId() route
app.get("/twist/ordersuid/:uid", function(req, res) {
    const uid = req.params.uid;
    if (uid == undefined || uid == "")
        return myErrorHandler("getOrderByUserId: invalid UserId", res);
    tools.findOrdersByUid(uid, res);
});

//  getOrderByUserId() route
app.get("/twist/user/:uid", function(req, res) {
    const uid = req.params.uid;
    if (uid == undefined || uid == "")
        return myErrorHandler("getOrderByUserId: invalid UserId", res);
    tools.findOrderByUserId(uid, res);
});

//  deleteOrderByID() route
app.get("/twist/deleteorder/:orderID", function(req, res) {
    if (invalidData(req.params.orderID))
        return myErrorHandler("deleterder: invalid order ID", res);
    tools.deleteOrderByID(req.params.orderID, res);
});

//  arhOrderByID() route
app.get("/twist/arhorder/:orderID", function(req, res) {
    if (invalidData(req.params.orderID))
        return myErrorHandler("arhorder: invalid order ID", res);
    tools.arhOrderByID(req.params.orderID, res);
});

//  deArhOrderByID() route
app.get("/twist/dearhorder/:orderID", function(req, res) {
    if (invalidData(req.params.orderID))
        return myErrorHandler("arhorder: invalid order ID", res);
    tools.deArhOrderByID(req.params.orderID, res);
});


//  refundOrderByID() route
app.get("/twist/refundorder/:orderID", function(req, res) {
    if (invalidData(req.params.orderID))
        return myErrorHandler("arhorder: invalid order ID", res);
    tools.refundOrderByID(req.params.orderID, res);
});

//  getAddressWithBalance route
app.get("/twist/addrbalance/:coin", function(req, res) {
    const coin = req.params.coin;
    if (invalidSymbolAddr(coin))
        return myErrorHandler("getOrdersByAddr: invalid address", res);
    tools.getAddressWithBalance(coin, res);
});

//  getAddressWithUser route
app.get("/twist/addruser/:coin", function(req, res) {
    const coin = req.params.coin;
    if (invalidSymbolAddr(coin))
        return myErrorHandler("getAddressWithUser: invalid address", res);
    tools.getAddressWithUser(coin, res);
});

//  getAddressWithUser route
app.get("/twist/setaddruser/:coin", function(req, res) {
    const coin = req.params.coin;
    if (invalidSymbolAddr(coin))
        return myErrorHandler("getAddressWithUser: invalid address", res);
    tools.setAddressWithUser(coin, res);
});