const sequelize = require('../config')
const Sequelize = require('sequelize')

const activity_teach = sequelize.define('activity_teach', {
        activity_id: {
            type: Sequelize.INTEGER
        },
        teacher: {
            type: Sequelize.STRING
        },
        time: {
            type: Sequelize.DATE
        },
        location: {
            type: Sequelize.STRING
        },
        desc: {
            type: Sequelize.STRING
        }
    },
    {
        tableName: 'activity_teach',
        createdAt: 'created_at',
        updatedAt: false,
        getterMethods: {}
    })

module.exports = activity_teach
