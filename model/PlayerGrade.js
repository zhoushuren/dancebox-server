/**
 * Author: Boxt.
 * Time: 2019/7/10.
 */

'use strict';

const sequelize = require('../config')
const Sequelize = require('sequelize')

const player_grade = sequelize.define('player_grade', {
        id: {
            type: Sequelize.INTEGER(10).UNSIGNED,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            field: "id"
        },
        player_id: {
            type: Sequelize.INTEGER(10),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "player_id"
        },
        number: {
            type: Sequelize.STRING(255),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "number"
        },
        activity_id: {
            type: Sequelize.INTEGER(10),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "activity_id"
        },
        competition_id: {
            type: Sequelize.INTEGER(10),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "competition_id"
        },
        competition_name: {
            type: Sequelize.STRING(255),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "competition_name"
        },
        project_id: {
            type: Sequelize.INTEGER(10),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "project_id"
        },
        project_name: {
            type: Sequelize.STRING(255),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "project_name"
        },
        group_id: {
            type: Sequelize.INTEGER(10),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "group_id"
        },
        group_name: {
            type: Sequelize.STRING(255),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "group_name"
        },
        criteria_id: {
            type: Sequelize.INTEGER(10),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "criteria_id"
        },
        criteria_name: {
            type: Sequelize.STRING(255),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "criteria_name"
        },
        referee_account_id: {
            type: Sequelize.INTEGER(10),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "referee_account_id"
        },
        referee_account_name: {
            type: Sequelize.STRING(255),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "referee_account_name"
        },
        score: {
            type: Sequelize.INTEGER(10),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "score"
        },
        weight: {
            type: Sequelize.INTEGER(10),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "weight"
        },
        status: {
            type: Sequelize.INTEGER(4),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: 0,
            field: "status"
        },
        scale_type: {
            type: Sequelize.INTEGER(4),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: 0,
            field: "scale_type"
        },
        rank_type: {
            type: Sequelize.INTEGER(4),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: 0,
            field: "rank_type"
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
        tableName: 'player_grade',
        createdAt: 'created_at',
        updatedAt: false,
        getterMethods: {}
    })

module.exports = player_grade