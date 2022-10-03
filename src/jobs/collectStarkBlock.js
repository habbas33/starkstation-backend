const cron = require('node-cron')
const mongoose = require('mongoose')
const { BigNumber} = require('ethers')
const fs = require('fs')
const {
    Account,
    ec,
    Provider,
    number,
  } = require('starknet')

require('dotenv').config();

const StarkBlock = require('../models/starkBlock')
const { TO_ADDRESS_SN_MAINNET, FROM_ADDRESS_SN_MAINNET, L2_FEE_CONTRACT_ADDRESS } = require('../constants/globals')

mongoose.connect('mongodb://127.0.0.1:27017/stark-station-api', err => {
    if(err) throw err;
    console.log('connected to MongoDB')
})

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
    return Number(result)
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
    return convertBnWeiToNumberEth(res.gas_price)
}

// get total fee for all transactions in a block
const getTxnsFee = async (block, provider) =>{
    const txnsInBatch = 5;
    let txBatchArray = []
    console.log("Total Txns = ", block.transactions.length)
    for (let tx=0; tx < block.transactions.length/txnsInBatch; tx++){
        txBatchArray[tx] = block.transactions.slice(txnsInBatch*tx,txnsInBatch*(tx+1))
    }
    
    let feeArray = [] 
    for (let tx=0; tx < txBatchArray.length; tx++){
        let txReceipts  = await Promise.all(
            txBatchArray[tx].map(async (tx)=> {
                let result = await provider.getTransactionReceipt(tx)
                return result
            })
        )
        await new Promise(r => setTimeout(r, 1000));
        console.log("tx-",tx)
        // console.log("txReceipts-",txReceipts)
        const fee_array = txReceipts.map((tx)=> Number(tx.actual_fee))
        feeArray = fee_array.concat(feeArray)
    }
    const totalFee = feeArray.reduce((a,v)=> a+v)
    return totalFee
}

const provider = new Provider({sequencer: { network: 'mainnet-alpha' } })

cron.schedule('*/5 * * * *', function() {
    const account = useStarkNetAccount();
    const collectFeeDetail = async(block) =>{
        try {
            [ gasPrice, totalTxnFee ] = await Promise.all([
                await estimateEthTransferFee(account),
                await getTxnsFee(block,provider)
            ])
            // console.log("total fee", erc20TransferFee)
            const result = { gasPrice:gasPrice.toString(), totalTxnFee:totalTxnFee.toString(), gasUsed: parseInt(totalTxnFee/gasPrice) }
            return result
        } catch (error) {
            console.log(error,'Fee estimate calls failed')
            const result = { ethTransferFee:0, erc20TransferFee:0 }
            return result
        }
    }

    const collect = async() =>{
        try {

            const latestBlock = await provider.getBlock('latest')
            const lastStarkBlockInDb = await StarkBlock.find().sort({block_number:-1}).limit(1)
            const blockNumberExistInDb = await StarkBlock.find({block_number:latestBlock.block_number})
            
            console.log("latestBlock ", latestBlock.block_number)
            console.log("lastStarkBlockInDb ", !lastStarkBlockInDb.length ? 'Null' : lastStarkBlockInDb[0].block_number)
            
            if (!lastStarkBlockInDb.length && Array.isArray(lastStarkBlockInDb)) {
                let blockNumber = latestBlock.block_number-20
                while (latestBlock.block_number >= blockNumber ) {
                    let block = await provider.getBlock(blockNumber)
                    const feeDetail = await collectFeeDetail(block)
                    // console.log("feeDetail",feeDetail)                
                    const blockExistInDb = await StarkBlock.find({block_number:block.block_number})
                    if (!blockExistInDb.length) {
                        const starkBlock = new StarkBlock(block)
                        starkBlock.gasUsed = BigNumber.from(feeDetail.gasUsed)
                        starkBlock.txnFee = BigNumber.from(feeDetail.totalTxnFee)
                        starkBlock.gasPrice = feeDetail.gasPrice
                        await starkBlock.save()
                        console.log("Stark Block Saved - ",starkBlock.block_number)
                    }
                    blockNumber++
                }
            } else if (latestBlock.block_number > lastStarkBlockInDb[0].block_number && !blockNumberExistInDb.length) {
                const nextBlock = await provider.getBlock(lastStarkBlockInDb[0].block_number+1)
                const starkBlock = new StarkBlock(nextBlock)
                const feeDetail = await collectFeeDetail(nextBlock)
                // console.log("feeDetail",feeDetail)
                starkBlock.gasUsed = BigNumber.from(feeDetail.gasUsed)
                starkBlock.txnFee = BigNumber.from(feeDetail.totalTxnFee)
                starkBlock.gasPrice = feeDetail.gasPrice
                await starkBlock.save()
                console.log("Stark Block Saved",starkBlock.block_number, " -- last block", !blockNumberExistInDb.length)
            }
        } catch (e) {
            console.log(e,"job failed")
        }

    }

    collect();
    
    console.log('running a task every minute',new Date());
  });
