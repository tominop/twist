//  file orderExec.js
//  local variables and function for order.js routes of twist exchange

module.exports = {

    takeOrder: async function (order) {
        if ((order.status).code != 0) tools.setOrderStatus(order, 0, { reason: 'retake order by restart service', time: new Date })
        if (coins[order.symbolFrom].canReceive) {
            mess('take', 'order ' + order.exchangeTxId + ' exec starts');
            //  Start awaiting deposit (incoming Tx hook service)
            res = await methods.runMethod('awaitDeposit', 'start', order);
            if (!res.error) {
                tools.setOrderStatus(order, 1, { time: new Date() });
                //                exec.waitDeposit(order);    //  immediate await incoming Tx
            };
        };
    },

    checkDepositStatus1: async function (order) {    //  no deposit found before service restart
        var ind = utils.orderToInd(order.exchangeTxId);
        var existTx = tools.findTxById(order.exchangeTxId);
        if (!ind) {
            if (!existTx) return exec.takeOrder(order);
            return utils.waitDeposit(order)
        }
        if (coins[order.symbolFrom].canReceive) {
            return;     //!!!TODO - check time!!! and hook
            res = await methods.runMethod('awaitDeposit', 'check', order)
            if (!res.error) return 
            //  need restart awaitDeposit
            res = await methods.runMethod('awaitDeposit', 'start', order);
            if (res.error) {} 
            else {};
        }
        //        tools.saveOrder(order, 'checkDepositStatus');
    },

    checkDepositStatus2: async function (order) {
        var ind = utils.orderToInd(order.exchangeTxId);
        if (!ind) return utils.waitDeposit(order);
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
    makeRefund: function (order) {
             var change,
                valueFact = valueToFix(order.received / order.exchangeRatio);
            change = valueToFix(
                order.received - twist.maxLimit / coins[order.symbolFrom].price
            );
            if (change > coins[order.symbolFrom].minerFee * 2) {
                //  change must be more 2 x minerFee
                valueFact = valueToFix(twist.maxLimit / coins[order.symbolTo].price);
                //        var changeOrder = new Order();
                //        makeChange(changeOrder, change - minerFee);
                console.log(
                    ' twist must send change ' + change + order.symbolFrom + ' to user'
                );
            }
            console.log(
                timeNow() +
                ' order ' +
                order.exchangeTxId +
                ' exec continue: send ' +
                valueFact +
                order.symbolTo +
                ' to user'
            );
            var jsonData = JSON.stringify({
                from: coins[order.symbolFrom].walletFrom, // account name in api microservice
                to: order.userAddrTo,
                value: valueFact
            });
            axios
                .get(coins[order.symbolTo].api + 'makeTxAddrs/' + jsonData) //
                .then(function (outTx) {
                    order.status = {
                        code: 4,
                        human: twist.humans[4],
                        data: { hash: outTx.data.hash }
                    };
                    order.hashTxTo = outTx.data.hash;
                    order.save(function (err) {
                        if (err)
                            return myErrorHandler(
                                'makeTxTo: exec order ' +
                                order.exchangeTxId +
                                ' save, ' +
                                err
                            );
                    });
                    console.log(
                        timeNow() +
                        ' exec order ' +
                        order.exchangeTxId +
                        ': to user Tx hash ' +
                        order.hashTxTo
                    ); //  !!!TODO correct awat Tx to user
                    axios
                        .get(coins[order.symbolTo].api + 'waitTx/' + outTx.data.hash)
                        .then(function (h) {
                            console.log(
                                timeNow() +
                                ' exec order ' +
                                order.exchangeTxId +
                                ': ' +
                                coins[order.symbolTo].symbol +
                                ' Tx confirmed in block ' +
                                h.data.block
                            );
                            order.status = {
                                code: 6,
                                human: twist.humans[6],
                                data: { time: timeNow() }
                            };
                            order.confirmTxTo = true;
                            order.sent = valueFact;
                            tools.arhOrder(order);
                            console.log(
                                timeNow() + ' exec order ' + order.exchangeTxId + ' finished!'
                            );
                        })
                        .catch((err) => {
                            myErrorHandler(
                                'makeTxTo: exec order ' +
                                order.exchangeTxId +
                                ' Tx to ' +
                                order.exchangeAddrTo +
                                ' not confirmed, ' +
                                err
                            );
                        });
                })
                .catch((err) => {
                    myErrorHandler(
                        'exec order ' +
                        order.exchangeTxId +
                        ': Tx to ' +
                        order.exchangeAddrTo +
                        ' not created, ' +
                        err
                    );
                });
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