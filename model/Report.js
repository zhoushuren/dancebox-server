const sequelize = require('../config')
const Sequelize = require('sequelize')

const community_post = sequelize.define('community_report', {
    item_id: {
      type: Sequelize.NUMBER
    },
    type: {
      type: Sequelize.NUMBER
    },
    report_type: {
      type: Sequelize.NUMBER
    }
  },
  {
    tableName: 'community_report',
    createdAt: 'created_at',
    updatedAt: false,
    getterMethods: {}
  })

module.exports = community_post
