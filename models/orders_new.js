// File: ./models/orders.js

//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
    _id,
    deal: Object,
    /*  {  exchangeTxId: String,
        createDateUTC: Number,
        ttl: Number,
        status: Object,
        exchangeRatio: Number,
        symbolFrom: String,
        symbolTo: String,
        summ: Number,
        price: Number,
        exchangeRatio: Number,
        exchange: Object,
    /*  {  exchangeAddrTo: String,
        exchangeAddrFrom: String, } */
    user: Object,
    /*  {  userID: String,
        userEmail: String,
        userPhone: String,  }   */
    deposit: Object,
    /*  {  userAddrFrom: String,
        symbolFrom: String,
        valueFrom: Number,
        hashTxFrom: String,
        confirmTxFrom: Boolean,
        received: Number, }   */
    refund: Object,
    /*  {  userAddrRefund: String,
        valueRefund: Number,
        hashTxRefund: String,
        confirmTxRefund: Boolean, } */
    withdrawal: Object,
    /*  {  userAddrTo: String,
        symbolTo: String,
        valueTo: Number,
        hashTxTo: String,
        confirmTxTo: Boolean, 
        sent: Number } */
});

//Export function to create "SomeModel" model class
module.exports = mongoose.model('Order', OrderSchema);