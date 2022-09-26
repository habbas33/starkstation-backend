const mongoose = require('mongoose')

mongoose.connect('mongodb://127.0.0.1:27017/stark-station-api', err => {
    if(err) throw err;
    console.log('connected to MongoDB')
})