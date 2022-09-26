const mongoose = require('mongoose')

const ethGasEstimateSchema = new mongoose.Schema({
    number: {
        type: Number
    },
    slow: {
        type: Number
    },
    average: {
        type: Number
    },
    fast: {
        type: Number
    },
  })

const EthGasEstimate = mongoose.model('EthGasEstimate', ethGasEstimateSchema)

module.exports = EthGasEstimate