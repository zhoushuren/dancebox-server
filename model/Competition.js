/**
 * Author: Boxt.
 * Time: 2019/7/9.
 */

'use strict';

const sequelize = require('../config')
const Sequelize = require('sequelize')

const competition = sequelize.define('competition', {
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
        activity_id: {
            type: Sequelize.INTEGER(10),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "activity_id"
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
        win_number: {
            type: Sequelize.INTEGER(10),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "win_number"
        },
        referee_number: {
            type: Sequelize.INTEGER(10),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "referee_number"
        },
        grade_template_id: {
            type: Sequelize.INTEGER(10),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "grade_template_id"
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
        tableName: 'competition',
        createdAt: 'created_at',
        updatedAt: false,
        getterMethods: {}
    })

module.exports = competition