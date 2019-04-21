const Sequelize = require('sequelize')
const DB_NAME =  process.env.DB_NAME || 'danceBox'
const DB_USER =  process.env.DB_USER || 'root'
const DB_PASS =  process.env.DB_PASS || '123456'

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: 'localhost',
    dialect: 'mysql',
    pool: {
        max: 200,
        min: 10,
        acquire: 30000,
        idle: 10000
    },
    operatorsAliases: false
})

module.exports = sequelize
