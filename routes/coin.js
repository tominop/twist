//  file coin.js
//  get coin and other sevice functions routes

//  Route - getCions function
app.get("/twist/getcoins", function(req, res) {
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

//  Route - runMethod() function
app.get("/twist/runmethod/:data", function(req, res) {
    var data = JSON.parse(req.params.data);
    console.log('get runMethod command ' + data.name + ' param ' + data.param);
    methods.runMethod(data.name, data.param)
    .then((response)=>{
        res.json({error: false, result: response});
    })
});

