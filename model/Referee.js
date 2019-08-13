/**
 * Author: Boxt.
 * Time: 2019/7/9.
 */

'use strict';

const sequelize = require('../config')
const Sequelize = require('sequelize')

const referee = sequelize.define('referee', {
        id: {
            type: Sequelize.INTEGER(10).UNSIGNED,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            field: "id"
        },
        name: {
            type: Sequelize.STRING(255),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "name"
        },
        gender: {
            type: Sequelize.INTEGER(4),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: 0,
            field: "gender"
        },
        avatar: {
            type: Sequelize.STRING(255),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            field: "avatar"
        },
        country: {
            type: Sequelize.STRING(255),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "country"
        },
        profile: {
            type: Sequelize.STRING(255),
            allowNull: true,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: '',
            field: "profile"
        },
        status: {
            type: Sequelize.INTEGER(4),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: 0,
            field: "status"
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
        tableName: 'referee',
        createdAt: 'created_at',
        updatedAt: false,
        getterMethods: {}
    })

module.exports = referee