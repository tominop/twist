// File: ./models/transactions.js

//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
const Schema = mongoose.Schema;

const AdrSchema = new Schema({
    address: String,
    key: String
});

//Export function to create "SomeModel" model class 
module.exports = mongoose.model('btc3key', AdrSchema);