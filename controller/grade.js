/**
 * Author: Boxt.
 * Time: 2019/7/10.
 */

'use strict';

const GradeTemplate = require('../model/GradeTemplate')
const GradeTemplateCriteria = require('../model/GradeTemplateCriteria')
const Competition = require('../model/Competition')
const CompetitionGroup = require('../model/CompetitionGroup')
const RefereeMapping = require('../model/RefereeAccountMapping')
const PlayerGrade = require('../model/PlayerGrade')
const Player = require('../model/Player')
const Activity = require('../model/Activity')
const CONSTS = require('../config/constant')
const sequelize = require('../config.js')

exports.saveGrade = async function (ctx, next) {
    let { activity_id, group_id, competition_id, score } = ctx.request.body
    let {referee_account_id, referee_account_name} = ctx.token
    // let referee_account_id =1
    // let referee_account_name = 'boxt'
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

    let [player_numbers, criteria_ids] = await Promise.all([
        score.map((s) => s.player_number),
        (score[0].criterias || []).map((c) => c.id)
    ])

    let [ referee_group, competition, group, players ] = await Promise.all([
        RefereeMapping.findOne({
            attributes: ['id', 'status'],
            where: {
                activity_id, competition_id, group_id,
                referee_account_id
            }
        }),
        Competition.findOne({
            attributes: ['id', 'name', 'grade_template_id', 'project_id', 'project_name'],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                activity_id,
                id: competition_id
            }
        }),
        CompetitionGroup.findOne({
            attributes: ['id', 'name'],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                activity_id, competition_id,
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
                activity_id ,competition_id, group_id
            }
        })
    ])

    if(!referee_group || referee_group.status == CONSTS.STATUS.DELETED) {
        return ctx.body = {
            success: false,
            message: "无此分组权限"
        }
    }

    if(referee_group.status == CONSTS.STATUS.SUBMITTED) {
        return ctx.body = {
            success: false,
            message: "已提交，不可再次提交"
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

    if(player_numbers.length !== players.length) {
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
                'id', 'name', 'weight'
            ],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                id: criteria_ids,
                grade_template_id: competition.grade_template_id
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
            result[c.id] = c
            return result
        }, {})
    ])
    let fail_player_numbers = [], success_player_count = 0
    let player_grades = score.reduce((result, s) => {
        let grade = {
            player_id: player_number_obj[s.player_number],
            number: s.player_number,
            activity_id, competition_id, group_id,
            competition_name: competition.name,
            project_id: competition.project_id,
            project_name: competition.project_name,
            group_name: group.name,
            referee_account_id,
            referee_account_name,
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
                grade_c.criteria_name = criteria_obj[grade_c.criteria_id].name
                grade_c.weight = criteria_obj[grade_c.criteria_id].weight
                grade_c.score = c.value * 100
                result.push(grade_c)
            })
        } else fail_player_numbers.push(s.player_number)
        return result
    }, [])

    await sequelize.transaction((t) => {
        return PlayerGrade.bulkCreate(player_grades, {transaction: t})
            .then(() => {
                return RefereeMapping.update({
                    status: CONSTS.STATUS.SUBMITTED
                }, {
                    where: {
                        id: referee_group.id
                    }
                }, {transaction: t})
            })
    })

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

    await sequelize.transaction((t) => {
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

exports.getAllGrades = async function (ctx, next) {
    let { activity_id, competition_id, group_id } = ctx.query

    let where = {
        competition_id, activity_id,
        status: CONSTS.STATUS.ACTIVE
    };
    if(+group_id >= 0) where.group_id = group_id;

    let promise_arr = [
        Activity.findOne({
            attributes: ['id', ['title', 'name']],
            where: {
                // status: CONSTS.STATUS.ACTIVE,
                id: activity_id
            }
        }),
        Competition.findOne({
            attributes: ['id', 'name', 'win_count'],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                id: competition_id,
                activity_id
            }
        })]
    if(where.group_id) {
        promise_arr.push(CompetitionGroup.findOne({
            attributes: ['id', 'name'],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                competition_id,
                activity_id
            }
        }))
    }

    let [activity, competition, group] = await Promise.all(promise_arr)

    if(!activity) {
        return ctx.body = {
            success: false,
            message: '活动不存在'
        }
    }
    if(!competition) {
        return ctx.body = {
            success: false,
            message: '赛制不存在'
        }
    }
    if(where.group_id && !group) {
        return ctx.body = {
            success: false,
            message: '赛制下无此分组'
        }
    }

    let player_grades = await PlayerGrade.findAll({
        attributes: [
            'player_id', 'number',
            'group_id', 'group_name',
            'referee_account_id', 'referee_account_name',
            'criteria_id', 'criteria_name',
            'score', 'weight', 'scale_type', 'rank_type'
        ],
        where,
        order: [['competition_id', 'asc'], ['group_id', 'asc'], ['number', 'desc']]
    });

    if(!player_grades.length) {
        return ctx.body = {
            success: true,
            player_grades: []
        }
    }

    let player_grades_criterias_obj = player_grades.reduce((result, pg) => {
        let key_name = pg.player_id + pg.referee_account_id
        if(!result[key_name]) {
            result[key_name] = {
                player_id: pg.player_id,
                number: pg.number,
                group_id: pg.group_id,
                group_name: pg.group_name,
                scale_type: pg.scale_type,
                bank_type: pg.bank_type,
                referee_account_id: pg.referee_account_id,
                referee_account_name: pg.referee_account_name,
                criterias: [{
                    id: pg.criteria_id,
                    name: pg.criteria_name,
                    score: pg.score/100,
                    weight: pg.weight
                }]
            }
        } else {
            result[key_name].criterias.push({
                criteria_id: pg.criteria_id,
                criteria_name: pg.criteria_name,
                score: pg.score/100,
                weight: pg.weight
            })
        }
        return result
    }, {})

    let player_grades_obj = Object.keys(player_grades_criterias_obj)
        .reduce((result, key_name) => {
            let grade = player_grades_criterias_obj[key_name]
            grade.score = grade.criterias.reduce((r, c) => {
                r += (c.score * c.weight / 100)
                return r
            }, 0)
            if(!result[grade.player_id]) {
                result[grade.player_id] = {
                    player_id: grade.player_id,
                    number: grade.number,
                    group_id: grade.group_id,
                    group_name: grade.group_name,
                    scale_type: grade.scale_type,
                    bank_type: grade.bank_type,
                    total_score: grade.score,
                    referees: [{
                        id: grade.referee_account_id,
                        name: grade.referee_account_name,
                        criterias: grade.criterias
                    }]
                }
            } else {
                result[grade.player_id].referees.push({
                    id: grade.referee_account_id,
                    name: grade.referee_account_name,
                    criterias: grade.criterias
                })
            }
            return result
    }, {})

    let player_grades_arr = Object.keys(player_grades_obj)
        .map((key_name) => {
            return player_grades_obj[key_name]
    })

    let rank_player_grades = player_grades_arr.sort(function (a,b) {
            return b.score - a.score
    })

    rank_player_grades = rank_player_grades.map((r, index) => {
        r.is_win = competition.win_count > index ? true : false
        return r
    })
    return ctx.body = {
        success: true,
        player_grades: rank_player_grades
    }

}
