const sequelize = require('../config')
const Sequelize = require('sequelize')

const community_post = sequelize.define('community_post', {
    topic_id: {
      type: Sequelize.STRING
    },
    topic_name: {
      type: Sequelize.STRING
    },
    title: {
      type: Sequelize.STRING
    },
    content: {
      type: Sequelize.STRING
    },
    up: {
      type: Sequelize.NUMBER
    },
    comment: {
      type: Sequelize.NUMBER
    },
    user_id: {
      type: Sequelize.NUMBER
    }
  },
  {
    tableName: 'user',
    createdAt: 'created_at',
    updatedAt: false,
    getterMethods: {}
  })

module.exports = community_post
