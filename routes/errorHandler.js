//  file errorHandler.js
//  error functions routes

// catch 404 and forward to error handler
app.use(function(req, res) {
    myErrorHandler('\"' + req.url + '\"' + ' route not support', res);
});

//  all error handler
app.use(function(err, req, res, next) {
    myErrorHandler(('twist api service :' + err), res);
});
