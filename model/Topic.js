const sequelize = require('../config')
const Sequelize = require('sequelize')

const topic = sequelize.define('community_topic', {
    name: {
      type: Sequelize.STRING
    },
    banner: {
      type: Sequelize.STRING
    },
    status: {
      type: Sequelize.STRING
    }
  },
  {
    tableName: 'community_topic',
    createdAt: 'created_at',
    updatedAt: false,
    getterMethods: {}
  })

module.exports = topic
