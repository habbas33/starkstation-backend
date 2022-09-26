const express = require('express')
const EthPerformanceDetail = require('../models/ethPerformanceDetail')

// const auth = require('../middleware/auth')
const router = new express.Router()

router.get('/eth/detail', async (req, res) => {
    try {
        const {skip, limit, period} = req.query;
        const ethPerformanceDetail = await EthPerformanceDetail.getPerformanceDetail(Number(skip), Number(limit), period, "all")
        res.send(ethPerformanceDetail)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/eth/blockLatency', async (req, res) => {
    try {
        const {skip, limit, period} = req.query;
        const ethPerformanceDetail = await EthPerformanceDetail.getPerformanceDetail(Number(skip), Number(limit), period, "blockLatency")
        res.send(ethPerformanceDetail)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/eth/tps', async (req, res) => {
    try {
        const {skip, limit, period} = req.query;
        const ethPerformanceDetail = await EthPerformanceDetail.getPerformanceDetail(Number(skip), Number(limit), period, "transactionsPerSecond")
        res.send(ethPerformanceDetail)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/eth/tpb', async (req, res) => {
    try {
        const {skip, limit, period} = req.query;
        const ethPerformanceDetail = await EthPerformanceDetail.getPerformanceDetail(Number(skip), Number(limit), period, "transactionsPerBlock")
        res.send(ethPerformanceDetail)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/eth/gasUsedPerBlock', async (req, res) => {
    try {
        const {skip, limit, period} = req.query;
        const ethPerformanceDetail = await EthPerformanceDetail.getPerformanceDetail(Number(skip), Number(limit), period, "gasUsedPerblock")
        res.send(ethPerformanceDetail)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/eth/ethPrice', async (req, res) => {
    try {
        const {skip, limit, period} = req.query;
        const ethPerformanceDetail = await EthPerformanceDetail.getPerformanceDetail(Number(skip), Number(limit), period, "ethPrice")
        res.send(ethPerformanceDetail)
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/eth/feeEstimate', async (req, res) => {
    try {
        const {skip, limit, period} = req.query;
        const ethPerformanceDetail = await EthPerformanceDetail.getPerformanceDetail(Number(skip), Number(limit), period, "feeEstimate")
        res.send(ethPerformanceDetail)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router