//  file orderExec.js
//  local variables and function for order.js routes of twist exchange

module.exports = {

    takeOrder: async function(order) {
        if ((order.status).code != 0) tools.setOrderStatus(order, 0, { reason: 'retake order by restart service', time: new Date })
        if (coins[order.symbolFrom].canReceive) {
            mess('take', 'order ' + order.exchangeTxId + ' exec starts');
            //  Start awaiting deposit (incoming Tx hook service)
            resp = await methods.awaitDeposit('start', order);
            if (resp && !resp.error) {
                tools.setOrderStatus(order, 1, { time: new Date() });
                utils.waitDeposit(order);
            } else coins[order.symbolFrom].canReceive = false;
        };
    },

    checkDepositStatus1: async function(order) { //  no deposit found before service restart
        var ind = utils.orderToInd(order.exchangeTxId);
        var existTx = await tools.findTxByAddr(order.userAddrFrom);
        mess('checkDepositStatus1', 'ind ' + ind.toString() + ' tx ' + existTx)
        if (ind < 0) {
            if (existTx == null) return exec.takeOrder(order);
            return utils.waitDeposit(order);
        }
        if (coins[order.symbolFrom].canReceive) {
            return; //!!!TODO - check time!!! and hook
            resp = await methods.awaitDeposit('check', order)
            if (resp && !resp.error) return
                //  need restart awaitDeposit
            resp = await methods.awaitDeposit('start', order);
            if (resp.error) {} else {};
        }
        //        tools.saveOrder(order, 'checkDepositStatus'); 
    },

    checkDepositStatus2: async function(order) {
        var ind = utils.orderToInd(order.exchangeTxId);
        if (ind < 0) return utils.waitDeposit(order);
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
            if (!resp || resp.error) return utils.waitRefundStop(order, refundTimers); //..in error stop awaiting refund Tx and outgoing Tx hook service
            tools.setOrderStatus(order, 4, { hash: resp.hash, time: new Date() });
            coins[order.symbolTo].reserv = coins[order.symbolTo].reserv - order.valueTo;
        } else {
            //   !!!!! TODO set counter errors and abort order
            var counterr;
            counterr++;
        };
        //   !!!!! TODO

    },
    //  TODO!!!!!
    checkRefundStatus1: async function(order) {
        return;
        if (coins[order.symbolFrom].canReceive) {
            resp = await methods.awaitDeposit('check', order)
            if (resp && !reps.error) return
                //  need restart awaitDeposit
            resp = await methods.awaitDeposit('start', order);
            if (!resp || resp.error) {};
            tools.saveOrder(order, 'checkRefundStatus');
        };
    },

    //  TODO!!!!!
    checkRefundStatus1: async function(order) {
        return;
        if (coins[order.symbolFrom].canReceive) {
            resp = await methods.awaitDeposit('check', order)
            if (resp && !resp.error) return
                //  need restart awaitDeposit
            resp = await methods.awaitDeposit('start', order);
            if (!resp || resp.error) {}
        };
        tools.saveOrder(order, 'checkRefundStatus');
    },

    waitTransfer: function(order, action) {
        mess('waitTransfer', 'order ' +
            order.exchangeTxId +
            ' : awaiting ' + action + ' starts');
        var myInterval;
        //  awaiting transfer timer
        var ttlTimeOut = setTimeout(function() {
            clearInterval(myInterval);
            utils.awaitDepositStop(order);
            myErrorHandler(
                'waitTransfer: order ' +
                order.exchangeTxId + ' ' + action +
                ' tx not receaved in ttl period'
            );
            if (action == 'deposit') data = { code: 1, reason: 'deposit not received in ' + twist.ttl + 'min. period', time: new Date() }
            tools.setOrderStatus(order, 7, )
        }, order.ttl * 60000);
        //  checking incoming tx timer
        myInterval = setInterval(function() {
            if (coins[order.symbolFrom].canReceive)
                utils.findTxTo(order, myInterval, ttlTimeOut)
            else {
                tools.setOrderStatus(order, order.status.code + 10, { reason: 'awaitDeposit service not aviable', time: timeNow() })
            }
        }, 20000);
    }


}