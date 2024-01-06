const Transaction = require('./transaction');
const Wallet = require('./index');
const { verifySignature } = require('../util');
const { REWARD_INPUT,MINING_REWARD } = require('../config');

describe('Transaction', () => {
    let transaction, senderWallet, recipient, amount;

    beforeEach(() => {
        senderWallet = new Wallet();
        recipient = 'recipient-public-key'
        amount = 50;
        transaction = new Transaction({ senderWallet, recipient, amount });

    });

    it('has a id ', () => {
        expect(transaction).toHaveProperty('id');
    });

    describe("outputMap", () => {
        it('has an outputMap', () => {
            expect(transaction).toHaveProperty('outputMap');

        });
        it('outputs the amount to the recipient', () => {
            expect(transaction.outputMap[recipient]).toEqual(amount);
        });
        it('outputs the remaining balance for the senderWallet', () => {
            expect(transaction.outputMap[senderWallet.publicKey])
                .toEqual(senderWallet.balance - amount);
        });
    });

    describe('input', () => {
        it('has an input', () => {
            expect(transaction).toHaveProperty('input');
        });

        it('has a timestamp in the input', () => {
            expect(transaction.input).toHaveProperty('timestamp');

        });

        it('sets the amount to the snederWAllet balance', () => {
            expect(transaction.input.amount).toEqual(senderWallet.balance);

        });

        it('sets the address tot he senderWallet publicKey', () => {
            expect(transaction.input.address).toEqual(senderWallet.publicKey);

        });

        it('signs the input', () => {
            expect(
                verifySignature({
                    publicKey: senderWallet.publicKey,
                    data: transaction.outputMap,
                    signature: transaction.input.signature
                })
            ).toBe(true);
        });
    });

    describe('validTransaction()', () => {
        let errorMock;
        beforeAll(() => {
            errorMock = jest.fn();
            global.console.error = errorMock;
        })
        describe('when the transaction is valid', () => {
            it('returns true', () => {
                expect(Transaction.validTransaction(transaction)).toBe(true);
            });
        });
        describe('when the transaction is invalid', () => {
            describe('and a transaction on outputMap value is invalid', () => {
                it('returns false and logs error', () => {
                    transaction.outputMap[senderWallet.publicKey] = 999999;

                    expect(Transaction.validTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
            describe('and a transaction input signature is invalid', () => {
                it('returns false and logs error', () => {
                    transaction.input.signature = new Wallet().sign("data");
                    expect(Transaction.validTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();

                });
            });
        });
    });

    describe('update()', () => {
        let originalSignature, originalSenderOutput, nextRecipient, nextAmount;

        describe('and the amount is invalid', () => {
            it('thrown an error', () => {
                expect(() => {
                    transaction.update({ senderWallet, recipient: "foo", amount: 999999 });
                }).toThrow('amount exceeds balance')

            })
        });
        describe('and the amount is valid', () => {



            beforeEach(() => {
                originalSignature = transaction.input.signature;
                originalSenderOutput = transaction.outputMap[senderWallet.publicKey];
                nextRecipient = 'next-recipient';
                nextAmount = 50;

                transaction.update({ senderWallet, recipient: nextRecipient, amount: nextAmount });
            })

            it('outputs the amount to the next recipient', () => {
                // Bu test, bir miktarın bir sonraki alıcıya çıkış yapılıp yapılmadığını kontrol eder.
                expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount);

            });

            it('subtracts the amount from original sender output amount', () => {
                // Bu test, original gönderenin çıkış miktarından miktarın çıkarılıp çıkarılmadığını kontrol eder.
                expect(transaction.outputMap[senderWallet.publicKey]).toEqual(originalSenderOutput - nextAmount);

            });

            it('maintains a total output that matches the input amount', () => {
                // Bu test, toplam çıkış miktarının giriş miktarıyla eşleşip eşleşmediğini kontrol eder.

                expect(Object.values(transaction.outputMap)
                    .reduce((total, outputAmount) => total + outputAmount)).toEqual(transaction.input.amount);

            });

            it('re-signs the transaction', () => {
                // Bu test, işlemin yeniden imzalanıp imzalanmadığını kontrol eder.
                expect(transaction.input.signature).not.toEqual(originalSignature);
            });

            describe('and another update for the same recipient', () => {
                let addedAmount;
                beforeEach(() => {
                    addedAmount = 80;
                    transaction.update({ senderWallet, recipient: nextRecipient, amount: addedAmount });

                });

                it('adds to the recipient amount', () => {
                    //    console.error(transaction.outputMap);

                    expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount + addedAmount);
                });


                it('substract the amount from the original sender output amount', () => {
                    expect(transaction.outputMap[senderWallet.publicKey])
                        .toEqual(originalSenderOutput - nextAmount - addedAmount);
                });
            });
        });
    });


    describe('rewardTransaction()', () => {
        let rewardTransaction, minerWallet;
    
        beforeEach(() => {
            // Her test öncesinde bir madenci cüzdanı ve ödül işlemi oluşturuluyor
            minerWallet = new Wallet();
            rewardTransaction = Transaction.rewardTransaction({ minerWallet });
        });
    
        it('creates a transaction with the reward input', () => {
            // Ödül işlemi, belirlenen sabit bir REWARD_INPUT'a sahip olmalıdır.
            expect(rewardTransaction.input).toEqual(REWARD_INPUT);
        });
    
        it('creates one transaction for the miner with the MINING_REWARD', () => {
            // Ödül işlemi, belirtilen madenci cüzdanına bir ödül içermelidir.
            expect(rewardTransaction.outputMap[minerWallet.publicKey]).toEqual(MINING_REWARD);
        });
    });
    

});