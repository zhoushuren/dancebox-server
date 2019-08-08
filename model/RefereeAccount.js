/**
 * Author: Boxt.
 * Time: 2019/7/9.
 */

'use strict';

const sequelize = require('../config')
const Sequelize = require('sequelize')

const referee_account = sequelize.define('referee_account', {
        id: {
            type: Sequelize.INTEGER(10).UNSIGNED,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            field: "id"
        },
        username: {
            type: Sequelize.STRING(255),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "name"
        },
        avatar: {
            type: Sequelize.STRING(255),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "avatar"
        },
        algorithm: {
            type: Sequelize.STRING(255),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: "sha256",
            field: "algorithm"
        },
        salt: {
            type: Sequelize.STRING(255),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "salt"
        },
        password: {
            type: Sequelize.STRING(255),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "password"
        },
        referee_id: {
            type: Sequelize.INTEGER(10),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "referee_id"
        },
        activity_id: {
            type: Sequelize.INTEGER(10),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "activity_id"
        },
        status: {
            type: Sequelize.INTEGER(4),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: 0,
            field: "status"
        },
        offline: {
            type: Sequelize.INTEGER(4),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: 0,
            field: "offline"
        },
        created_at: {
            type: Sequelize.DATE,
            allowNull: true,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "created_at"
        },
        create_userid: {
            type: Sequelize.INTEGER(10).UNSIGNED,
            allowNull: true,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "create_userid"
        },
        update_userid: {
            type: Sequelize.INTEGER(10).UNSIGNED,
            allowNull: true,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "update_userid"
        }
    },
    {
        tableName: 'referee_account',
        createdAt: 'created_at',
        updatedAt: false,
        getterMethods: {}
    })

module.exports = referee_account