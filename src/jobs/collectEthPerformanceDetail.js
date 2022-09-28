const cron = require('node-cron')
const mongoose = require('mongoose')
const dayjs = require('dayjs')
const { ethers, BigNumber } = require('ethers')
const Web3 = require('web3')
const fetch = require('node-fetch')
const EthBlock = require('../models/ethBlock')
const USDC_ABI = require("../abi/USDC_ABI_ETHEREUM.json")
const EthPerformanceDetail = require('../models/ethPerformanceDetail')
const { COIN_GECKO_ENDPOINT_ETH_PRICE, TO_ADDRESS_ETH_MAINNET, FROM_ADDRESS_ETH_MAINNET, USDC_CONTRACT_ADDRESS} = require('../constants/globals')
const { NETHERMIND_ENDPOINT } = require('../constants/globals')

require('dotenv').config();

const INFURA_ENDPOINT = process.env.INFURA_ENDPOINT?process.env.INFURA_ENDPOINT:"https://mainnet.infura.io/"

mongoose.connect('mongodb://127.0.0.1:27017/stark-station-api', err => {
    if(err) throw err;
    console.log('connected to MongoDB')
})

cron.schedule('*/5 * * * *', function() {
    const web3 = new Web3(new Web3.providers.HttpProvider(NETHERMIND_ENDPOINT))
    const provider = new ethers.providers.JsonRpcProvider(NETHERMIND_ENDPOINT)
    const web3_infura = new Web3(new Web3.providers.HttpProvider(INFURA_ENDPOINT))
    const provider_infura = new ethers.providers.JsonRpcProvider(INFURA_ENDPOINT)

    const usdc_contract = new ethers.Contract(USDC_CONTRACT_ADDRESS, USDC_ABI, provider);
    const usdc_contract_infura = new ethers.Contract(USDC_CONTRACT_ADDRESS, USDC_ABI, provider_infura);
    const ethTransferCallData = {
        to: TO_ADDRESS_ETH_MAINNET,
        from: FROM_ADDRESS_ETH_MAINNET,
        value: web3.utils.toWei(`${100}`, 'wei'),
        gas: 50000
    }
    const collectFeeEstimate = async() =>{
        let ethTransferGasEstimate = 0
        let erc20TransferGasEstimate = BigNumber.from(0)  
        let feeHistory = []  
        try {
            [ ethTransferGasEstimate, erc20TransferGasEstimate, feeHistory, feeHistoryPendingBlock ] = await Promise.all([
                await web3.eth.estimateGas(ethTransferCallData),
                await usdc_contract.estimateGas.transfer(TO_ADDRESS_ETH_MAINNET, 100,{
                    from: FROM_ADDRESS_ETH_MAINNET,
                    gasLimit: '50000000'
                }),
                await web3.eth.getFeeHistory(10, "latest",[10, 50, 90]),
                await web3.eth.getFeeHistory(1, "pending",[10, 50, 90])
            ])
        } catch (error) {
            console.log(error,'Nethermind call failed... Now calling infura to call feeEstimate')
            try {
                [ ethTransferGasEstimate, erc20TransferGasEstimate, feeHistory, feeHistoryPendingBlock ] = await Promise.all([
                    await web3_infura.eth.estimateGas(ethTransferCallData),
                    await usdc_contract_infura.estimateGas.transfer(TO_ADDRESS_ETH_MAINNET, 100,{
                        from: FROM_ADDRESS_ETH_MAINNET,
                        gasLimit: '50000000'
                    }),
                    await web3_infura.eth.getFeeHistory(10, "latest",[10, 50, 90]),
                    await web3_infura.eth.getFeeHistory(1, "pending",[10, 50, 90])
                ])
            } catch (error) {
                console.log('Infura call failed to call feeEstimate')
                const result = { ethTransferGasEstimate: 0, erc20TransferGasEstimate:0, ethTransferFee:0, erc20TransferFee:0 }
                return result
            }
        }

            const baseFeePerGas = parseInt(feeHistoryPendingBlock.baseFeePerGas,16)
            const rewardPerGas = feeHistory.reward.map(b => parseInt(b[1],16)).reduce((a, v) => a + v);
            const priorityFeePerGasEstimate = Math.round(rewardPerGas/feeHistory.reward.length);
            const ethTransferFee = ((baseFeePerGas+priorityFeePerGasEstimate)*ethTransferGasEstimate)/10**18
            const erc20TransferFee = ((baseFeePerGas+priorityFeePerGasEstimate)*erc20TransferGasEstimate.toNumber())/10**18
            
            // console.log("--------Ethers.js----------")
            // console.log("gas estimate eth transfer",ethTransferGasEstimate.toString())
            // console.log("total fee", ethTransferFee)
            // console.log("gas estimate usdc_contract transfer", erc20TransferGasEstimate.toString())
            // console.log("total fee", erc20TransferFee)
            const result = { ethTransferGasEstimate: ethTransferGasEstimate, erc20TransferGasEstimate:erc20TransferGasEstimate.toNumber(), ethTransferFee:ethTransferFee, erc20TransferFee:erc20TransferFee }
            return result
    }

    const collect = async() =>{
        try {
            let ethPerformanceDetail = []
            const firstEthBlockInDb = await EthBlock.find().sort({number:1}).limit(1)
            const latestEthBlockInDb = await EthBlock.find().sort({number:-1}).limit(1)
            const filterByHourFactor = 10*60 //60*60
            if (latestEthBlockInDb[0].timestamp > firstEthBlockInDb[0].timestamp+filterByHourFactor) {
                const lastEthPerformanceEntryInDb = await EthPerformanceDetail.find().sort({timestamp:-1}).limit(1)
                let ethBlocksInLastHour = []
                if (!lastEthPerformanceEntryInDb.length && Array.isArray(lastEthPerformanceEntryInDb)) {
                    ethBlocksInLastHour = await EthBlock.find().where('timestamp').gte(latestEthBlockInDb[0].timestamp-(filterByHourFactor)) //blocks in last 10 minutes
                } else if (latestEthBlockInDb[0].timestamp > lastEthPerformanceEntryInDb[0].timestamp+filterByHourFactor ) {
                    ethBlocksInLastHour = await EthBlock.find().where('timestamp').gte(lastEthPerformanceEntryInDb[0].timestamp).lt(lastEthPerformanceEntryInDb[0].timestamp+filterByHourFactor) //blocks in last 10 minutes
                }                

                const performJob = !ethBlocksInLastHour.length?false:true

                if (performJob) {
                    const totalBlocksInLastHour = ethBlocksInLastHour.length
                    console.log(ethBlocksInLastHour[0].timestamp)
                    console.log(ethBlocksInLastHour[ethBlocksInLastHour.length-1].timestamp)
                    
                    ethPerformanceDetail.gasUsedPerblock = ethBlocksInLastHour.map((block) => BigNumber.from(block.gasUsed).toNumber() ).reduce((acc, val) => acc + val)/totalBlocksInLastHour
                    
                    const ethPrice = await fetch(COIN_GECKO_ENDPOINT_ETH_PRICE)
                    const ethInUsd = await ethPrice.json()
                    ethPerformanceDetail.ethPrice = ethInUsd.ethereum.usd;
    
                    const feeEstimate = await collectFeeEstimate()
                    ethPerformanceDetail.feeEstimate = {ethTransferFee:feeEstimate.ethTransferFee,erc20TransferFee:feeEstimate.erc20TransferFee }
                    ethPerformanceDetail.transactionsPerBlock = ethBlocksInLastHour.map((block) => block.transactions.length ).reduce((acc, val) => acc + val)/totalBlocksInLastHour
    
                    const timestampLatest = ethBlocksInLastHour[0].timestamp
                    const timestampOldest = ethBlocksInLastHour[totalBlocksInLastHour-1].timestamp
                    const timeTaken = dayjs(timestampLatest*1000).diff(dayjs(timestampOldest*1000),'seconds')
                    ethPerformanceDetail.blockLatency = timeTaken/(ethBlocksInLastHour[0].number - ethBlocksInLastHour[totalBlocksInLastHour-1].number)
    
                    let tps = []
                    for (let i=0; i < ethBlocksInLastHour.length-1; i++){
                        if (ethBlocksInLastHour[i+1].number == ethBlocksInLastHour[i].number + 1) {
                            const durationInSeconds = dayjs(ethBlocksInLastHour[i+1].timestamp*1000).diff(dayjs(ethBlocksInLastHour[i].timestamp*1000),'seconds')  
                            tps.push(ethBlocksInLastHour[i].transactions.length/durationInSeconds)
                        }
                    }
                    const txnFeeArray = ethBlocksInLastHour.map((block) => block.txnFee).filter( value => value !== "null" );
                   
                    ethPerformanceDetail.transactionsPerSecond = tps.reduce((acc, val) => acc + val)/tps.length
                    ethPerformanceDetail.avgBurntFee = ethBlocksInLastHour.map((block) => BigNumber.from(block.burntFee) ).reduce((acc, val) => acc.add(val)).div(BigNumber.from(totalBlocksInLastHour))
                    ethPerformanceDetail.avgTxnFee = txnFeeArray.map((txnFee) => BigNumber.from(txnFee) ).reduce((acc, val) => acc.add(val)).div(BigNumber.from(txnFeeArray.length))
                    ethPerformanceDetail.timestamp = ethBlocksInLastHour[totalBlocksInLastHour-1].timestamp
    
                    const ethPerformanceRecord = new EthPerformanceDetail(ethPerformanceDetail)
                    if (!lastEthPerformanceEntryInDb.length && Array.isArray(lastEthPerformanceEntryInDb)){
                        await ethPerformanceRecord.save()
                        console.log("Eth Performance Record Saved",ethPerformanceRecord.timestamp)
                    } else if (latestEthBlockInDb[0].timestamp > lastEthPerformanceEntryInDb[0].timestamp+filterByHourFactor) {
                        await ethPerformanceRecord.save()
                        console.log("Eth Performance Record Saved",ethPerformanceRecord.timestamp)
                    }
                }
            }
        } catch (e) {
            console.log(e,"failed")
        }
    }

    collect();
    
    console.log('running a task every 5 minute',new Date());
  });

