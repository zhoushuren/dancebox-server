const sequelize = require('../config')
const Sequelize = require('sequelize')

const community_comment = sequelize.define('community_message', {
    _id: {
      type: Sequelize.NUMBER
    },
    type: {
      type: Sequelize.STRING
    },
    from_user_id: {
      type: Sequelize.NUMBER
    },
    to_user_id: {
      type: Sequelize.NUMBER
    },
    from_user_name: {
      type: Sequelize.STRING
    },
    from_user_avatar: {
      type: Sequelize.STRING
    },
    from_content: {
      type: Sequelize.STRING
    },
    content: {
      type: Sequelize.STRING
    },
    send_time: {
      type: Sequelize.NUMBER
    }
  },
  {
    tableName: 'community_message',
    createdAt: 'created_at',
    updatedAt: false,
    getterMethods: {}
  })

module.exports = community_comment
