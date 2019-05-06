const sequelize = require('../config')
const Sequelize = require('sequelize')

const user = sequelize.define('user', {
    nick_name: {
      type: Sequelize.STRING
    },
    avatar: {
      type: Sequelize.STRING
    },
    gender: {
      type: Sequelize.NUMBER
    },
    country: {
      type: Sequelize.STRING
    },
    province: {
      type: Sequelize.STRING
    },
    city: {
      type: Sequelize.STRING
    },
    language: {
      type: Sequelize.STRING
    },
    status: {
      type: Sequelize.NUMBER
    }
  },
  {
    tableName: 'user',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    getterMethods: {}
  })

module.exports = user
