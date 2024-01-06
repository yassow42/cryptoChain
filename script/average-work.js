const Blockchain = require("../blockchain");

const blockchain = new Blockchain();

blockchain.addBlock({ data: "initial" });

const times = [0]; // Genesis bloğu eklenmeden önce ortalama hesaplamasını kontrol etmek için

for (let i = 1; i < 30; i++) {
    const prevBlock = blockchain.chain[i - 1];
    const prevTimestamp = prevBlock.timestamp;

    blockchain.addBlock({ data: `data ${i}` });

    const nextBlock = blockchain.chain[i];
    const nextTimestamp = nextBlock.timestamp;

    const diffTime = nextTimestamp - prevTimestamp;
    
    // Genesis bloğu eklenmeden önce ortalama hesaplamasını kontrol et
    if (i > 1) {
        times.push(diffTime);
        const average = times.reduce((total, num) => (total + num)) / times.length;
        console.log(`Block ${i}: Difficulty:${nextBlock.difficulty} Diff Time: ${diffTime}ms, Average: ${average}ms`);
    } else {
        console.log(`Block ${i}: Diff Time: ${diffTime}ms`);
    }
}
