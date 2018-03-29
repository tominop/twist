// File: ./models/transactions.js

//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
const Schema = mongoose.Schema;

const TxSchema = new Schema({
    hashTx: String,
    orderID: String,
    createDateUTC: String,
    confirms: Number,
    addrFrom: String,
    value: Number,
    To: String
});

//Export function to create "SomeModel" model class  
module.exports = mongoose.model('Tx', TxSchema);