/**
 * Author: Boxt.
 * Time: 2019/7/17.
 */

'use strict';
const Player = require('../model/Player')
const Activity = require('../model/Activity')
const Project = require('../model/Project')
const Competition = require('../model/Competition')
const CompetitionGroup = require('../model/CompetitionGroup')
const CONSTS = require('../config/constant')
const Sequelize = require('sequelize')

exports.addPlayer = async function (ctx, next) {
    let admin_user_id = ctx.admin_user_id
    let {
        name, phone, number,
        project_id, activity_id,
        competition_id
    } = ctx.request.body
    if(!name || !phone || !number || !project_id || !competition_id) {
        return ctx.body = {
            success: false,
            message: '参数错误'
        }
    }

    if(isNaN(+phone)||(phone.length!=11)){
        return ctx.body = {
            success: false,
            message: '手机号码为11位数字！请正确填写！'
        }
    }

    let [activity, project, competition] = await Promise.all([
        Activity.findOne({
            attributes: ['id', 'name'],
            where: {
                // status: CONSTS.STATUS.ACTIVE,
                id: activity_id
            }
        }),
        Project.findOne({
            attributes: ['id', 'name'],
            where: {
                // status: CONSTS.STATUS.ACTIVE,
                id: project_id
            }
        }),
        Competition.findOne({
            attributes: ['id', 'name'],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                id: competition_id
            }
        })
    ])

    if(!activity) {
        return ctx.body = {
            success: false,
            message: '活动不存在'
        }
    }
    if(!project) {
        return ctx.body = {
            success: false,
            message: '项目不存在'
        }
    }
    if(!competition) {
        return ctx.body = {
            success: false,
            message: '赛制不存在'
        }
    }

    await Player.create({
        name, phone, number,
        activity_id, project_id,
        competition_id,
        project_name: project.name,
        competition_name: competition.name,
        status: CONSTS.STATUS.ACTIVE,
        created_at: new Date(),
        create_userid: admin_user_id
    })

    return ctx.body = {
        success: true
    }
}

exports.getAllPlayer = async function (ctx, next) {
    let { activity_id } = ctx.query
    let players = await Player.findAll({
        attributes: [
            'id', 'name', 'phone', 'number',
            'project_id', 'project_name',
            'competition_id', 'competition_name',
            'group_id', 'group_name'
        ],
        where: {
            status: CONSTS.STATUS.ACTIVE,
            activity_id
        }
    })

    return ctx.body = {
        success: true,
        players
    }
}

exports.checkPlayerNumber = async function (ctx, next) {
    let { number, activity_id, competition_id, project_id } = ctx.request.body

    let player = await Player.findOne({
        number, activity_id, competition_id, project_id,
        status: CONSTS.STATUS.ACTIVE
    })

    return ctx.body = {
        success: true,
        allow: Boolean(!player)
    }
}