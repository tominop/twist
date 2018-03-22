//  file twist.js
//  global variables of twist exchange
//  addresses must be the same as in microservices

module.exports = {
    priceApiUrl: 'http://159.65.20.8:3000/bitfinex/',
    ttl: 10, //    order's life time  - time for waiting transaction from User (in minutes) 
    ttlPrice: 5, //    prices life time  - time period valid price (in minutes) 
    mode: 'dev',
    minLimit: 1.0, // 
    maxLimit: 2000.0, // 
    fee: 0.0,
    fix: 5, //  number of significant digits
    humans: ['Order received', //  0..default texts for order statuses
        'Awaiting deposit', //  1
        'Pending deposit confirmation', //..2
        'Deposit confirmed', //..3
        'Refund sent', //..4
        'Pending refund confirmation', //..5
        'Order complete', //..6
        'Order canceled' //..7
    ]
}