// File: ./models/orders.js

//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
    exchangeTxId: String,
    createDateUTC: Number,
    ttl: Number,
    status: Number,
    exchangeRate: Number,
    userID: String,
    userAddrFrom: String,
    symbolFrom: String,
    valueFrom: Number,
    hashTxFrom: String,
    confirmTxFrom: Boolean,
    userAddrTo: String,
    symbolTo: String,
    valueTo: Number,
    hashTxTo: String,
    confirmTxTo: Boolean,
    exchangeAddrTo: String,
    symbol: String,
    amount: Number
});

//Export function to create "SomeModel" model class
module.exports = mongoose.model('Order', OrderSchema);