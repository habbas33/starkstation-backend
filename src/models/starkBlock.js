const mongoose = require('mongoose')

const starkBlockSchema = new mongoose.Schema({
    timestamp: {
      type: Number
    },
    block_hash: {
      type: String
    },
    block_number: {
      type: Number
    },
    gasUsed: {
      type: mongoose.Schema.Types.Mixed
    },
    txnFee: {
      type: mongoose.Schema.Types.Mixed
    },
    gasPrice: {
      type: Number
    },
    new_root: {
      type: String
    },
    parent_hash: {
      type: String
    },
    status: {
      type: String
    },
    transactions: {
      type: [
        String
      ]
    }
  })

const StarkBlock = mongoose.model('StarkBlock', starkBlockSchema)

module.exports = StarkBlock