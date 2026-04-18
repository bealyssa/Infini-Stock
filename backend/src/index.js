const express = require('express')
const cors = require('cors')
const path = require('path')
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
let server = null

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:56646',
    'http://127.0.0.1:56646',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://192.168.1.2:5000',
]

function isOriginAllowed(origin) {
    if (!origin) return true
    return allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')
}

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            return callback(null, true)
        }

        // Check if origin is in allowlist or starts with localhost
        if (isOriginAllowed(origin)) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 0,
    optionsSuccessStatus: 204,
}

// Explicit preflight handling to avoid inconsistent browser errors.
app.options('*', (req, res) => {
    const origin = req.headers.origin
    if (!isOriginAllowed(origin)) {
        return res.status(403).end()
    }

    if (origin) {
        res.header('Access-Control-Allow-Origin', origin)
        res.header('Vary', 'Origin')
    }
    res.header('Access-Control-Allow-Credentials', 'true')
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    res.header(
        'Access-Control-Allow-Headers',
        req.headers['access-control-request-headers'] || 'Content-Type,Authorization',
    )
    res.header('Access-Control-Max-Age', '0')
    return res.sendStatus(204)
})

app.use(cors(corsOptions))

// Extra safety: ensure method list is always present (some browsers show
// confusing errors if any middleware short-circuits before CORS runs).
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    next()
})
app.use(express.json({ limit: '50mb' }))

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

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

        server = app.listen(port, '0.0.0.0', () => {
            console.log(`Server running at http://0.0.0.0:${port}`)
        })

        const shutdown = async (exitCode = 0, nextSignal) => {
            try {
                if (server) {
                    await new Promise((resolve) => {
                        server.close(() => resolve())
                    })
                }
            } catch {
                // ignore
            }

            try {
                if (AppDataSource.isInitialized) {
                    await AppDataSource.destroy()
                }
            } catch {
                // ignore
            }

            if (nextSignal) {
                process.kill(process.pid, nextSignal)
                return
            }

            process.exit(exitCode)
        }

        process.once('SIGUSR2', () => {
            shutdown(0, 'SIGUSR2')
        })

        process.once('SIGINT', () => {
            shutdown(0)
        })

        process.once('SIGTERM', () => {
            shutdown(0)
        })
    })
    .catch((err) => {
        console.error('DB init error:', err)
        process.exitCode = 1
    })
