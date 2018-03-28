//  file order.js
//  add/check/set/execute order functions routes

//  global variables
Order = require("../models/orders");
ArhOrder = require("../models/arhorders");
execOrders = []; //  array of executed orders

//  global functions
methods = require("../include/orderApiUtils");
tools = require("../include/mongoUtils");
exec = require("../include/orderExec");
utils = require("../include/orderUtils");

//  main newOrder() route //  create new order and start exchange

app.post("/twist/neworder", function(req, res) {
    if (invalidUserID(req.body.userID))
        return myErrorHandler("neworder: invalid userID", res);
    if (invalidAddr(req.body.symbolFrom, req.body.userAddrFrom))
        return myErrorHandler("neworder: invalid user Address From", res);
    if (invalidAddr(req.body.symbolTo, req.body.userAddrTo))
        return myErrorHandler("neworder: invalid user Address To", res);
    if (invalidValue(req.body.symbolFrom, req.body.valueFrom))
        return myErrorHandler("neworder: invalid user valueFrom ", res);
    utils.newOrder(req.body, res);
});

//  service routes

//  start engine route
app.get("/twist/startengine", function(req, res) {
    service.start(res);
});

//  stop engine route
app.get("/twist/stopengine/:clear", function(req, res) {
    service.stop(req.params.clear, res);
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

//  getOrderByAddr() route
app.get("/twist/addr/:addr", function(req, res) {
    const addr = req.params.addr;
    if (addr == undefined || addr == "")
        return myErrorHandler("getOrderByAddr: invalid address", res);
    tools.findOrderByAddr(addr, res);
});

//  getOrderByUserId() route
app.get("/twist/addr/:uid", function(req, res) {
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