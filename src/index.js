const express = require('express')
require('./db/mongoose')
const ethPerformanceRouter = require('./routers/ethPerformance')
const starkPerformanceRouter = require('./routers/starkPerformance')
// const taskRouter = require('./routers/task')

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(ethPerformanceRouter)
app.use(starkPerformanceRouter)
// app.use(taskRouter)

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})

// const TpbEth = require('./models/tpbEth')
// const User = require('./models/user')

const main = async () => {
    // const task = await Task.findById('5c2e505a3253e18a43e612e6')
    // await task.populate('owner').execPopulate()
    // console.log(task.owner)

    // const user = await User.findById('5c2e4dcb5eac678a23725b5b')
    // await user.populate('tasks').execPopulate()
    // console.log(user.tasks)
}

main()