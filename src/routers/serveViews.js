const express = require('express')
const EthPerformanceDetail = require('../models/ethPerformanceDetail')

// const auth = require('../middleware/auth')
const router = new express.Router()

router.get('', (req, res) => {
    res.render('index', {
    title: 'My title',
    name: 'Andrew Mead'
    })
})

router.get('/about', (req, res) => {
    res.render('about', {
    title: 'My title',
    name: 'Andrew Mead'
    })
})

module.exports = router