const sequelize = require('../config')
const Sequelize = require('sequelize')

const topic = sequelize.define('community_topic', {
    name: {
      type: Sequelize.STRING
    },
    desc: {
      type: Sequelize.STRING
    },
    banner: {
      type: Sequelize.STRING
    },
    status: {
      type: Sequelize.STRING
    },
    sort: {
      type: Sequelize.NUMBER
    },
    post_count: {
      type: Sequelize.NUMBER
    },
    view_count: {
      type: Sequelize.NUMBER
    }
  },
  {
    tableName: 'community_topic',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    getterMethods: {}
  })

module.exports = topic
