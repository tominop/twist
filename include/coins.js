//  file ETH.js
//  global variables of ETH exchange
//  addresses must be the same as in microservices

module.exports = {
    BTC: {
        api: 'http://localhost:8103/btc3/',
        confirmations: 1,
        address: ['mrG1ZLaUNWGrD7Kpy2ZBHbA1JJcQ1RTkTk'], // testnet3 bob account,  to receave coin from user 
        name: 'bob'     // from transfer coins to user
    },
    ETH: {
        api: "http://localhost:8200/eth/",
        confirmations: 1,
        address: ['0xe050B09273Bcf676Ef76C9354Eb1a2DCBC925f4D'], //  to receave coin from user (the same as bob account)
        name: 'bob'     // from transfer coins to user
    },
    YODA: {
        api: "http://localhost:8201/YODA/",
        confirmations: 1,
        address: ['0xe050B09273Bcf676Ef76C9354Eb1a2DCBC925f4D'], //  to receave coin from user (the same as bob account)
        name: 'plasmoid'     // from transfer Tx to smart contract
    }
}