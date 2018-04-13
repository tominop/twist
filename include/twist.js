//  file twist.js
//  global variables of twist exchange
//  addresses must be the same as in microservices

module.exports = {
    url: 'http://localhost', //  twist service url
    priceApiUrl: 'http://159.65.20.8:3000/bitfinex/',
    priceBase: 'USD', // price base for coin exchange ratio
    ttl: 10, //    order's life time  - time for waiting transaction from User (in minutes) 
    ttlPrice: 5, //    prices life time  - time period valid price (in minutes)
    helthCheckPeriod: 50, // helth check period - check interval (in minutes)
    coinsCheckPeriod: 5, // coins check period - check interval (in minutes)
    orderCheckPeriod: 1, // new order check period - check interval (in minutes)
    waitConfirmPeriod: 60, // awaiting deposit confirmation period (in minutes)
    mode: 'development', // default
    minLimit: 1.0, // 
    maxLimit: 200.0, // 
    fee: 0.0,
    fix: 5, //  number of significant digits
    humans: ['Order received', //  0..default texts for order statuses
        'Awaiting deposit', //  1
        'Pending deposit confirmation', //..2
        'Deposit confirmed', //..3
        'Withdrawal sent', //..4
        'Pending withdrawal confirmation', //..5
        'Order complete', //..6
        'Order canceled' //..7
    ]
}