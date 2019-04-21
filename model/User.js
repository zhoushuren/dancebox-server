const sequelize = require('../config')
const Sequelize = require('sequelize')

const user = sequelize.define('user', {
    user_name: {
      type: Sequelize.STRING
    },
    open_id: {
      type: Sequelize.STRING
    },
    session_key: {
      type: Sequelize.STRING
    }
  },
  {
    tableName: 'user',
    createdAt: 'created_at',
    updatedAt: false,
    getterMethods: {}
  })

module.exports = user
