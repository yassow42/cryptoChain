const Blockchain = require('.');
const Block = require('./block');
const Wallet = require('../wallet');
const { cryptoHash } = require('../util');
const Transaction = require('../wallet/transaction');



describe('Blockchain', () => {

    let blockchain, newChain, originalChain = new Blockchain(), errorMock;

    beforeEach(() => {
        blockchain = new Blockchain();
        newChain = new Blockchain();
        originalChain = blockchain.chain;
        errorMock = jest.fn();
        global.console.error = errorMock;

    })

    it('contains a chain Array instance', () => {
        expect(blockchain.chain instanceof Array).toBe(true);
    });

    it("genesis ile basla", () => { expect(blockchain.chain[0]).toEqual(Block.genesis()); });
    it("ad new block", () => {
        const newData = "foo bar";
        blockchain.addBlock({ data: newData });
        // Not: Lütfen aşağıdaki hatayı düzeltmek için .length kullanmalısınız, .lenght değil
        expect(blockchain.chain[blockchain.chain.length - 1].data).toEqual(newData);

        //   expect(blockchain.chain[blockchain.chain.lenght - 1].data).toEqual(newData);
    });
    describe('isValidChain', () => {
        describe('zincir, genesi bloğuyla başlamadığında', () => {
            it("return false", () => {
                blockchain.chain[0] = { data: 'fake-genesis' };
                expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
            });
        });

        describe('zincir, genesi bloğu ve diğer bloklar ile basladı', () => {
            beforeEach(() => {
                blockchain.addBlock({ data: "Arı" });
                blockchain.addBlock({ data: "Karınca" });
                blockchain.addBlock({ data: "Dicker" });
            });
            describe("lastHash değişti", () => {
                it("return false", () => {


                    blockchain.chain[2].lastHash = "broken last hash";
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                });
            });


            describe('and the chain contains a bloock with a jumped difficulty', () => {

                it('return false', () => {
                    const lastBlock = blockchain.chain[blockchain.chain.length - 1];
                    const lastHash = lastBlock.hash;
                    const timestamp = Date.now();
                    const nonce = 0;
                    const data = [];
                    const difficulty = lastBlock.difficulty - 3;

                    const hash = cryptoHash(timestamp, lastHash, difficulty, nonce, data);

                    const badBlock = new Block({
                        timestamp, lastHash, hash, nonce, difficulty, data
                    });

                    blockchain.chain.push(badBlock);
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);

                });
            });

            describe('ve zincir geçersiz alana sahip bir blok içeriyor', () => {
                it('returns false', () => {


                    blockchain.chain[2].data = "bad data";
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);

                });
            });
            describe("ve zincir geçersiz blok içermiyor", () => {
                it('returns true', () => {


                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(true);

                })
            });

        });
    });



    describe("replaceChain()", () => {
        let logMock;
        beforeEach(() => {
            logMock = jest.fn();

            global.console.log = logMock;
        });

        describe("yeni zincir daha kısa olduğunda", () => {
            beforeEach(() => {
                newChain.chain[0] = { new: 'chain' };
                blockchain.replaceChain(newChain.chain);
            });
            it('zinciri değiştirmeme', () => {

                expect(blockchain.chain).toEqual(originalChain);
            });
            it('logs an error', () => {
                expect(errorMock).toHaveBeenCalled();
            });
        });

        describe("yeni zincir daha kısa olduğunda", () => {
            beforeEach(() => {
                newChain.addBlock({ data: "Arı" });
                newChain.addBlock({ data: "Karınca" });
                newChain.addBlock({ data: "Dicker" });
            });
            it('zinciri değiştirmeme', () => {
                newChain.chain[2].hash = "some fake hash";
                blockchain.replaceChain(newChain.chain);
                expect(blockchain.chain).toEqual(originalChain);

            });



        });


        describe('and the chain is valid', () => {
            beforeEach(() => {
                blockchain.replaceChain(newChain.chain);

            });

            it('replaces the chain', () => {
                expect(blockchain.chain).toEqual(newChain.chain);

            });

            it("logs about the chain replacement", () => {

            });
        });

        describe('and the validateTransaction flas is true', () => {
            it('calls validTranactionData()', () => {
                const validTransactionDataMock = jest.fn();
                blockchain.validTransactionData = validTransactionDataMock;
                
                newChain.addBlock({ data: 'foo' });
                blockchain.replaceChain(newChain.chain, true);

                expect(validTransactionDataMock).toHaveBeenCalled();
        });
    });

});


describe("validTransactionData()", () => {
    let transaction, rewardTransaction, wallet;

    beforeEach(() => {
        wallet = new Wallet();
        transaction = wallet.createTransaction({ recipient: "foo", amount: 65 });
        rewardTransaction = Transaction.rewardTransaction({ minerWallet: wallet });

    });

    describe('and the transaction data is valid', () => {
        it('returns true', () => {
            newChain.addBlock({ data: [transaction, rewardTransaction] });
            expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(true);
            expect(errorMock).not.toHaveBeenCalled();
        });
    });

    describe('and the transaction data  has multiple rewards', () => {
        it('returns false and logs an error', () => {
            newChain.addBlock({ data: [transaction, rewardTransaction, rewardTransaction] });
            expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
            expect(errorMock).toHaveBeenCalled();

        });

    });

    describe('and the transaction data has at least one malformed outputMap', () => {
        describe('and the transaction is not a reward transaction', () => {
            it('returns false and logs an error', () => {
                transaction.outputMap[wallet.publicKey] = 999999;
                newChain.addBlock({ data: [transaction, rewardTransaction] });
                expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
                expect(errorMock).toHaveBeenCalled();

            });

        });
        describe('and the transaction is a reward transaction', () => {
            it('returns false and logs an error', () => {


                rewardTransaction.outputMap[wallet.publicKey] = 999989;
                newChain.addBlock({ data: [transaction, rewardTransaction] });
                expect(errorMock).not.toHaveBeenCalled();


            });

        });
        describe('and the transaction data has at least one malformed input', () => {
            it('returns false and logs an error', () => {
                wallet.balance = 9000;
                const evilOutput = {
                    [wallet.publicKey]: 8900,
                    fooRecipient: 100
                };


                const evilTransaction = {
                    outputMap: evilOutput,
                    input: {
                        timestamp: Date.now(),
                        amount: wallet.balance,
                        address: wallet.publicKey,
                        signature: wallet.sign(evilOutput)
                    }
                };

                newChain.addBlock({ data: [evilTransaction] });
                expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
                expect(errorMock).toHaveBeenCalled();

            });

        });
        describe('and a block contains multiple identical transactions', () => {
            it('returns false and logs an error', () => {
                newChain.addBlock({
                    data: [transaction, transaction, transaction, rewardTransaction]
                });

                expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false);
                expect(errorMock).toHaveBeenCalled();
            });

        });
    });
});





});