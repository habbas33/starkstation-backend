const mongoose = require('mongoose')
const { BigNumber } = require('ethers')
const {ethAllowedPeriods} = require('../constants/globals')

const ethPerformanceDetailSchema = new mongoose.Schema({
    transactionsPerSecond: { 
        type: Number
    },
    transactionsPerBlock: { 
        type: Number
    },
    blockLatency: { 
        type: Number
    },
    gasUsedPerblock: { 
        type: Number
    },
    avgBurntFee: {
        type: mongoose.Schema.Types.Mixed
    },
    avgTxnFee: {
        type: mongoose.Schema.Types.Mixed
    },
    feeEstimate: {
        type: mongoose.Schema.Types.Mixed
    },
    ethPrice: { 
        type: Number
    },
    timestamp: { 
        type: Number
    },
}
)

ethPerformanceDetailSchema.methods.toJSON = function () {
    const detail = this
    const detailObject = detail.toObject()

    delete detailObject._id
    delete detailObject.__v

    return detailObject
}

ethPerformanceDetailSchema.statics.getPerformanceDetail = async function (skip, limit, period, item) {
    const _skip = skip?skip:0
    let detail = []
    let showItem = {
        _id: 0,
        timestamp: 1,
    }
    if (item === 'all'){
        showItem.blockLatency = 1
        showItem.transactionsPerBlock = 1
        showItem.transactionsPerSecond = 1
        showItem.ethPrice = 1
        showItem.gasUsedPerblock = 1
        showItem.feeEstimate = { ethTransferFee : "$ethTransferFee", erc20TransferFee : "$erc20TransferFee" }
        showItem.avgBurntFee = 1
        showItem.avgTxnFee = 1
    } else if (item === 'feeEstimate') {
        showItem.feeEstimate = { ethTransferFee : "$ethTransferFee", erc20TransferFee : "$erc20TransferFee" }
        showItem.avgBurntFee = 1
        showItem.avgTxnFee = 1
    } else {
        showItem[item] = 1
    }

    if (ethAllowedPeriods.includes(period)) {
        const numberPeriod = Number(period.replace("h",""))
        const pipeline = [
            {
                "$project": {
                    _id: 0,
                    time: {
                        $toDate: {
                            $multiply: [
                                "$timestamp",
                                1000
                            ]
                        }
                    },
                    timestamp: 1,
                    blockLatency: 1,
                    transactionsPerBlock: 1,
                    transactionsPerSecond: 1,
                    ethPrice: 1,
                    gasUsedPerblock: 1,
                    feeEstimate: 1,
                    avgBurntFee: 1,
                    avgTxnFee: 1,
                }
            },
            {
                "$project": {
                  _id: 1,
                  time: 1,
                  "H": {
                    $floor: {
                      $divide: [
                        {
                          $hour: "$time"
                        },
                        numberPeriod
                      ]
                    }
                  },
                  timestamp: 1,
                  blockLatency: 1,
                  transactionsPerBlock: 1,
                  transactionsPerSecond: 1,
                  ethPrice: 1,
                  gasUsedPerblock: 1,
                  feeEstimate: 1,
                  avgBurntFee: 1,
                  avgTxnFee: 1,
                }
            },
            {
                $group: {
                    _id: {
                        "date": {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$time"
                            },
                        },
                        "hour" : "$H"
                    },
                    blockLatency: { $avg: "$blockLatency" },
                    transactionsPerBlock: { $avg: "$transactionsPerBlock" },
                    transactionsPerSecond: { $avg: "$transactionsPerSecond" },
                    ethPrice: { $avg: "$ethPrice" },
                    gasUsedPerblock: { $avg: "$gasUsedPerblock" },
                    ethTransferFee: { $avg:"$feeEstimate.ethTransferFee"},
                    erc20TransferFee: { $avg:"$feeEstimate.erc20TransferFee"},
                    avgBurntFee: { "$push":"$avgBurntFee" },
                    avgTxnFee: { "$push" : "$avgTxnFee" },
                    timestamp: { "$last":"$timestamp" },
                }
            },
            {
                "$project": showItem
            },
            { "$sort": { "timestamp": -1 } },
        ]

        if (limit) {
            pipeline.push({$limit: _skip + limit});
            pipeline.push({"$skip": _skip});
        } else {
            pipeline.push({"$skip": _skip});
        }

        detail = await EthPerformanceDetail.aggregate(pipeline);

        if (item === 'all' || item === 'feeEstimate') {
            for (let i= 0; i<detail.length; i++){
                const avgTxnFee = detail[i].avgTxnFee.map((item)=> BigNumber.from(item)).reduce((a,v)=> a.add(v)).div(BigNumber.from( detail[i].avgTxnFee.length))
                const avgBurntFee = detail[i].avgBurntFee.map((item)=> BigNumber.from(item)).reduce((a,v)=> a.add(v)).div(BigNumber.from( detail[i].avgBurntFee.length))
                
                detail[i].avgTxnFee = avgTxnFee;
                detail[i].avgBurntFee = avgBurntFee;
            }
        }
    } 

    return detail
}

const EthPerformanceDetail = mongoose.model('EthPerformanceDetail', ethPerformanceDetailSchema)

module.exports = EthPerformanceDetail

