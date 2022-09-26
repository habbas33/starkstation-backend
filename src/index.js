const path = require('path')

const express = require('express')
const hbs = require('hbs')
require('./db/mongoose')
const ethPerformanceRouter = require('./routers/ethPerformance')
const starkPerformanceRouter = require('./routers/starkPerformance')
const serveViewsRouter = require('./routers/serveViews')
// const taskRouter = require('./routers/task')
const viewsPath = path.join(__dirname, '../templates/views')
const partialsPath = path.join(__dirname, '../templates/partials')

const app = express()
const port = process.env.PORT || 3000

hbs.registerPartials(partialsPath)

app.use(express.json())
app.use(ethPerformanceRouter)
app.use(starkPerformanceRouter)
app.use(serveViewsRouter)
app.set('views', viewsPath)
app.set('view engine', 'hbs')

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})

const main = async () => {

}

main()