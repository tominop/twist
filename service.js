/*!
 * @title twist server - Twist API service
 * @author Oleg Tomin - <2tominop@gmail.com>
 * @dev Basic implementaion of Twist API functions  
 * MIT Licensed Copyright(c) 2018-2019
 */

const express = require("express"),
    bodyParser = require("body-parser");

//  Set global variable app (for use in routes)
app = express();

//  Load global parameters and functions 
require('./include/globals');

//  Configure mongoDB
const dbConfig = require(twist.mode == 'dev' ? './private/db' : './db'),
    mongoose = require('mongoose');

mongoose.connection.on("open", function(ref) {
    console.log(timeNow() + " twist service connected to mongo server");
});

mongoose.connection.on("error", function(err) {
    myErrorHandler("could not connect to mongo server: " + err.messge);
});

// Connect to DB
mongoose.connect(dbConfig.url, {
    useMongoClient: true
});
mongoose.Promise = require('bluebird');

//  CORS
app.use(function(req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
});

app.options("/*", function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    res.send(200);
});

//  Configuring express to use body-parser as middle-ware
app.use(bodyParser.json());

//  Load coin symbols and check aviable api microservices connections
require('./include/symbols');

//  Load routes (shema without express.router)
require('./routes/userAddr');
require('./routes/order');

// catch 404 and forward to error handler
app.use(function(req, res) {
    myErrorHandler('\"' + req.url + '\"' + ' route not support', res);
});

app.use(function(err, req, res, next) {
    myErrorHandler(('twist api service :' + err.message), res);
});

const port = process.env.PORT_TWIST || 8900

app.listen(port, () => {
    console.log(timeNow() + ' twist service listening on ' + port.toString())
})