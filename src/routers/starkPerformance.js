const express = require('express')
const StarkPerformanceDetail = require('../models/starkPerformanceDetail')

// const auth = require('../middleware/auth')
const router = new express.Router()

router.get('/stark/detail', async (req, res) => {
    try {
        const {skip, limit, period} = req.query;
        const starkPerformanceDetail = await StarkPerformanceDetail.getPerformanceDetail(Number(skip), Number(limit), period, "all")
        res.send(starkPerformanceDetail)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/stark/blockLatency', async (req, res) => {
    try {
        const {skip, limit, period} = req.query;
        const starkPerformanceDetail = await StarkPerformanceDetail.getPerformanceDetail(Number(skip), Number(limit), period, "blockLatency")
        res.send(starkPerformanceDetail)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/stark/tps', async (req, res) => {
    try {
        const {skip, limit, period} = req.query;
        const starkPerformanceDetail = await StarkPerformanceDetail.getPerformanceDetail(Number(skip), Number(limit), period, "transactionsPerSecond")
        res.send(starkPerformanceDetail)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/stark/tpb', async (req, res) => {
    try {
        const {skip, limit, period} = req.query;
        const starkPerformanceDetail = await StarkPerformanceDetail.getPerformanceDetail(Number(skip), Number(limit), period, "transactionsPerBlock")
        res.send(starkPerformanceDetail)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/stark/gasUsedPerBlock', async (req, res) => {
    try {
        const {skip, limit, period} = req.query;
        const starkPerformanceDetail = await StarkPerformanceDetail.getPerformanceDetail(Number(skip), Number(limit), period, "gasUsedPerblock")
        res.send(starkPerformanceDetail)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/stark/feeEstimate', async (req, res) => {
    try {
        const {skip, limit, period} = req.query;
        const starkPerformanceDetail = await StarkPerformanceDetail.getPerformanceDetail(Number(skip), Number(limit), period, "feeEstimate")
        res.send(starkPerformanceDetail)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router