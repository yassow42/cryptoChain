const { STARTING_BALANCE } = require("../config");
const { ec, cryptoHash } = require("../util");
const Transaction = require("./transaction");



class Wallet {
    constructor() {
        this.balance = STARTING_BALANCE;
        this.keyPair = ec.genKeyPair();

        this.publicKey = this.keyPair.getPublic().encode('hex');
        // this.publicKey = keyPair.getPublic().inspect();
        // const publicKeyPoint = keyPair.getPublic();

        //   this.publicKeyX = publicKeyPoint.getX().toString(16);
        //  this.publicKeyY = publicKeyPoint.getY().toString(16);

        // console.log(this.publicKeyX, this.publicKeyY);
        //console.log(publicKeyPoint.inspect());

    }

    sign(data) {
        //   console.log(data);
        const signed = this.keyPair.sign(cryptoHash(data));
        // console.log(signed);
        return signed;
    }

    createTransaction({ recipient, amount, chain }) {
        if (chain) {
            this.balance = Wallet.calculateBalance({
                chain: chain,

                address: this.publicKey
            });

        }

        if (amount > this.balance) {
            throw new Error('amount exceeds balance yani balance aşıyorr');
        }

        return new Transaction({ senderWallet: this, recipient, amount });
    }

    static calculateBalance({ chain, address }) {
        let hasConductedTransaction = false;
        let outputsTotal = 0;
        for (let i = chain.length - 1; i > 0; i--) {
            const block = chain[i];

            for (let transaction of block.data) {

                if (transaction.input.address === address) {
                    hasConductedTransaction = true;
                }
                const addressOutput = transaction.outputMap[address];
                if (addressOutput) {
                    outputsTotal = outputsTotal + addressOutput;
                }
            }
            if (hasConductedTransaction) {
                break;
            }
        }
        return hasConductedTransaction ? outputsTotal : outputsTotal + STARTING_BALANCE;
    }
}

module.exports = Wallet;