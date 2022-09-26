const cron = require('node-cron')
const mongoose = require('mongoose')
const {ethers, BigNumber} = require('ethers')
const Web3 = require('web3')
const fetch = require('node-fetch')

require('dotenv').config();

const { NETHERMIND_ENDPOINT } = require('../constants/globals')
const EthBlock = require('../models/ethBlock')
const EthGasEstimate = require('../models/ethGasEstimate')

mongoose.connect('mongodb://127.0.0.1:27017/stark-station-api', err => {
    if(err) throw err;
    console.log('connected to MongoDB')
})
const ETHERSCAN_ENDPOINT = process.env.ETHERSCAN_ENDPOINT?process.env.ETHERSCAN_ENDPOINT:"https://api.etherscan.io/"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY?process.env.ETHERSCAN_API_KEY:""
const INFURA_ENDPOINT = process.env.INFURA_ENDPOINT?process.env.INFURA_ENDPOINT:"https://mainnet.infura.io/"

cron.schedule('*/5 * * * * *', function() {

    const web3 = new Web3(new Web3.providers.HttpProvider(NETHERMIND_ENDPOINT));
    const provider = new ethers.providers.JsonRpcProvider(NETHERMIND_ENDPOINT)
    const provider_infura = new ethers.providers.JsonRpcProvider(INFURA_ENDPOINT)
    const web3_infura = new Web3(new Web3.providers.HttpProvider(INFURA_ENDPOINT));

    const collect = async() =>{
        let latestBlock = []
        let feeHistory = []    
        try {
            [ latestBlock, feeHistory] = await Promise.all([
                provider.getBlock("latest"),
                web3.eth.getFeeHistory(1, "latest",[10, 50, 90])
            ])
        } catch (error) {
            console.log(error,'Nethermind call failed... Now calling infura')
            try {
                [ latestBlock, feeHistory] = await Promise.all([
                    provider_infura.getBlock("latest"),
                    web3_infura.eth.getFeeHistory(1, "latest",[10, 50, 90])
                ])
            } catch (error) {
                console.log('Infura call failed')
            }
        }

        try {
            let lastEthBlockInDb = await EthBlock.find().sort({number:-1}).limit(1)
            let blockReward = {status : '0'}
            let fetchAttempt = 0
            while (blockReward.status == '0' && fetchAttempt < 5) {
                const blockExistInDb = await EthBlock.find({number:latestBlock.number})
                if (!lastEthBlockInDb.length && Array.isArray(lastEthBlockInDb)) {
                    const blockRewardResponse = await fetch(`${ETHERSCAN_ENDPOINT}&blockno=${latestBlock.number}&apikey=${ETHERSCAN_API_KEY}`)
                    blockReward = await blockRewardResponse.json()
                } else if (latestBlock.number > lastEthBlockInDb[0].number && !blockExistInDb.length) {
                    const blockRewardResponse = await fetch(`${ETHERSCAN_ENDPOINT}&blockno=${latestBlock.number}&apikey=${ETHERSCAN_API_KEY}`)
                    blockReward = await blockRewardResponse.json()
                } else {
                    fetchAttempt = 6
                }
                console.log(latestBlock.number," blockReward = ", blockReward.message, "attempt =", fetchAttempt)
                fetchAttempt++
            }
            const burntFee = latestBlock.gasUsed.mul(latestBlock.baseFeePerGas)
            const txnFee = blockReward.status == '1' ? BigNumber.from(blockReward.result.blockReward).add(burntFee):"null"
            
            latestBlock.txnFee = txnFee;
            latestBlock.burntFee = burntFee;

            const baseFeePerGas = parseInt(feeHistory.baseFeePerGas,16);
            const priorityPercentile10 = parseInt(feeHistory.reward[0][0],16)
            const priorityPercentile50 = parseInt(feeHistory.reward[0][1],16)
            const priorityPercentile90 = parseInt(feeHistory.reward[0][2],16)
            const estimator = {number: parseInt(feeHistory.oldestBlock,16), slow:baseFeePerGas+priorityPercentile10, average: baseFeePerGas+priorityPercentile50, fast:baseFeePerGas+priorityPercentile90}
            
            const ethBlock = new EthBlock(latestBlock)

            const blockNumberExistInDb = await EthBlock.find({number:latestBlock.number})
            if (!lastEthBlockInDb.length && Array.isArray(lastEthBlockInDb)) {
                await ethBlock.save()
                console.log("Eth Block Saved",ethBlock.number)
            } else if (latestBlock.number > lastEthBlockInDb[0].number && !blockNumberExistInDb.length) {
                await ethBlock.save()
                console.log("Eth Block Saved",ethBlock.number, " -- last block", !blockNumberExistInDb.length)
            }

            const ethGasEstimate = new EthGasEstimate(estimator)
            const lastEthGasEstimateInDb = await EthGasEstimate.find().sort({number:-1}).limit(1)
            if (!lastEthGasEstimateInDb.length && Array.isArray(lastEthGasEstimateInDb)) {
                await ethGasEstimate.save()
                console.log("Eth Gas Estimate Saved",ethGasEstimate.number)
            } else if (estimator.number > lastEthGasEstimateInDb[0].number) {
                await ethGasEstimate.save()
                console.log("Eth Gas Estimate Saved",ethGasEstimate.number)
            }
        } catch (e) {
            console.log(e,"job failed")
        }
    }

    collect();
    
    console.log('running a task every 5 seconds',new Date());
  });
