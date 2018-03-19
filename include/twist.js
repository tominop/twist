//  file twist.js
//  global variables of twist exchange
//  addresses must be the same as in microservices

module.exports = {
    priceApiUrl: 'http://159.65.20.8:3000/bitfinex/',
    ttl: 10, //    order's life time  - time for waiting transaction from User (in minutes) 
    mode: 'dev',
    fee: 0
}