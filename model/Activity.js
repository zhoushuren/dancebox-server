const sequelize = require('../config')
const Sequelize = require('sequelize')

const activity = sequelize.define('activity', {
        title: {
            type: Sequelize.STRING
        },
        start_time: {
            type: Sequelize.DATE
        },
        end_time: {
            type: Sequelize.DATE
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
        banner_img: {
          type: Sequelize.STRING
        },
        status: {
            type: Sequelize.INTEGER
        },
        city: {
            type: Sequelize.STRING
        },
        dance: {
          type: Sequelize.STRING
        },
        url:  {
          type: Sequelize.STRING
        },
        is_judge: {
            type: Sequelize.INTEGER
        }
    },
    {
        tableName: 'activity',
        createdAt: 'created_at',
        updatedAt: false,
        getterMethods: {}
    })

module.exports = activity
