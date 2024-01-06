const INITIAL_DIFFICULTY = 5;
const MINE_RATE = 500;

const GENESIS_DATA = {
    timestamp: 1,
    lastHash: "lastHash genesis",
    hash: "hash-genesis",
    difficulty: INITIAL_DIFFICULTY,
    nonce: 0,
    data: []
};


const STARTING_BALANCE = 1000;
const REWARD_INPUT = {
    address: '*authorized-reward*'
};
const MINING_REWARD = 50;

module.exports = { GENESIS_DATA, MINE_RATE, STARTING_BALANCE, REWARD_INPUT, MINING_REWARD };