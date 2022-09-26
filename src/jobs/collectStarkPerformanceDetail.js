const cron = require('node-cron')
const mongoose = require('mongoose')
const { BigNumber} = require('ethers')
const dayjs = require('dayjs')
const fs = require('fs')
const { Account, Contract, ec, json, Provider, number, uint256 } = require('starknet')
const fetch = require('node-fetch')

const StarkBlock = require('../models/starkBlock')
// const USDC_ABI = require("../abi/USDC_ABI_STARKNET.json")
const StarkPerformanceDetail = require('../models/starkPerformanceDetail')
const { COIN_GECKO_ENDPOINT_ETH_PRICE, TO_ADDRESS_SN_MAINNET, FROM_ADDRESS_SN_MAINNET, USDC_CONTRACT_ADDRESS_SN, L2_FEE_CONTRACT_ADDRESS } = require('../constants/globals')

require('dotenv').config();

mongoose.connect('mongodb://127.0.0.1:27017/stark-station-api', err => {
    if(err) throw err;
    console.log('connected to MongoDB')
})

const provider = new Provider({
    sequencer: {
        network: 'mainnet-alpha'
    }
})

const USDC_ABI = json.parse(
    fs.readFileSync("src/abi/USDC_ABI_STARKNET.json").toString("ascii")
);

const useStarkNetAccount = () =>{
    const starkKeyPair = ec.getKeyPair(process.env.SN_PVT_KEY);
    const account = new Account(
        provider,
        FROM_ADDRESS_SN_MAINNET,
        starkKeyPair
    );
    return account
}

const convertBnWeiToNumberEth =  (value) =>{
    const result = number.hexToDecimalString(number.toHex(value))
    // console.log(result)
    return Number(result)/10**18
}

const EstimateUsdcTransferFee = async(account) => {
    const amount = uint256.bnToUint256("100")
    const res = await account.estimateFee(
        {
            contractAddress: USDC_CONTRACT_ADDRESS_SN,
            entrypoint: "transfer",
            calldata: [TO_ADDRESS_SN_MAINNET, amount.low, amount.high],
        },
        undefined,
        { 
            maxFee: "99999999999999" 
        });

    return convertBnWeiToNumberEth(res.overall_fee)
}

// estimate eth transfer fee in L2
const estimateEthTransferFee = async (account) =>{
    const res = await account.estimateFee(
        {
            contractAddress: L2_FEE_CONTRACT_ADDRESS,
            entrypoint: "transfer",
            calldata: [
                TO_ADDRESS_SN_MAINNET,
                "10000000000",
                "0"
              ]
        });
    // console.log(res)

    return convertBnWeiToNumberEth(res.overall_fee)
}


// corn job starts here
cron.schedule('*/20 * * * * *', function() {
    const account = useStarkNetAccount();
    const usdc_contract = new Contract(USDC_ABI, USDC_CONTRACT_ADDRESS_SN, provider);
    usdc_contract.connect(account);

    const collectFeeEstimate = async() =>{
        try {
            [ ethTransferFee, erc20TransferFee ] = await Promise.all([
                await estimateEthTransferFee(account),
                await EstimateUsdcTransferFee(account)
            ])
            const result = { ethTransferFee:ethTransferFee, erc20TransferFee:erc20TransferFee }
            return result
        } catch (error) {
            console.log(error,'Fee estimate calls failed')
            const result = { ethTransferFee:0, erc20TransferFee:0 }
            return result
        }
    }

    const collect = async() =>{
        try {
            let starkPerformanceDetail = []
            const firstStarktBlockInDb = await StarkBlock.find().sort({block_number:1}).limit(1)
            const latestStarkBlockInDb = await StarkBlock.find().sort({block_number:-1}).limit(1)
       
            if (latestStarkBlockInDb[0].block_number >= firstStarktBlockInDb[0].block_number+1) {
                const lastStarkPerformanceEntryInDb = await StarkPerformanceDetail.find().sort({timestamp:-1}).limit(1)
                let currentStarkBlock = []
                let previousStarkBlock = []
                if (!lastStarkPerformanceEntryInDb.length && Array.isArray(lastStarkPerformanceEntryInDb)) {
                    currentStarkBlock = await StarkBlock.findOne({block_number: firstStarktBlockInDb[0].block_number+1})
                    previousStarkBlock = firstStarktBlockInDb[0]
                } else if (latestStarkBlockInDb[0].block_number >= lastStarkPerformanceEntryInDb[0].block_number+1) {
                    currentStarkBlock = await StarkBlock.findOne({block_number: lastStarkPerformanceEntryInDb[0].block_number+1})
                    previousStarkBlock =  await StarkBlock.findOne({block_number: lastStarkPerformanceEntryInDb[0].block_number})
                }                

                const check1 = Object.keys(currentStarkBlock).length === 0?false:true
                const check2 = Object.keys(previousStarkBlock).length === 0?false:true
                console.log("check1",check1,"check2",check1)
                
                if (check1 && check2) {
                    console.log("currentStarkBlock",currentStarkBlock.block_number)
                    console.log("previousStarkBlock",previousStarkBlock.block_number)

                    starkPerformanceDetail.block_number = currentStarkBlock.block_number
                    starkPerformanceDetail.avgTxnFee = currentStarkBlock.txnFee
                    starkPerformanceDetail.gasUsedPerblock = BigNumber.from(currentStarkBlock.gasUsed).toNumber()
                    starkPerformanceDetail.avgGasPrice = currentStarkBlock.gasPrice
                    
                    const ethPrice = await fetch(COIN_GECKO_ENDPOINT_ETH_PRICE)
                    const ethInUsd = await ethPrice.json()
                    starkPerformanceDetail.ethPrice = ethInUsd.ethereum.usd;
    
                    const feeEstimate = await collectFeeEstimate()
                    starkPerformanceDetail.feeEstimate = {ethTransferFee:feeEstimate.ethTransferFee,erc20TransferFee:feeEstimate.erc20TransferFee }
                    
                    starkPerformanceDetail.transactionsPerBlock = currentStarkBlock.transactions.length
                    starkPerformanceDetail.blockLatency = currentStarkBlock.timestamp - previousStarkBlock.timestamp
                    starkPerformanceDetail.transactionsPerSecond = starkPerformanceDetail.transactionsPerBlock/starkPerformanceDetail.blockLatency
                    starkPerformanceDetail.timestamp = currentStarkBlock.timestamp
    
                    const starkPerformanceRecord = new StarkPerformanceDetail(starkPerformanceDetail)
                    if (!lastStarkPerformanceEntryInDb.length && Array.isArray(lastStarkPerformanceEntryInDb)){
                        await starkPerformanceRecord.save()
                        console.log("Stark Performance Record Saved",starkPerformanceRecord.timestamp)
                    } else if (latestStarkBlockInDb[0].block_number >= lastStarkPerformanceEntryInDb[0].block_number+1) {
                        await starkPerformanceRecord.save()
                        console.log("Stark Performance Record Saved",starkPerformanceRecord.timestamp)
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

