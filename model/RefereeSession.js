/**
 * Author: Boxt.
 * Time: 2019/7/9.
 */

'use strict';

const sequelize = require('../config')
const Sequelize = require('sequelize')

const referee_session = sequelize.define('referee_session', {
    referee_account_id: {
        type: Sequelize.INTEGER
    },
    session_token: {
        type: Sequelize.STRING
    },
    status: {
        type: Sequelize.INTEGER(4),
        allowNull: false,
        autoIncrement: false,
        primaryKey: false,
        defaultValue: 0,
        field: "status"
    }
},{
    tableName: 'referee_session',
    createdAt: 'created_at',
    updatedAt: false,
    getterMethods: {
    }
})


module.exports = referee_session