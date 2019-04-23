const sequelize = require('../config')
const Sequelize = require('sequelize')

const community_comment = sequelize.define('community_comment', {
    _id: {
      type: Sequelize.NUMBER
    },
    type: {
      type: Sequelize.NUMBER
    },
    action: {
      type: Sequelize.STRING
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

module.exports = community_comment
