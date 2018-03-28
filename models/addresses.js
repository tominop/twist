// File: ./models/transactions.js

//Require Mongoose
var mongoose = require('mongoose');

//Define a schema
const Schema = mongoose.Schema;

const AdrSchema = new Schema({
    coin: String,
    address: String,
    userId: String,
    orderId: String,
    counter: Number,
    active: Boolean
});

//Export function to create "SomeModel" model class 
module.exports = mongoose.model('TwistAddr', AdrSchema);