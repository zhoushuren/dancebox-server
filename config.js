const Sequelize = require('sequelize')
const DB_NAME =  process.env.DB_NAME || 'box'
const DB_USER =  process.env.DB_USER || 'root'
const DB_PASS =  process.env.DB_PASS || ''
const DB_HOST =  process.env.DB_HOST || 'localhost'

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    dialect: 'mysql',
    pool: {
        max: 500,
        min: 10,
        acquire: 30000,
        idle: 10000
    },
    timezone: '+08:00',
    operatorsAliases: false
})

module.exports = sequelize
