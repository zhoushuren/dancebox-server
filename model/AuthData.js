const sequelize = require('../config')
const Sequelize = require('sequelize')

const auth_data = sequelize.define('wx_auth', {
    type: {
      type: Sequelize.NUMBER
    },
    open_id: {
      type: Sequelize.STRING
    },
    user_id: {
      type: Sequelize.STRING
    }
  },
  {
    tableName: 'wx_auth',
    createdAt: 'created_at',
    updatedAt: false,
    getterMethods: {}
  })

module.exports = auth_data
