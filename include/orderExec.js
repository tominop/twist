//  file orderExec.js
//  local variables and function for order.js routes of twist exchange

module.exports = {

    takeOrder: async function(order) {
        if ((order.status).code != 0) tools.setOrderStatus(order, 0, { reason: 'retake order by restart service', time: new Date })
        if (coins[order.symbolFrom].canReceive) {
            mess('take', 'order ' + order.exchangeTxId + ' exec starts');
            //  Start awaiting deposit (incoming Tx hook service)
            res = await methods.runMethod('awaitDeposit', 'start', order);
            if (!res.error) {
                tools.setOrderStatus(order, 1, { time: new Date() });
                utils.waitDeposit(order);
                //                exec.waitDeposit(order);    //  immediate await incoming Tx
            };
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
            res = await methods.runMethod('awaitDeposit', 'check', order)
            if (!res.error) return
                //  need restart awaitDeposit
            res = await methods.runMethod('awaitDeposit', 'start', order);
            if (res.error) {} else {};
        }
        //        tools.saveOrder(order, 'checkDepositStatus'); 
    },

    checkDepositStatus2: async function(order) {
        var ind = utils.orderToInd(order.exchangeTxId);
        if (ind < 0) return utils.waitDeposit(order);
        return;
        //  !!!TODO check time and hook
        if (coins[order.symbolFrom].canReceive) {
            res = await methods.runMethod('awaitDeposit', 'check', order)
            if (!res.error) return
                //  need restart awaitDeposit
            res = await methods.runMethod('awaitDeposit', 'start', order);
            if (res.error) order.waitDepositProvider = ''
            else order.waitDepositProvider = res.provider;
        };
        tools.saveOrder(order, 'checkDepositStatus');
    },

    /// TODO !!!
    makeRefund1: async function(order) {
        if ((order.status).code != 3) tools.setOrderStatus(order, 3, { reason: 'retake order by restart service', time: new Date })
        if (coins[order.symbolFrom].canSend) {
            mess('makeRefund', 'order ' + order.exchangeTxId + ' refund starts');
            //  Start awaiting deposit (incoming Tx hook service)
            res = await methods.runMethod('makeRefund', 'start', order);
            if (!res.error) {
                tools.setOrderStatus(order, 4, { hash: res.hash, time: new Date() });
                utils.waitRefund(order);
                //                exec.waitDeposit(order);    //  immediate await incoming Tx
            };
        };
    },
    //  TODO!!!!!
    checkRefundStatus1: async function(order) {
        return;
        if (coins[order.symbolFrom].canReceive) {
            res = await methods.runMethod('awaitDeposit', 'check', order)
            if (!res.error) return
                //  need restart awaitDeposit
            res = await methods.runMethod('awaitDeposit', 'start', order);
            if (res.error) order.waitDepositProvider = ''
            else order.waitDepositProvider = res.provider;
        } else order.waitDepositProvider = '';
        tools.saveOrder(order, 'checkRefundStatus');
    },

    //  TODO!!!!!
    checkRefundStatus1: async function(order) {
        return;
        if (coins[order.symbolFrom].canReceive) {
            res = await methods.runMethod('awaitDeposit', 'check', order)
            if (!res.error) return
                //  need restart awaitDeposit
            res = await methods.runMethod('awaitDeposit', 'start', order);
            if (res.error) order.waitDepositProvider = ''
            else order.waitDepositProvider = res.provider;
        } else order.waitDepositProvider = '';
        tools.saveOrder(order, 'checkRefundStatus');
    }

}