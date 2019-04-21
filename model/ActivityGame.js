const sequelize = require('../config')
const Sequelize = require('sequelize')

const activity_game = sequelize.define('activity_game', {
        activity_id: {
            type: Sequelize.INTEGER
        },
        project: {
            type: Sequelize.STRING
        },
        organizer: {
            type: Sequelize.STRING
        },
        sponsor: {
            type: Sequelize.STRING
        },
        guest: {
            type: Sequelize.STRING
        },
        desc: {
            type: Sequelize.STRING
        }
    },
    {
        tableName: 'activity_game',
        createdAt: 'created_at',
        updatedAt: false,
        getterMethods: {}
    })

module.exports = activity_game
