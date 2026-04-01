const { DataSource } = require('typeorm')
require('dotenv').config()

const useSsl = process.env.DB_SSL !== 'false'

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    synchronize: false,
    logging: false,
    entities: [__dirname + '/../models/*.js'],
})

module.exports = { AppDataSource }
