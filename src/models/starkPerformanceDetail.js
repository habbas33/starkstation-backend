const { BigNumber } = require('ethers')
const mongoose = require('mongoose')
const {starkAllowedPeriods} = require('../constants/globals')

const starkPerformanceDetailSchema = new mongoose.Schema({
    block_number: { 
        type: Number
    },
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
    avgGasPrice: {
        type: Number
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
})

starkPerformanceDetailSchema.methods.toJSON = () => {
    const detail = this
    const detailObject = detail.toObject()

    delete detailObject._id
    delete detailObject.__v
    
    return detailObject
}

starkPerformanceDetailSchema.statics.getPerformanceDetail = async function (skip, limit, period, item) {
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
        showItem.avgTxnFee = 1
    } else if (item === 'feeEstimate') {
        showItem.feeEstimate = { ethTransferFee : "$ethTransferFee", erc20TransferFee : "$erc20TransferFee" }
        showItem.avgTxnFee = 1
    } else {
        showItem[item] = 1
    }
    // console.log(showItem)
    if (starkAllowedPeriods.includes(period)) {
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
        detail = await StarkPerformanceDetail.aggregate(pipeline);

        if (item === 'all' || item === 'feeEstimate') {
            for (let i= 0; i<detail.length; i++){
                // console.log(detail[i].avgTxnFee)
                const avgTxnFee = detail[i].avgTxnFee.map((item)=> new BigNumber.from(item)).reduce((a,v)=> a.add(v)).div(BigNumber.from( detail[i].avgTxnFee.length))
                // console.log(avgTxnFee)   
                detail[i].avgTxnFee = avgTxnFee;
            }
        }
    } 
    
    return detail
}

starkPerformanceDetailSchema.statics.getBlockDetail = async function (skip, limit) {
    const _skip = skip?skip:0
    // let detail = []
    // let showItem = {
    //     _id: 0,
    //     timestamp: 1,
    // }
    // console.log(showItem)
 
        const pipeline = [
            {
                "$project": {
                    _id: 0,
                    block_number: 1,
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
                    avgTxnFee: 1,
                }
            },
            // {
            //     "$project": {
            //       _id: 1,
            //       time: 1,
            //       "H": {
            //         $floor: {
            //           $divide: [
            //             {
            //               $hour: "$time"
            //             },
            //             numberPeriod
            //           ]
            //         }
            //       },
            //       timestamp: 1,
            //       blockLatency: 1,
            //       transactionsPerBlock: 1,
            //       transactionsPerSecond: 1,
            //       ethPrice: 1,
            //       gasUsedPerblock: 1,
            //       feeEstimate: 1,
            //       avgTxnFee: 1,
            //     }
            // },
            // {
            //     $group: {
            //         _id: {
            //             "date": {
            //                 $dateToString: {
            //                     format: "%Y-%m-%d",
            //                     date: "$time"
            //                 },
            //             },
            //             "hour" : "$H"
            //         },
            //         blockLatency: { $avg: "$blockLatency" },
            //         transactionsPerBlock: { $avg: "$transactionsPerBlock" },
            //         transactionsPerSecond: { $avg: "$transactionsPerSecond" },
            //         ethPrice: { $avg: "$ethPrice" },
            //         gasUsedPerblock: { $avg: "$gasUsedPerblock" },
            //         ethTransferFee: { $avg:"$feeEstimate.ethTransferFee"},
            //         erc20TransferFee: { $avg:"$feeEstimate.erc20TransferFee"},
            //         avgTxnFee: { "$push" : "$avgTxnFee" },
            //         timestamp: { "$last":"$timestamp" },
            //     }
            // },
            // {
            //     "$project": showItem
            // },
            { "$sort": { "timestamp": -1 } },
        ]

        if (limit) {
            pipeline.push({$limit: _skip + limit});
            pipeline.push({"$skip": _skip});
        } else {
            pipeline.push({"$skip": _skip});
        }
        const detail = await StarkPerformanceDetail.aggregate(pipeline);

        // if (item === 'all' || item === 'feeEstimate') {
        //     for (let i= 0; i<detail.length; i++){
        //         // console.log(detail[i].avgTxnFee)
        //         const avgTxnFee = detail[i].avgTxnFee.map((item)=> new BigNumber.from(item)).reduce((a,v)=> a.add(v)).div(BigNumber.from( detail[i].avgTxnFee.length))
        //         // console.log(avgTxnFee)   
        //         detail[i].avgTxnFee = avgTxnFee;
        //     }
        // }
    
    
    return detail
}

const StarkPerformanceDetail = mongoose.model('StarkPerformanceDetail', starkPerformanceDetailSchema)

module.exports = StarkPerformanceDetail