
const sequelize = require('../config')
const Sequelize = require('sequelize')

const admin = sequelize.define('admin_session', {
    admin_user_id: {
        type: Sequelize.INTEGER
    },
    session_token: {
        type: Sequelize.STRING
    },
    status: {
        type: Sequelize.INTEGER
    }
},{
    tableName: 'admin_session',
    createdAt: 'created_at',
    updatedAt: false,
    getterMethods: {
    }
})


module.exports = admin