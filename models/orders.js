// File: ./models/orders.js

//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
    exchangeTxId: String,
    exchange: String,
    createDateUTC: Number,
    ttl: Number,
    status: Object,
    exchangeRatio: Number,
    userID: String,
    userEmail: String,
    userPhone: String,
    userAddrFrom: String,
    symbolFrom: String,
    valueFrom: Number,
    hashTxFrom: String,
    confirmTxFrom: Boolean,
    userAddrRefund: String,
    valueRefund: Number,
    hashTxRefund: String,
    confirmTxRefund: Boolean,
    userAddrTo: String,
    symbolTo: String,
    valueTo: Number,
    hashTxTo: String,
    confirmTxTo: Boolean,
    exchangeAddrTo: String,
    symbol: String,
    amount: Number,
    received: Number,
    sent: Number
});

//Export function to create "SomeModel" model class
module.exports = mongoose.model('Order', OrderSchema);