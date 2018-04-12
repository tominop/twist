/*!
 * @title engine.js - main function of twist exchange service
 * @author Oleg Tomin - <2tominop@gmail.com>
 * @dev Basic implementaion of main functions  
 * MIT Licensed Copyright(c) 2018-2019
 */

// regular check coins status 

//  !!!TODO update default coin options without reload service

Coin = require("./coinUtils");

module.exports = {

    timerCheck: [],

    start: res => {
        engine.setCallPeriod(engine.coinsCheck, twist.coinsCheckPeriod, 0);
        engine.setCallPeriod(engine.helthCheck, twist.helthCheckPeriod, 1);
        //        this.setCallPeriod(this.orderCheck, twist.orderCheckPeriod);
        engine.orderCheck();
        mess('twist onload', 'orders engine starts', res)
    },

    stop: (clear, res) => {
        clearTimeout(engine.timerCheck[0]);
        clearTimeout(engine.timerCheck[1]);
        if (clear === 'clear') {
            tools.removeOrders();
            tools.removeTxs();
            return mess('engine', 'stops and clears orders and txs', res)
        }
        mess('engine', 'stops and not clears orders and txs', res)
    },

    setCallPeriod: (func, timeout, ind) => {
        func();
        engine.timerCheck[ind] = setTimeout(function check() {
            func();
            engine.timerCheck[ind] = setTimeout(check, timeout * 60000);
        }, timeout * 60000); //  check period in min.
    },

    coinsCheck: () => {
        for (coin in coins) {
            if (coins[coin].active) {
                coins[coin].updated = false;
                coins[coin].enabled = true;
                coins[coin].balance = 0;
                coins[coin].minerFee = 0;
                coins[coin].price = 0;
                //  !!!TODO        coins[coin].reserv = 0;
                // await Coin.getCoinBase(coin),
                Coin.getPrice(coin, twist.priceBase);
                Coin.getBalance(coin);
                Coin.getReserv(coin);
            }
        }
    },

    helthCheck: () => {},

    orderCheck: async() => {
        var key, order;
        var orders = await tools.getNewOrders();
        for (key in orders) {
            order = orders[key];
            if (order.status.code == 0) exec.startDepositWait(order);
            else if (order.status.code == 1 || order.status.code == 2)
                engine.checkDepositStatus(order);
            else if (order.status.code == 3) exec.makeWithdrawTx(order);
            else if (order.status.code == 4)
                engine.checkRefundStatus1(order);
            else if (order.status.code == 5)
                engine.checkRefundStatus1(order);
            else if (order.status.code > 5) tools.arhOrder(order);
        };
    },

    checkDepositStatus: async order => { //  no deposit found before service restart
        var ind = utils.orderToInd(order.exchangeTxId);
        if (ind < 0) {
            var existTx = await tools.findTxByAddr(order.exchangeAddrTo);
            if (existTx == null) return exec.startDepositWait(order);
            return exec.startDepositWait(order);
        }
        if (coins[order.symbolFrom].canReceive) {
            return; //!!!TODO - check time!!! and hook
            resp = await methods.awaitDeposit(order, 'check')
            if (resp && !resp.error) return
                //  need restart awaitDeposit
            resp = await methods.awaitDeposit(order, 'start');
            if (resp.error) {} else {};
        }
        //        tools.saveOrder(order, 'checkDepositStatus'); 
    },

    checkDepositStatus2: async order => {
        var ind = utils.orderToInd(order.exchangeTxId);
        if (ind < 0) return exec.startDepositWait(order);
        return;
        //  !!!TODO check time and hook
        if (coins[order.symbolFrom].canReceive) {
            resp = await methods.awaitDeposit('check', order)
            if (!resp.error) return
                //  need restart awaitDeposit
            resp = await methods.awaitDeposit('start', order);
        };
        tools.saveOrder(order, 'checkDepositStatus');
    }



};