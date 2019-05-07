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
    },
    user_name: {
      type: Sequelize.STRING
    },
    user_avatar: {
      type: Sequelize.STRING
    },
    img_list: {
      type: Sequelize.STRING
    }
  },
  {
    tableName: 'community_post',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    getterMethods: {}
  })

module.exports = community_post
