/*!
 * @title orderExec.js - local functions of order.js routes of twist exchange
 * @author Oleg Tomin - <2tominop@gmail.com>
 * @dev Basic implementaion of orders exec functions  
 * MIT Licensed Copyright(c) 2018-2019
 */

module.exports = {

    takeOrder: async function(order) {
        if ((order.status).code != 0) tools.setOrderStatus(order, 0, { reason: 'retake order by restart service', time: new Date })
        if (!coins[order.symbolFrom].canReceive) return myErrorHandler('takeOrder id ' + order.exchangeTxId + ' can not receive coins ' + coins[order.symbolFrom].symbol);
        if (!coins[order.symbolTo].canSend) return myErrorHandler('takeOrder id ' + order.exchangeTxId + ' can not send coins ' + coins[order.symbolTo].symbol);
        mess('takeOrder', 'id ' + order.exchangeTxId + ' exec starts now');
        //  Start awaiting deposit (incoming Tx hook service)
        resp = await methods.awaitDeposit(order, 'start');
        if (resp && !resp.error) {
            tools.setOrderStatus(order, 1, { time: new Date() });
            utils.startDepositWait(order);
        } else coins[order.symbolFrom].canReceive = false;
    },

    checkDepositStatus: async function(order) { //  no deposit found before service restart
        var ind = utils.orderToInd(order.exchangeTxId);
        if (ind < 0) {
            var existTx = await tools.findTxByAddr(order.exchangeAddrTo);
            if (existTx == null) return exec.takeOrder(order);
            return utils.startDepositWait(order);
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

    checkDepositStatus2: async function(order) {
        var ind = utils.orderToInd(order.exchangeTxId);
        if (ind < 0) return utils.startDepositWait(order);
        return;
        //  !!!TODO check time and hook
        if (coins[order.symbolFrom].canReceive) {
            resp = await methods.awaitDeposit('check', order)
            if (!resp.error) return
                //  need restart awaitDeposit
            resp = await methods.awaitDeposit('start', order);
        };
        tools.saveOrder(order, 'checkDepositStatus');
    },

    /// TODO !!!
    makeRefund1: async function(order) {
        var resp;
        if ((order.status).code != 3) tools.setOrderStatus(order, 3, { reason: 'retake order by restart service', time: new Date })
        if (coins[order.symbolFrom].canSend) {
            mess('makeRefund', 'order ' + order.exchangeTxId + ' refund starts');
            //  start awaiting refund (run outgoing Tx hook service)
            resp = await methods.refund('start', order);
            if (!resp || resp.error) return coins[order.symbolTo].canSend = false; //   outgoing tx awating service not wotks, do not refund!!!
            //  in succsess start awaiting refund Tx and send data for outgoing tx (run outgoing Tx send service)
            var refundTimers = utils.waitRefund(order);
            resp = await methods.refund('send', order);
            if (!resp || resp.error) return utils.stopRefundWait(order, refundTimers); //..in error stop awaiting refund Tx and outgoing Tx hook service
            tools.setOrderStatus(order, 4, { hash: resp.hash, time: new Date() });
        } else {
            //   !!!!! TODO set counter errors and abort order
            var counterr;
            counterr++;
        };
        //   !!!!! TODO

    },
    //  TODO!!!!!
    checkRefundStatus1: async function(order) {
        return utils.startRefundWait(order);
        if (coins[order.symbolTo].enabled) {
            resp = await methods.awaitDeposit('check', order)
            if (resp && !reps.error) return
                //  need restart awaitDeposit
            resp = await methods.awaitDeposit('start', order);
            if (!resp || resp.error) {};
            tools.saveOrder(order, 'checkRefundStatus');
        };
    },

    //  TODO!!!!!
    checkRefundStatus2: async function(order) {
        return;
        if (coins[order.symbolFrom].canReceive) {
            resp = await methods.awaitDeposit('check', order)
            if (resp && !resp.error) return
                //  need restart awaitDeposit
            resp = await methods.awaitDeposit('start', order);
            if (!resp || resp.error) {}
        };
        tools.saveOrder(order, 'checkRefundStatus');
    }

}