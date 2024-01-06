const PubNub = require('pubnub');


const credentials = {
    publishKey: "pub-c-fa6d85d9-169e-4e56-be7b-dc17345c9876",
    subscribeKey: "sub-c-d5a1dec8-1d64-4f0b-87c6-d90f893700f4",
    secretKey: "sec-c-ZDIzMzhmMzEtNGI1Yi00YzQ3LWJlOTctZTJmZjU0MDc5ZjAy"
};

const CHANNELS = {
    TEST: 'TEST',
    BLOCKCHAIN: 'BLOCKCHAIN',
    TRANSACTION: 'TRANSACTION'
}

class PubSub {
    constructor({ blockchain, transactionPool, wallet }) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.pubnub = new PubNub(credentials);
        this.wallet = wallet;
        // Bununla channele kayıt olabiliriz ama genel kayıt yapmak lazım channels sayısı artabılır.
        this.pubnub.subscribe({ channels: Object.values(CHANNELS) });

        //channelsın hepsıne kayıt olma
        //this.subsribeToChannels();
        this.pubnub.addListener(this.listener());
    }
    

    listener() {
        return {
            message: messageObject => {
                const { channel, message } = messageObject;
               // console.log(`message received. Channel ${channel}. Message: ${message}`);

                const parsedMessage = JSON.parse(message);
                switch (channel) {
                    case CHANNELS.BLOCKCHAIN:
                        this.blockchain.replaceChain(parsedMessage,true, () => {
                            this.transactionPool.clearBlockhainTransactions({ chain: parsedMessage });
                        });

                        break;

                    case CHANNELS.TRANSACTION:
                        if (!this.transactionPool.existingTransaction({
                            inputAddress: this.wallet.publicKey
                        })) {
                            this.transactionPool.setTransaction(parsedMessage);
                        }
                        break;

                    default:
                        return;
                }

            }
        }
    }

    publish({ channel, message }) {

        this.pubnub.unsubscribe({ channel })
        setTimeout(() => this.pubnub.publish({ channel, message }), 3000)
        setTimeout(() => this.pubnub.subscribe({ channels: [Object.values(CHANNELS)] }), 6000)

    }


    /* subsribeToChannels() {
         Object.values(CHANNELS).forEach(channel => {
             this.subscriber.subscribe(channel);
         })
     }*/

    broadcastChain() {
        this.publish({
            channel: CHANNELS.BLOCKCHAIN,
            message: JSON.stringify(this.blockchain.chain)
        });
    }
    broadcastTransaction(transaction) {
        this.publish({
            channel: CHANNELS.TRANSACTION,
            message: JSON.stringify(transaction)
        });
    }
}
/*
const testPubSub = new PubSub();

testPubSub.publish({channel:CHANNELS.TEST,message:'hello pubnub'})
*/

module.exports = PubSub;