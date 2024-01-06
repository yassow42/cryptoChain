const TransactionPool = require('./transaction-pool.js');
const Transaction = require('./transaction');
const Wallet = require('./index');
const Blockchain = require('../blockchain');
const { MINING_REWARD } = require('../config.js');



describe('TransactionPool', () => {
    let transactionPool, transaction, senderWallet;

    beforeEach(() => {
        transactionPool = new TransactionPool();
        senderWallet = new Wallet();

        transaction = new Transaction({
            senderWallet: senderWallet,
            recipient: "fake-recipient",
            amount: 50
        });

    });

    describe('setTransaction()', () => {

        it('adds a transaction', () => {
            transactionPool.setTransaction(transaction);

            expect(transactionPool.transactionMap[transaction.id])
                .toBe(transaction);


        })
    });

    describe('existingTransaction()', () => {
        it('return an existing transaction giben an input address', () => {
            transactionPool.setTransaction(transaction);
            expect(transactionPool.existingTransaction({ inputAddress: senderWallet.publicKey }))
                .toBe(transaction);
        })
    });

    describe('validTransactions()', () => {
        let validTransactions, errorMock;

        beforeEach(() => {
            validTransactions = [];
            errorMock = jest.fn();
            global.console.error = errorMock;

            for (let i = 0; i < 10; i++) {
                transaction = new Transaction({
                    senderWallet,
                    recipient: 'ant-recipient',
                    amount: 30
                });
                if (i % 3 === 0) {
                    transaction.input.amount = 9999;
                } else if (i % 3 === 1) {
                    transaction.input.signature = new Wallet().sign('foo');
                } else {
                    validTransactions.push(transaction);
                }
                transactionPool.setTransaction(transaction);

            }
        });

        it('returns valid transaction', () => {
            expect(transactionPool.validTransactions()).toEqual(validTransactions);
        });
        it('logs error for the invalid transactions', () => {
            transactionPool.validTransactions();
            expect(errorMock).toHaveBeenCalled();
        })
    });


    describe('clear()', () => {
        it('clears the transactions', () => {
            transactionPool.clear();
            expect(transactionPool.transactionMap).toEqual({});

        });
    });
    describe('clearBlockhainTransactions()', () => {
        it('clears the pool of any existing blockchain transactions', () => {

            const blockchain = new Blockchain();
            const expectedTransactionMap = {};

            for (let i = 0; i < 6; i++) {
                const transaction = new Wallet().createTransaction({
                    recipient: 'foo',
                    amount: 20
                });
                transactionPool.setTransaction(transaction);

                if (i % 2 === 0) {
                    blockchain.addBlock({ data: [transaction] })
                } else {
                    expectedTransactionMap[transaction.id] = transaction;
                }

                transactionPool.clearBlockhainTransactions({ chain: blockchain.chain });
                expect(transactionPool.transactionMap).toEqual(expectedTransactionMap)

            }
        });
    });
});