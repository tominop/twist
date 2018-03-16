//  file userAddr.js
//  add/check/set user, address functions routes

//  Load local parameters and functions 
require('../include/uar_utils');

//  Route - SC UserAddrReg: newUser(uID) function 
app.get('/twist/newuser/:uid', function(req, res, next) {
    const userID = req.params.uid;
    if (invalidUserID(userID)) myErrorHandler('invalid userID', res)
    else {
        axios.all([uarFunc(api.YODA + 'uar/newuser/' + userID)])
            .then(axios.spread(function(ureg) {
                if (ureg) {
                    //                    console.log('uban ' + uban + ', aban ' + aban);
                    //console.log('uban ' + uban.data.status + ', aban ' + aban.data.status);
                    if (ureg.status == 200) res.json({ error: false, hash: ureg.data.hash });
                    else myErrorHandler('smart contract UserAddrReg not response', res);
                } // Both requests are now complete
                else myErrorHandler('smart contract UserAddrReg not response', res);
            }))
            .catch(function(error) {
                myErrorHandler(error.message, res);
            });
    };
});

//  Route - SC UserAddrReg: setUser(uID, status) function 
app.post('/twist/setuser', function(req, res, next) {
    const userID = req.body.userID,
        userStatus = req.body.userStatus;
    if (invalidUserID(userID)) myErrorHandler('invalid userID', res)
    else if (invalidUserStatus(userStatus)) myErrorHandler('invalid userStatus', res)
    else {
        axios.all([uarFunc(api.YODA + 'uar/setuser/' + userID + '-' + userStatus)])
            .then(axios.spread(function(ureg) {
                if (ureg) {
                    //                    console.log('uban ' + uban + ', aban ' + aban);
                    //console.log('uban ' + uban.data.status + ', aban ' + aban.data.status);
                    if (ureg.status == 200) res.json({ error: false, hash: ureg.data.hash });
                    else myErrorHandler('smart contract UserAddrReg(setuser) not response', res);
                } // Both requests are now complete
                else myErrorHandler('smart contract UserAddrReg(setuser) not response', res);
            }))
            .catch(function(error) {
                myErrorHandler(error.message, res);
            });
    };
});

//  Route - userAddrBanCheck() function 
app.post('/twist/iuban', function(req, res, next) {
    const userID = req.body.userID,
        userAddr = req.body.userAddr;
    var symbolAddr = req.body.symbolAddr;
    if (invalidUserID(userID)) myErrorHandler('invalid userID', res);
    else if (invalidSymbolAddr(symbolAddr)) myErrorHandler('invalid symbol', res);
    else if (invalidAddr(symbolAddr, userAddr)) myErrorHandler('invalid address', res);
    else {
        symbolAddr = symbolConvert(symbolAddr);
        axios.all([uarFunc(api.YODA + 'uar/checkuser/' + userID), uarFunc(api.YODA + 'uar/checkaddrs/' + symbolAddr + userAddr)])
            .then(axios.spread(function(uban, aban) {
                if (uban && aban) {
                    //console.log('uban ' + uban.data.status + ', aban ' + aban.data.status);
                    if (uban.status == 200 && aban.status == 200) res.json({ error: false, userBanned: (uban.data.status == '9'), addrBanned: (aban.data.status == '9') });
                    else myErrorHandler('smart contract UserAddrReg not response', res);
                } // Both requests are now complete
                else myErrorHandler('smart contract UserAddrReg not response', res);
            }))
            .catch(function(error) {
                myErrorHandler(error.message, res);
            });
    };
});

//  Route - userAddrBanCheck() function 
app.get('/twist/iuban/:uid', function(req, res, next) {
    const userID = req.params.uid;
    if (invalidUserID(userID)) myErrorHandler('invalid userID', res);
    else {
        axios.all([uarFunc(api.YODA + 'uar/checkuser/' + userID)])
            .then(axios.spread(function(uban) {
                if (uban) {
                    //console.log('uban ' + uban + ', aban ' + aban);
                    if (uban.status = 200) res.json({ error: false, userBanned: (uban.data.status == '9') });
                    else myErrorHandler('smart contract UserAddrReg not response', res);
                } // Both requests are now complete
                else myErrorHandler('smart contract UserAddrReg not response', res);
            }))
            .catch(function(error) {
                myErrorHandler(error.message, res);
            });
    };
});