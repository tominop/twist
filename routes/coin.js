//  file coin.js
//  get coin and other sevice functions routes

//  getCions route
app.get("/twist/getcoins", (req, res) => {
    var info = {};
    for (coin in coins) {
        var c = {};
        for (key in coins[coin]) {
            if (key != "api" && key != "walletFrom") c[key] = coins[coin][key];
        }
        info[coin] = c;
    }
    res.json({ error: false, coins: info });
});

//  runMethod() route
app.get("/twist/runmethod/:data", (req, res) => {
    var data = JSON.parse(req.params.data);
    mess(' runMethod route', ' get command ' + data.name + ' param ' + data.param);
    methods.runMethod(data.name, data.param)
        .then((response) => {
            res.json({ error: false, result: response });
        })
});