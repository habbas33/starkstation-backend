const mongoose = require('mongoose')

const ethBlockSchema = new mongoose.Schema({
    hash: {
        type: String
    },
    parentHash: {
        type: String
    },
    number: {
        type: Number
    },
    timestamp: {
        type: Number
    },
    nonce: {
        type: String
    },
    difficulty: {
        type: mongoose.Schema.Types.Mixed
    },
    gasLimit: {
        type: mongoose.Schema.Types.Mixed
    },
    gasUsed: {
        type: mongoose.Schema.Types.Mixed
    },
    burntFee: {
        type: mongoose.Schema.Types.Mixed
    },
    txnFee: {
        type: mongoose.Schema.Types.Mixed
    },
    miner: {
        type: String
    },
    extraData: {
        type: String
    },
    transactions: {
        type: [
            String
        ]
    },
    baseFeePerGas: {
      type: mongoose.Schema.Types.Mixed
    },
    _difficulty: {
      type: mongoose.Schema.Types.Mixed
    }
  })

const EthBlock = mongoose.model('EthBlock', ethBlockSchema)

module.exports = EthBlock