const express = require('express')
const cors = require('cors')
require('dotenv').config()
require('reflect-metadata')

const { AppDataSource } = require('./config/dataSource')
const authRoutes = require('./routes/auth')
const adminRoutes = require('./routes/admin')
const assetRoutes = require('./routes/assets')
const activityLogRoutes = require('./routes/activityLogs')
const unitRoutes = require('./routes/units')
const monitorRoutes = require('./routes/monitors')

const app = express()

const allowedOrigins = ['http://localhost:5173']

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    }),
)
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Infini-Stock Backend Running')
})

app.get('/health', (req, res) => {
    res.json({ ok: true })
})

app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/assets', assetRoutes)
app.use('/api/activity-logs', activityLogRoutes)
app.use('/api/units', unitRoutes)
app.use('/api/monitors', monitorRoutes)

const port = Number(process.env.PORT || 5000)

AppDataSource.initialize()
    .then(async () => {
        console.log('Database connected (TypeORM)')

        await AppDataSource.synchronize()
        console.log(
            `Schema synchronized for ${AppDataSource.entityMetadatas.length} entities`,
        )

        app.listen(port, '0.0.0.0', () => {
            console.log(`Server running at http://0.0.0.0:${port}`)
        })
    })
    .catch((err) => {
        console.error('DB init error:', err)
        process.exitCode = 1
    })
