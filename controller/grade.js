/**
 * Author: Boxt.
 * Time: 2019/7/10.
 */

'use strict';

const GradeTemplate = require('../model/GradeTemplate')
const GradeTemplateCriteria = require('../model/GradeTemplateCriteria')
const CompetitionGroup = require('../model/CompetitionGroup')
const RefereeMapping = require('../model/RefereeAccountMapping')
const PlayerGrade = require('../model/PlayerGrade')
const Player = require('../model/Player')
const CONSTS = require('../config/constant')
const Sequelize = require('sequelize')

exports.saveGrade = async function (ctx, next) {
    let { activity_id, group_id, competiton_id, score } = ctx.request.body
    let referee_account_id = ctx.token.referee_account_id
    if(activity_id !== ctx.token.activity_id) {
        return ctx.body = {
            success: false,
            message: "无此活动权限"
        }
    }

    if(!score || !score.length) {
        return ctx.body = {
            success: false,
            message: "评分项错误"
        }
    }

    let [play_numbers, criteria_ids] = await Promise.all([
        score.map((s) => s.player_number),
        (score[0].criterias || []).map((c) => c.id)
    ])

    let [ referee_group, competition, group, players ] = await Promise.all([
        RefereeMapping.findOne({
            attributes: ['id', 'status'],
            where: {
                status: {
                    $notIn: [CONSTS.STATUS.DELETED, CONSTS.STATUS.STOPPED]
                },
                activity_id, competiton_id, group_id,
                id: referee_account_id
            }
        }),
        Competition.findOne({
            attributes: ['id', 'grade_template_id', 'project_id'],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                activity_id,
                id: competiton_id
            }
        }),
        CompetitionGroup.findOne({
            attributes: ['id'],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                activity_id, competiton_id,
                id: group_id
            }
        }),
        Player.findAll({
            attributes: [
                'id', 'number'
            ],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                number: player_numbers,
                activity_id ,competiton_id, group_id
            }
        })
    ])

    if(!referee_group) {
        return ctx.body = {
            success: false,
            message: "无此分组权限"
        }
    }

    if(referee_group.status == CONSTS.STATUS.COMPLETED ||
        referee_group.status == CONSTS.STATUS.SUBMITTED ) {
        return ctx.body = {
            success: false,
            message: "已提交数据，不可再次修改"
        }
    }

    if(!competition) {
        return ctx.body = {
            success: false,
            message: "赛制不存在"
        }
    }

    if(!group) {
        return ctx.body = {
            success: false,
            message: "分组不存在"
        }
    }

    if(play_numbers.length !== players.length) {
        return ctx.body = {
            success: false,
            message: "号码牌不存在"
        }
    }

    let [template, criterias] = await Promise.all([
        GradeTemplate.findOne({
            attributes: ['scale_type', 'rank_type'],
            where: {
                id: competition.grade_template_id,
                status: CONSTS.STATUS.ACTIVE,
            }
        }),
        GradeTemplateCriteria.findAll({
            attributes: [
                'id', 'weight'
            ],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                id: criteria_ids,
                grade_template_id: template.id
            }
        })
    ])

    if(!template) {
        return ctx.body = {
            success: false,
            message: "评分模版不存在"
        }
    }

    if(criterias.length !== criteria_ids.length) {
        return ctx.body = {
            success: false,
            message: "评分项id错误"
        }
    }

    let [player_number_obj, criteria_obj] = await Promise.all([
        players.reduce((result, p) => {
            result[p.number] = p.id
            return result
        }, {}),
        criterias.reduce((result, c) => {
            result[c.id] = c.weight
            return result
        }, {})
    ])
    let fail_player_numbers = [], success_player_count = 0
    let player_grades = score.reduce((result, s) => {
        let grade = {
            player_id: player_number_obj[s.player_number],
            number: s.player_number,
            activity_id, competiton_id, group_id,
            project_id: referee_group.project_id,
            scale_type: template.scale_type,
            rank_type: template.rank_type,
            status: CONSTS.STATUS.ACTIVE,
            created_at: new Date(),
            create_userid: referee_account_id
        }

        if(s.criterias.length == criteria_ids.length) {
            success_player_count ++
            s.criterias.map((c) => {
                let grade_c = Object.assign({}, grade)
                grade_c.criteria_id = c.id
                grade_c.weight = criteria_obj[grade_c.criteria_id]
                result.push(grade_c)
            })
        } else fail_player_numbers.push(s.player_number)
        return result
    }, [])

    await Promise.all([
        RefereeMapping.update({
            status: CONSTS.STATUS.SUBMITTED
        }, {
            where: {
                id: referee_group.id
            }
        }),
        PlayerGrade.bulkcreate(player_grades)
    ])

    return ctx.body = {
        success: true,
        success_player_count, fail_player_numbers
    }
}

exports.getAllTemplate = async function (ctx, next) {
    let [grade_templates, criterias] = await Promise.all([
        GradeTemplate.findAll({
            attributes: ['id', 'name', 'scale_type', 'rank_type'],
            where: {
                status: CONSTS.STATUS.ACTIVE
            }
        }),
        GradeTemplateCriteria.findAll({
            attributes: ['id', 'name', 'grade_template_id', 'weight'],
            where: {
                status: CONSTS.STATUS.ACTIVE
            }
        })
    ])

    let criterias_obj = criterias.reduce((result, c) => {
        if(!result[c.grade_template_id]) result[c.grade_template_id] = []
        result[c.grade_template_id].push({
            id: c.id, name: c.name, weight: c.weight
        })
        return result
    }, {})

    let templates = grade_templates.map((g) => {
        return {
            id: g.id, name: g.name,
            scale_type: g.scale_type,
            rank_type: g.rank_type,
            criterias: criterias_obj[g.id] || []
        }
    })

    return ctx.body = {
        success: true,
        templates
    }

}

exports.deleteTemplateById = async function (ctx, next) {
    let template_id = ctx.params.template_id
    let admin_user_id = ctx.admin_user_id
    let delete_obj = {
        status: CONSTS.STATUS.DELETED,
        updated_at: new Date(),
        update_userid: admin_user_id
    }
    await Promise.all([
        GradeTemplate.update(delete_obj, {
            where: {
                id: template_id,
                status: CONSTS.STATUS.ACTIVE
            }
        }),
        GradeTemplateCriteria.update(delete_obj, {
            where: {
                grade_template_id: template_id,
                status: CONSTS.STATUS.ACTIVE
            }
        })
    ])
    return ctx.body = {
        success: true
    }

}

exports.addTemplate = async function (ctx, next) {
    let admin_user_id = ctx.admin_user_id
    let { name, scale_type, rank_type, criterias } = ctx.request.body
    scale_type = +scale_type
    rank_type = isNaN(+rank_type) ? 1 : +rank_type
    if(!name || isNaN(scale_type) || isNaN(rank_type) || !criterias || !criterias.length) {
        return ctx.body = {
            success: false,
            message: '参数错误'
        }
    }

    let template_id = -1
    await Sequelize.transaction((t) => {
        return GradeTemplate.create({
            name, scale_type, rank_type,
            status: CONSTS.STATUS.ACTIVE,
            created_at: new Date(),
            create_userid: admin_user_id
        }, {transaction: t}).then((g) => {
            template_id = g.get('id')
            if(template_id && template_id !== -1) {
                let criterias_arr = criterias.reduce((result, c) => {
                    if(c && c.weight >= 0 && c.name) {
                        result.push({
                            name: c.name,
                            weight: c.weight,
                            grade_template_id: template_id,
                            status: CONSTS.STATUS.ACTIVE,
                            created_at: new Date(),
                            create_userid: admin_user_id
                        })
                    }
                    return result
                }, [])
                return GradeTemplateCriteria.bulkCreate(criterias_arr, {transaction: t})
            }
        })
    })

    if(template_id == -1) {
        return ctx.body = {
            success: false,
            message: '创建失败'
        }
    } else {
        return ctx.body = {
            success: true,
            template_id
        }
    }

}