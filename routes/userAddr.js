//  file userAddr.js
//  add/check/set user, address functions routes

//  Load local parameters and functions 
require('../include/uar_utils');

//  Route - SC UserAddrReg: newUser(uID) function 
app.get('/twist/newuser/:uid', function(req, res) {
    const userID = req.params.uid;
    if (invalidUserID(userID)) return myErrorHandler('invalid userID', res)
    axios.all([uarFunc(coins.YODA.api + 'uar/newuser/' + userID)])
        .then(function(ureg) {
            if (ureg) {
                if (ureg.status == 200) return res.json({ error: false, hash: ureg.data.hash });
            }
            myErrorHandler('smart contract UserAddrReg(newuser): invalid response', res);
        })
        .catch(function(error) {
            myErrorHandler('smart contract UserAddrReg(newuser): ' + error.message, res);
        });
});

//  Route - SC UserAddrReg: setUser(uID, status) function 
app.post('/twist/setuser', function(req, res) {
    const userID = req.body.userID,
        userStatus = req.body.userStatus;
    if (invalidUserID(userID)) return myErrorHandler('invalid userID', res)
    if (invalidUserStatus(userStatus)) return myErrorHandler('invalid userStatus', res)
    axios.all([uarFunc(coins.YODA.api + 'uar/setuser/' + userID + '-' + userStatus)])
        .then(function(ureg) {
            if (ureg) {
                if (ureg.status == 200) return res.json({ error: false, hash: ureg.data.hash });
            }
            myErrorHandler('smart contract UserAddrReg(setuser): invalid response', res);
        })
        .catch(function(error) {
            myErrorHandler('smart contract UserAddrReg(setuser): ' + error.message, res);
        });
})

//  Route - userAddrBanCheck() function 
app.post('/twist/iuban', function(req, res) {
    const userID = req.body.userID,
        userAddr = req.body.userAddr;
    var symbolAddr = req.body.symbolAddr;
    if (invalidUserID(userID)) return myErrorHandler('invalid userID', res);
    if (invalidSymbolAddr(symbolAddr)) return myErrorHandler('invalid symbol', res);
    if (invalidAddr(symbolAddr, userAddr)) return myErrorHandler('invalid address', res);
    symbolAddr = symbolConvert(symbolAddr);
    axios.all([uarFunc(coins.YODA.api + 'uar/checkuser/' + userID), uarFunc(coins.YODA.api + 'uar/checkaddrs/' + symbolAddr + userAddr)])
        .then(axios.spread(function(uban, aban) { // Both requests are now complete
            if (uban && aban) {
                if (uban.status == 200 && aban.status == 200) return res.json({ error: false, userBanned: (uban.data.status == '9'), addrBanned: (aban.data.status == '9') });
            }
            myErrorHandler('smart contract UserAddrReg(iuban): invalid response', res);
        }))
        .catch(function(error) {
            myErrorHandler('smart contract UserAddrReg(iuban): ' + error.message, res);
        });
})

//  Route - userAddrBanCheck() function 
app.get('/twist/iuban/:uid', function(req, res) {
    const userID = req.params.uid;
    if (invalidUserID(userID)) return myErrorHandler('invalid userID', res);
    axios.all([uarFunc(coins.YODA.api + 'uar/checkuser/' + userID)])
        .then(function(uban) {
            if (uban) {
                if (uban.status = 200) return res.json({ error: false, userBanned: (uban.data.status == '9') });
            }
            myErrorHandler('smart contract UserAddrReg(uid): invalid response', res);
        })
        .catch(function(error) {
            myErrorHandler('smart contract UserAddrReg(uid): ' + error.message, res);
        });
})