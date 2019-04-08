const sequelize = require('../config')
const Sequelize = require('sequelize')

const personal = sequelize.define('personal', {
        name: {
            type: Sequelize.STRING
        },
        type: {
            type: Sequelize.INTEGER
        },
        img: {
            type: Sequelize.STRING
        },
        status: {
            type: Sequelize.INTEGER
        }
    },
    {
        tableName: 'personal',
        createdAt: 'created_at',
        updatedAt: false,
        getterMethods: {}
    })

module.exports = personal
