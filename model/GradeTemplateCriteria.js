/**
 * Author: Boxt.
 * Time: 2019/7/10.
 */

'use strict';

const sequelize = require('../config')
const Sequelize = require('sequelize')

const grade_template_criteria = sequelize.define('grade_template_criteria', {
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
        grade_template_id: {
            type: Sequelize.INTEGER(10),
            allowNull: false,
            autoIncrement: false,
            primaryKey: false,
            defaultValue: null,
            field: "grade_template_id"
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
        tableName: 'grade_template_criteria',
        createdAt: 'created_at',
        updatedAt: false,
        getterMethods: {}
    })

module.exports = grade_template_criteria