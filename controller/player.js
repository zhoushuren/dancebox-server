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

    let [activity, project, competition, groups] = await Promise.all([
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
                id: competition_id,
                activity_id, project_id
            }
        }),
        CompetitionGroup.findAll({
            attributes: ['id', 'name', 'interval'],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                competition_id,
                activity_id, project_id
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
    if(!groups || !groups.length) {
        return ctx.body = {
            success: false,
            message: '赛制下无分组，请先添加分组！'
        }
    }

    let player_group = groups.reduce((result, g) => {
        try {
            g.interval = JSON.parse(g.interval)
            if(number < g.interval.max && number > g.interval.min) {
                result = {
                    group_id: g.id,
                    group_name: g.name
                }
            }
        } catch (e) {

        }
        return result
    }, {})

    if(!player_group.group_id) {
        return ctx.body = {
            success: false,
            message: '号码牌无对应分组区间，请检查后重试！'
        }
    }

    await Player.create({
        name, phone, number,
        activity_id, project_id,
        competition_id,
        group_id: player_group.group_id,
        group_name: player_group.group_name,
        project_name: project.name,
        competition_name: competition.name,
        status: CONSTS.STATUS.ACTIVE,
        created_at: new Date(),
        create_userid: admin_user_id
    })

    return ctx.body = {
        success: true,
        group_id: player_group.group_id,
        group_name: player_group.group_name
    }
}

exports.getPlayerById = async function (ctx, next) {
    let player_id = ctx.params.player_id

    let player = await Player.findOne({
        where: {
            id: player_id,
            status: CONSTS.STATUS.ACTIVE
        }
    })

    return ctx.body = {
        success: true,
        player
    }
}

exports.updatePlayerById = async function (ctx, next) {
    let admin_user_id = ctx.admin_user_id
    let player_id = ctx.params.player_id
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

    let [activity, project, competition, groups] = await Promise.all([
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
                id: competition_id,
                activity_id, project_id
            }
        }),
        CompetitionGroup.findAll({
            attributes: ['id', 'name', 'interval'],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                competition_id,
                activity_id, project_id
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
    if(!groups || !groups.length) {
        return ctx.body = {
            success: false,
            message: '赛制下无分组，请先添加分组！'
        }
    }

    let player_group = groups.reduce((result, g) => {
        try {
            g.interval = JSON.parse(g.interval)
            if(number < g.interval.max && number > g.interval.min) {
                result = {
                    group_id: g.id,
                    group_name: g.name
                }
            }
        } catch (e) {

        }
        return result
    }, {})

    if(!player_group.group_id) {
        return ctx.body = {
            success: false,
            message: '号码牌无对应分组区间，请检查后重试！'
        }
    }

    await Player.update({
        name, phone, number,
        activity_id, project_id,
        competition_id,
        group_id: player_group.group_id,
        group_name: player_group.group_name,
        project_name: project.name,
        competition_name: competition.name,
        status: CONSTS.STATUS.ACTIVE,
        updated_at: new Date(),
        update_userid: admin_user_id
    }, {
        where: {
            id: player_id,
            status: CONSTS.STATUS.ACTIVE
        }
    })

    return ctx.body = {
        success: true
    }
}

exports.deletePlayerById = async function (ctx, next) {
    let admin_user_id = ctx.admin_user_id
    let player_id = ctx.params.player_id

    await Player.update({
        status: CONSTS.STATUS.DELETED,
        updated_at: new Date(),
        update_userid: admin_user_id
    }, {
        where: {
            id: player_id,
            status: CONSTS.STATUS.ACTIVE
        }
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