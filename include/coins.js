//  file ETH.js
//  global variables of ETH exchange
//  addresses must be the same as in microservices

module.exports = {
    BTC3: {
        symbol: 'BTC3',
        api: 'http://localhost:9000/', //  url of Bitcoin API microservice
        confirmations: 1, //  number of mined blocks for Tx confirmation
        canReceive: true, //  true - Twist service can bye and receive BTC from user
        addressTo: ['1KaKaGiEQoJEFqNzvPtHE3Sx51dR9ugGZz'], // bitcoin account for receive BTC from user 
        canSend: false, //  false - Twist service can not sell and send BTC to user
        walletFrom: 'a1', // name of Twist account used for transfer BTC to user
        exchangeFee: 0
    },
    BTC: {
        symbol: 'BTC',
        api: 'http://localhost:9000/', //  url of Bitcoin API microservice
        confirmations: 1, //  number of mined blocks for Tx confirmation
        canReceive: false, //  true - Twist service can bye and receive BTC from user
        addressTo: ['1KaKaGiEQoJEFqNzvPtHE3Sx51dR9ugGZz'], // bitcoin account for receive BTC from user 
        canSend: false, //  false - Twist service can not sell and send BTC to user
        walletFrom: 'a1', // name of Twist account used for transfer BTC to user
        exchangeFee: 0
    },
        ETH: {
            symbol: 'ETH',
            api: "http://localhost:9000/",
            confirmations: 1,
            canReceive: false,
            addressTo: ['0xb5Da165Ec5526FeE516D0c39B8CA77a90b3F44AC'], //  to receave ETH from user (the same as bob account)
            canSend: true,
            walletFrom: 'b1', // from transfer ETH to user
            exchangeFee: 0
        },
        YODA: {
            symbol: 'YODA',
            api: "http://localhost:9000/",
            confirmations: 1,
            canReceive: false,
            addressTo: ['0xb5Da165Ec5526FeE516D0c39B8CA77a90b3F44AC'], //  YODA (Ethereum) account for receive YODA from user
            canSend: false,
            walletFrom: 'c1', // name of Twist account used for transfer Tx to smart contract
            exchangeFee: 0
        }
    }