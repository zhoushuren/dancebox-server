const sequelize = require('../config')
const Sequelize = require('sequelize')

const user = sequelize.define('activity', {
    title: {
        type: Sequelize.STRING
    },
    start_time: {
        type: Sequelize.STRING
    },
    end_time: {
        type: Sequelize.STRING
    },
    remark: {
        type: Sequelize.STRING
    },
    location: {
        type: Sequelize.STRING
    },
    img: {
        type: Sequelize.STRING
    },
    game_detail: {
        type: Sequelize.STRING
    },
    teach_detail: {
        type: Sequelize.STRING
    },
    status: {
        type: Sequelize.INTEGER
    }
    },
    {
        tableName: 'activity',
        createdAt: 'created_at',
        updatedAt: false,
        getterMethods: {}
    })

module.exports = user
