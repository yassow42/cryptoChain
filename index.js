const express = require('express');
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const path = require('path');
const PubSub = require('./app/pubsub');
const request = require('request');
const TransactionPool = require('./wallet/transaction-pool');
const Wallet = require('./wallet');
const Transaction = require('./wallet/transaction');
const TransactionMiner = require('./app/transaction-miner');


const isDevelopment = process.env.ENV === 'development';


const app = express();
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();

const pubsub = new PubSub({ blockchain, transactionPool, wallet });
const transactionMiner = new TransactionMiner({ blockchain, transactionPool, wallet, pubsub });

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;



setTimeout(() => {
    pubsub.broadcastChain();
}, 1000);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client/dist')));

app.get('/api/blocks', (req, res) => {
    res.json(blockchain.chain);
});

app.post('/api/mine', (req, res) => {
    const { data } = req.body;

    blockchain.addBlock({ data });
    pubsub.broadcastChain();

    res.redirect('/api/blocks');
});

app.post('/api/transact', (req, res) => {
    const { amount, recipient } = req.body;
    let transaction = transactionPool.existingTransaction({ inputAddress: wallet.publicKey });
    // console.error("transactionsssssssss  -------------------------------------", wallet.publicKey);
    try {
        if (transaction) {
            transaction.update({ senderWallet: wallet, recipient: recipient, amount: amount });
        } else {

            transaction = wallet.createTransaction({
                recipient,
                amount,
                chain: blockchain.chain
            });

        }
    } catch (error) {
        return res.status(400).json({ type: 'error', message: error.message })
    }

    transactionPool.setTransaction(transaction);
    pubsub.broadcastTransaction(transaction);

    console.log('transactionpool', transactionPool);
    res.json({ type: 'success', transaction });
});



app.get('/api/wallet-info', (req, res) => {
    //const { address } = req.body;


    const balance = Wallet.calculateBalance({ chain: blockchain.chain, address: wallet.publicKey });

    res.json({
        address: wallet.publicKey,
        balance: balance
    });
});



app.get('/api/transaction-pool-map', (req, res) => {
    res.json(transactionPool.transactionMap);

});

app.get('/api/mine-transactions', (req, res) => {
    transactionMiner.mineTransactions();
    res.redirect('/api/blocks');
});


app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/src/index.html')

    );


});
const syncWithRootState = () => {
    request({ url: `${ROOT_NODE_ADDRESS}/api/blocks` }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const rootChain = JSON.parse(body);
            console.log('replace chain sync', rootChain);
            blockchain.replaceChain(rootChain);
        } else {
            console.error('chain sync error');

        }
    });

    request({ url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` }, (error, response, body) => {
        if (!error && response.statusCode === 200) {

            const rootTransactionPoolMap = JSON.parse(body);

            console.log('replace transactionPoolMap sync', rootTransactionPoolMap);
            transactionPool.setMap(rootTransactionPoolMap);

        } else {
            console.error('transaction-pool-map sync error');

        }

    });
};

if (isDevelopment) {



    const walletFoo = new Wallet();
    const walletBar = new Wallet();
    /*
    const generateWalletTransaction = ({ wallet, recipient, amount }) => {
        console.log(wallet.publicKey);
        const transaction = wallet.createTransaction({
            recipient: recipient,
            amount: amount,
            chain: blockchain.chain
        });
    
        transactionPool.setTransaction(transaction);
    }*/
    const generateWalletTransaction = ({ wallet, recipient, amount }) => {
        //  console.log("publickey",wallet.publicKey);
        const transaction = wallet.createTransaction({
            recipient: recipient,
            amount: amount,
            chain: blockchain.chain  // Doğru chain parametresini alması için ekledik
        });

        transactionPool.setTransaction(transaction);
    }

    const walletAction = () => generateWalletTransaction({
        wallet,
        recipient: walletFoo.publicKey,
        amount: 6
    });

    const walletFooAction = () => generateWalletTransaction({
        wallet: walletFoo,
        recipient: walletBar.publicKey,
        amount: 15
    });
    const walletBarAction = () => generateWalletTransaction({
        wallet: walletBar,
        recipient: wallet.publicKey,
        amount: 9
    });

    for (let i = 0; i <= 10; i++) {
        if (i % 3 === 0) {
            walletAction();
            walletFooAction();

        } else if (i % 3 === 1) {
            walletAction();
            walletBarAction();

        } else {
            walletBarAction();
            walletFooAction();
        }
        transactionMiner.mineTransactions();
    }

}
let PEER_PORT;
if (process.env.GENERATE_PEER_PORT === 'true') {
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}

const PORT = process.env.PORT || PEER_PORT || DEFAULT_PORT;
app.listen(PORT, () => {

    console.log(`listening at localhost:${PORT}`);
    if (PORT !== DEFAULT_PORT) {

        syncWithRootState();

    }
});