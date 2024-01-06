const hexToBinary = require("hex-to-binary");
const Block = require("./block");
const {cryptoHash} = require("../util");
const { GENESIS_DATA, MINE_RATE } = require("../config");

describe('Block', () => {

    const timestamp = 2000;
    const lastHash = "lasthash";
    const hash = "hash";
    const data = ["blockchain", "data"];
    const nonce = 1;
    const difficulty = 1;


    const block = new Block({
        timestamp: timestamp,
        lastHash: lastHash,
        hash: hash,
        data: data,
        nonce,
        difficulty
    });

    it('has a time', () => {
        expect(block.timestamp).toEqual(timestamp);
        expect(block.hash).toEqual(hash);
        expect(block.nonce).toEqual(nonce);
        expect(block.difficulty).toEqual(difficulty);
    });


    describe('genesis()', () => {
        const genesisBlock = Block.genesis();
        it('return block instance', () => {
            expect(genesisBlock instanceof Block).toEqual(true);
        });
        it('return genesi data', () => {
            expect(genesisBlock).toEqual(GENESIS_DATA);
        });
    });

    describe('mineBlock()', () => {
        const lastBlock = Block.genesis();
        const data = "mined data";
        const minedBlock = Block.mineBlock({ lastBlock, data });

        it('returns a Block instance', () => {
            expect(minedBlock instanceof Block).toBe(true);
        });
        it('sets the lastHAsh to be the hash of the lastBlock', () => {
            expect(minedBlock.lastHash).toEqual(lastBlock.hash);
        });

        it('sets teh data', () => {
            expect(minedBlock.data).toEqual(data);
        });

        it('sets a timestamp', () => {
            expect(minedBlock.timestamp).not.toEqual(undefined);
        });

        it("create a SHA 256 'hash'", () => {
            expect(minedBlock.hash)
                .toEqual(
                    cryptoHash(
                        minedBlock.timestamp,
                        minedBlock.nonce,
                        minedBlock.difficulty,
                        lastBlock.hash,
                        data)
                )
        });


        it("sets a hash that matches the difficulty criteria", () => {
            expect(hexToBinary(minedBlock.hash).substring(0, minedBlock.difficulty))
                .toEqual('0'.repeat(minedBlock.difficulty));

        });

        describe("adjust the difficulty", () => {

            const possibleResults = [lastBlock.difficulty + 1, lastBlock.difficulty - 1];

            expect(possibleResults.includes(minedBlock.difficulty)).toBe(true);
        });

    });


    describe('adjustDifficulty()', () => {
        it("raises the difficulty for a quickly mined block - hızlı bir şekilde kazılmış bir bloğun zorluğunu artırır", () => {
            expect(Block.adjustDifficulty({
                originalBlock: block,
                timestamp: block.timestamp + MINE_RATE - 100
            }))
                .toEqual(block.difficulty + 1);

        });
        it("lowers the difficulty for a quickly mined block - yavas bir şekilde kazılmış bir bloğun zorluğunu azaltır", () => {
            expect(Block.adjustDifficulty({
                originalBlock: block,
                timestamp: block.timestamp + MINE_RATE + 100
            }))
                .toEqual(block.difficulty - 1);
        });
        it("has a lower limit of 1", () => {
            block.difficulty = -1;
            expect(Block.adjustDifficulty({ originalBlock: block })).toEqual(1);
        });


    });








});