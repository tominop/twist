//  file user.js
//  add/check/set user, address routes

//  Load user functions 
user = require('../include/userUtils');

//  SC UserAddrReg: newUser(uID) route 
app.get('/twist/newuser/:uid', (req, res) => {
    const userID = req.params.uid;
    if (invalidUserID(userID)) return myErrorHandler('invalid userID', res)
    user.apiCall(coins['YODA'].api + 'uar/newuser/' + userID)
        .then(ureg => {
            if (ureg) {
                if (ureg.status == 200) return res.json({ error: false, hash: ureg.data.hash });
            }
            myErrorHandler('smart contract UserAddrReg(newuser): invalid response', res);
        })
        .catch((err) => {
            myErrorHandler('smart contract UserAddrReg(newuser): ' + err, res);
        });
});

//  SC UserAddrReg: setUser(uID, status) route 
app.post('/twist/setuser', (req, res) => {
    const userID = req.body.userID,
        userStatus = req.body.userStatus;
    if (invalidUserID(userID)) return myErrorHandler('invalid userID', res)
    if (invalidUserStatus(userStatus)) return myErrorHandler('invalid userStatus', res)
    user.apiCall(coins['YODA'].api + 'uar/setuser/' + userID + '-' + userStatus)
        .then((ureg) => {
            if (ureg) {
                if (ureg.status == 200) return res.json({ error: false, hash: ureg.data.hash });
            }
            myErrorHandler('smart contract UserAddrReg(setuser): invalid response', res);
        })
        .catch((err) => {
            myErrorHandler('smart contract UserAddrReg(setuser): ' + err, res);
        });
});

//  userAddrBanCheck() route 
app.post('/twist/iuban', (req, res) => {
    const userID = req.body.userID,
        userAddr = req.body.userAddr;
    var symbolAddr = req.body.symbolAddr;
    if (invalidUserID(userID)) return myErrorHandler('invalid userID', res);
    if (invalidSymbolAddr(symbolAddr)) return myErrorHandler('invalid symbol', res);
    if (invalidAddr(symbolAddr, userAddr)) return myErrorHandler('invalid address', res);
    symbolAddr = user.symbolConvert(symbolAddr);
    axios.all([user.apiCall(coins['YODA'].api + 'uar/checkuser/' + userID), user.apiCall(coins['YODA'].api + 'uar/checkaddrs/' + symbolAddr + userAddr)])
        .then(axios.spread((uban, aban) => { // Both requests are now complete
            if (uban && aban) {
                if (uban.status == 200 && aban.status == 200) return res.json({ error: false, userBanned: (uban.data.status == '9'), addrBanned: (aban.data.status == '9') });
            }
            myErrorHandler('smart contract UserAddrReg(iuban): invalid response', res);
        }))
        .catch((err) => {
            myErrorHandler('smart contract UserAddrReg(iuban): ' + err, res);
        });
});

//  userAddrBanCheck() route 
app.get('/twist/iuban/:uid', (req, res) => {
    const userID = req.params.uid;
    if (invalidUserID(userID)) return myErrorHandler('invalid userID', res);
    user.apiCall(coins['YODA'].api + 'uar/checkuser/' + userID)
        .then((uban) => {
            if (uban) {
                if (uban.status == 200) return res.json({ error: false, userBanned: (uban.data.status == '9') });
            }
            myErrorHandler('smart contract UserAddrReg(uid): invalid response', res);
        })
        .catch((err) => {
            myErrorHandler('smart contract UserAddrReg(uid): ' + error, res);
        });
});