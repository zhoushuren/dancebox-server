const sequelize = require('../config')
const Sequelize = require('sequelize')

const community_comment = sequelize.define('community_comment', {
    post_id: {
      type: Sequelize.STRING
    },
    content: {
      type: Sequelize.STRING
    },
    user_name: {
      type: Sequelize.STRING
    },
    user_avatar: {
      type: Sequelize.STRING
    },
    status: {
      type: Sequelize.NUMBER
    },
    parent_id: {
      type: Sequelize.NUMBER
    },
    user_id: {
      type: Sequelize.NUMBER
    },
    up: {
      type: Sequelize.NUMBER
    },
    reply: {
        type: Sequelize.NUMBER
    },
    img: {
      type: Sequelize.STRING
    },
    other_user_name: {
      type: Sequelize.STRING
    }
  },
  {
    tableName: 'community_comment',
    createdAt: 'created_at',
    updatedAt: false,
    getterMethods: {}
  })

module.exports = community_comment
