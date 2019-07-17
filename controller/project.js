/**
 * Author: Boxt.
 * Time: 2019/7/9.
 */

'use strict';

const Project = require('../model/Project')
const CONSTS = require('../config/constant')

exports.addProject = async function (ctx, next) {
    let admin_user_id = ctx.admin_user_id
    let { name, dance, unit_number } = ctx.request.body
    if(!name || !dance || !dance.length || !unit_number) {
        return ctx.body = {
            success: false,
            message: '参数错误'
        }
    }

    unit_number.max = +unit_number.max
    unit_number.min = +unit_number.min
    if(isNaN(unit_number.max) || isNaN(unit_number.min) || unit_number.min < 1 || unit_number.max < unit_number.min) {
        return ctx.body = {
            success: false,
            message: '参赛人数错误'
        }
    }

    await Project.create({
        name,
        dance: JSON.stringify(dance),
        unit_number: JSON.stringify(unit_number),
        status: CONSTS.STATUS.ACTIVE,
        created_at: new Date(),
        create_userid: admin_user_id
    })

    return ctx.body = {
        success: true
    }
}

exports.getAllProject = async function (ctx, next) {
    let projects = await Project.findAll({
        attributes: ['id', 'name'],
        where: {
            status: CONSTS.STATUS.ACTIVE
        }
    })

    return ctx.body = {
        success: true,
        projects
    }
}

exports.getProjectById = async function (ctx, next) {
    let project_id = ctx.params.project_id
    let project = await Project.findOne({
        attributes: ['id', 'name', 'dance', 'unit_number'],
        where: {
            status: CONSTS.STATUS.ACTIVE,
            id: project_id
        }
    })

    try {
        project.dance = JSON.parse(project.dance)
        project.unit_number = JSON.parse(project.unit_number)
    } catch (e) {
        return ctx.body = {
            success: false,
            message: '关联舞种或单位参赛人数解析错误'
        }
    }

    return ctx.body = {
        success: true,
        project
    }
}

exports.updateProjectById = async function (ctx, next) {
    let project_id = ctx.params.project_id
    let admin_user_id = ctx.admin_user_id
    let { name, dance, unit_number } = ctx.request.body

    if(!name || !dance || !dance.length || !unit_number) {
        return ctx.body = {
            success: false,
            message: '参数错误'
        }
    }

    unit_number.max = +unit_number.max
    unit_number.min = +unit_number.min
    if(isNaN(unit_number.max) || isNaN(unit_number.min) || unit_number.min < 1 || unit_number.max < unit_number.min) {
        return ctx.body = {
            success: false,
            message: '参赛人数错误'
        }
    }

    await Project.update({
        name,
        dance: JSON.stringify(dance),
        unit_number: JSON.stringify(unit_number),
        updated_at: new Date(),
        update_userid: admin_user_id
    }, {
        where: {
            status: CONSTS.STATUS.ACTIVE,
            id: project_id
        }
    })

    return ctx.body = {
        success: true
    }
}

exports.deleteProjectById = async function (ctx, next) {
    let project_id = ctx.params.project_id
    let admin_user_id = ctx.admin_user_id

    await Project.update({
        status: CONSTS.STATUS.DELETED,
        updated_at: new Date(),
        update_userid: admin_user_id
    }, {
        where: {
            status: CONSTS.STATUS.ACTIVE,
            id: project_id
        }
    })

    return ctx.body = {
        success: true
    }
}

