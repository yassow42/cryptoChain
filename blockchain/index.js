const Block = require("./block");
const cryptoHash = require("../util/crypto-hash");
const { REWARD_INPUT, MINING_REWARD } = require("../config");
const Transaction = require("../wallet/transaction");
const Wallet = require("../wallet");

class Blockchain {

    constructor() {
        this.chain = [Block.genesis()];
    }

    addBlock({ data }) {
        const lastBlock = this.chain[this.chain.length - 1];

        const newBlock = Block.mineBlock({
            lastBlock: lastBlock,
            data: data
        });

        this.chain.push(newBlock);

    }



    replaceChain(chain, validateTransactions,onSuccess) {
        if (chain.length <= this.chain.length) {
            console.error("must be longer chain / gelen zincir daha uzun");

            return;
        }
        if (!Blockchain.isValidChain(chain)) {
            console.error("gelen chain geçerli");
            return;
        }

        if (validateTransactions && !this.validTransactionData({ chain })) {
            console.error('The incomig chain has a invalid data');
            return;
        }

        if (onSuccess) onSuccess();
        console.error("zincir değişti ->   --");
        this.chain = chain;

    }


    validTransactionData({ chain }) {
        for (let i = 1; i < chain.length; i++) {
            const block = chain[i];
            const transactionSet = new Set();

            let rewardTransactionCount = 0;

            for (let transaction of block.data) {
                if (transaction.input.address === REWARD_INPUT.address) {
                    rewardTransactionCount += 1;
                    if (rewardTransactionCount > 1) {
                        console.error("Miner reward exceeds limit");
                        return false;
                    }
                    if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
                        console.error("Miner reward amount is invalid");
                        return false;

                    }
                } else {
                    if (!Transaction.validTransaction(transaction)) {
                        console.error("Invalid transaction");
                        return false;
                    }
                    const trueBalance = Wallet.calculateBalance({
                        //Burada neden this.chain cunku saldırganın gonderdıgı
                        // chaini kabul etmıyoruz eskısıne gore hesap yapıyoruz
                        chain: this.chain,
                        address: transaction.input.address
                    });

                    if (transaction.input.amount !== trueBalance) {
                        console.error('Invalid input amount');
                        return false;
                    }

                    if (transactionSet.has(transaction)) {
                        console.error('Copy transactions');

                        return false;
                    } else {
                        transactionSet.add(transaction);
                    }
                }

            }
        }


        return true;
    }
    static isValidChain(chain) {
        if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) return false;

        for (let i = 1; i < chain.length; i++) {
            const { timestamp, lastHash, hash, data, nonce, difficulty } = chain[i];

            const lastDifficulty = chain[i - 1].difficulty;


            const actualLastHash = chain[i - 1].hash;
            if (lastHash !== actualLastHash) return false;

            const validatedHash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);
            if (hash !== validatedHash) return false;

            if (Math.abs(lastDifficulty - difficulty) > 1) return false;

        }

        return true;
    }



}

module.exports = Blockchain;