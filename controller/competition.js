/**
 * Author: Boxt.
 * Time: 2019/7/9.
 */

'use strict';

const Activity = require('../model/Activity')
const Competition = require('../model/Competition')
const CompetitionGroup = require('../model/CompetitionGroup')
const Project = require('../model/Project')
const RefereeMapping = require('../model/RefereeAccountMapping')
const GradeTemplate = require('../model/GradeTemplate')
const GradeTemplateCriteria = require('../model/GradeTemplateCriteria')
const CONSTS = require('../config/constant')
const moment = require('moment')
const Sequelize = require('sequelize')
const sequelize = require('../config.js')
const Op = Sequelize.Op

exports.getCompetition = async function (ctx, next) {
    let { activity_id, referee_account_id } = ctx.token;
    let [ activity, competitions, referee_groups ] = await Promise.all([
        Activity.findOne({
            attributes: [
                'id', 'title',
                'start_time', 'end_time',
                'city', 'location'
            ],
            where: {
                // status: CONSTS.STATUS.ACTIVE,
                id: activity_id
            }
        }),
        Competition.findAll({
            attributes: [
                'id', 'name',
                'activity_id',
                // 'project_id', 'project_name',
                'referee_count', 'win_count',
                'grade_template_id'
            ],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                activity_id
            }
        }),
        RefereeMapping.findAll({
            attributes: [
                'id', 'group_id', 'status'
            ],
            where: {
                status: {
                    [Op.notIn]: [CONSTS.STATUS.DELETED, CONSTS.STATUS.STOPPED],
                },
                activity_id, referee_account_id
            }
        })
    ])

    if(!activity) {
        return ctx.body = {
            success: false,
            message: '活动不存在'
        }
    }
    if(!competitions || !competitions.length || !referee_groups || !referee_groups.length) {
        return ctx.body = {
            success: true,
            list: {
                id: activity.id,
                title: activity.title,
                start_time: moment(activity.start_time).format('YYYY/MM/DD'),
                end_time: moment(activity.end_time).format('YYYY/MM/DD'),
                city: activity.city,
                location: activity.location,
                dance_project: []
            }
        }
    }

    let group_ids = []
    let [referee_groups_obj, template_ids] = await Promise.all([
        referee_groups.reduce((result, group) => {
            group_ids.push(group.group_id)
            result[group.group_id] = {
                group_id: group.group_id,
                status: group.status
            }
            return result
        }, {}),
        competitions.reduce((result, com) => {
            result.add(com.grade_template_id)
            return result;
        }, new Set())
    ])
    template_ids = [...template_ids]
    let [groups, templates, criterias] = await Promise.all([
        CompetitionGroup.findAll({
            attributes: [
                'id', 'name',
                'competition_id',
                'interval'
            ],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                id: group_ids
            }
        }),
        GradeTemplate.findAll({
            attributes: [
                'id', 'name',
                'scale_type',
                'rank_type'
            ],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                id: template_ids
            }
        }),
        GradeTemplateCriteria.findAll({
            attributes: [
                'id', 'name',
                'grade_template_id',
                'weight'
            ],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                grade_template_id: template_ids
            }
        })
    ])

    let [competitions_obj, templates_obj, criterias_obj] = await Promise.all([
        competitions.reduce((result, c) => {
            result[c.id] = {
                id: c.id,
                name: c.name,
                win_count: c.win_count,
                referee_count: c.referee_count,
                template_id: c.grade_template_id
            }

            return result
        }, {}),
        templates.reduce((result, t) => {
            result[t.id] = {
                id: t.id,
                scale_type: t.scale_type,
                rank_type: t.rank_type
            }
            return result
        }, {}),
        criterias.reduce((result, c) => {
            if(!result[c.grade_template_id]) result[c.grade_template_id] = []
            result[c.grade_template_id].push({
                id: c.id,
                name: c.name,
                weight: c.weight
            })
            return result
        }, {}),
    ])

    let dance_project = groups.reduce((result, g) => {
        let competition_g = competitions_obj[g.competition_id]
        let group_g = referee_groups_obj[g.id]
        let templates_g = templates_obj[competition_g.template_id]
        let criterias_g = criterias_obj[templates_g.id]
        if(competition_g && group_g && templates_g && criterias_g) {
            try {
                g.interval = JSON.parse(g.interval)
                result.push({
                    id: competition_g.id,
                    name: competition_g.name,
                    group_id: g.id,
                    group_name: g.name,
                    referee_count: competition_g.referee_count,
                    win_count: competition_g.win_count,
                    player_number: [g.interval.min, g.interval.max],
                    status: group_g.status,
                    scale_type: templates_g.scale_type,
                    rank_type: templates_g.rank_type,
                    score: criterias_g
                })
            } catch (e) {
                console.error('parse competition group error', e)
            }

        }
        return result
    }, [])

    return ctx.body = {
        success: true,
        list: {
            id: activity.id,
            title: activity.title,
            start_time: moment(activity.start_time).format('YYYY/MM/DD'),
            end_time: moment(activity.end_time).format('YYYY/MM/DD'),
            city: activity.city,
            location: activity.location,
            dance_project
        }
    }
}

exports.getAllCompetition = async function (ctx, next) {
    let { activity_id } = ctx.query
    if (!activity_id) {
        return ctx.body = {
            success: false,
            message: '参数错误'
        }
    }

    let competitions = await Competition.findAll({
        attributes: [
            'id', 'name',
            'win_count', 'referee_count',
            'project_id',
            'grade_template_id', 'grade_template_name'
        ],
        where: {
            status: CONSTS.STATUS.ACTIVE,
            activity_id
        }
    })

    return ctx.body = {
        success: true,
        competitions
    }

}

exports.addCompetition = async function (ctx, next) {
    let admin_user_id = ctx.admin_user_id
    let {
        activity_id, project_id, name,
        win_count, referee_count,
        template_id, groups
    } = ctx.request.body
    win_count = +win_count
    referee_count = +referee_count
    if(isNaN(win_count) || isNaN(referee_count) || win_count < 1 || referee_count < 1) {
        return ctx.body = {
            success: false,
            message: '晋级人数或裁判人数至少为1人'
        }
    }

    let [activity, project, template, criterias] = await Promise.all([
        Activity.findOne({
            attributes: ['id', ['title', 'name']],
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
        GradeTemplate.findOne({
            attributes: ['id', 'name', 'scale_type', 'rank_type'],
            where: {
                // status: CONSTS.STATUS.ACTIVE,
                id: template_id
            }
        }),
        GradeTemplateCriteria.findAll({
            attributes: ['id', 'name', 'weight'],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                grade_template_id: template_id
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

    if(!template || !criterias || !criterias.length) {
        return ctx.body = {
            success: false,
            message: '评分模版不存在'
        }
    }

    let competition_id = -1;
    await sequelize.transaction((t) => {
        let competiton = {
            name, activity_id,
            project_id, project_name: project.name,
            win_count, referee_count,
            grade_template_id: template_id,
            grade_template_name: template.name,
            status: CONSTS.STATUS.ACTIVE,
            created_at: new Date(),
            create_userid: admin_user_id
        }
        return Competition.create(competiton, {transaction: t}).then((c) => {
            competition_id = c.get('id');
            if(competition_id && competition_id !== -1) {
                let competition_groups = groups.map((g) => {
                    return {
                        name: g.name,
                        activity_id, project_id,
                        competition_id,
                        interval: JSON.stringify({
                            min: g.min, max: g.max
                        }),
                        status: CONSTS.STATUS.ACTIVE,
                        created_at: new Date(),
                        create_userid: admin_user_id
                    }
                })
                return CompetitionGroup.bulkCreate(competition_groups, {transaction: t})
            }
        })
    })

    if(competition_id == -1) {
        return ctx.body = {
            success: false,
            message: '创建失败'
        }
    } else {
        return ctx.body = {
            success: true,
            competition_id
        }
    }

}

exports.updateCompetition = async function (ctx, next) {
    let admin_user_id = ctx.admin_user_id
    let competition_id = ctx.params.competition_id
    let {
        activity_id, project_id, name,
        win_count, referee_count,
        template_id, groups
    } = ctx.request.body
    win_count = +win_count
    referee_count = +referee_count
    if(isNaN(win_count) || isNaN(referee_count) || win_count < 1 || referee_count < 1) {
        return ctx.body = {
            success: false,
            message: '晋级人数或裁判人数至少为1人'
        }
    }

    let [activity, project, template, criterias] = await Promise.all([
        Activity.findOne({
            attributes: ['id', ['title', 'name']],
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
        GradeTemplate.findOne({
            attributes: ['id', 'name', 'scale_type', 'rank_type'],
            where: {
                // status: CONSTS.STATUS.ACTIVE,
                id: template_id
            }
        }),
        GradeTemplateCriteria.findAll({
            attributes: ['id', 'name', 'weight'],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                grade_template_id: template_id
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

    if(!template || !criterias || !criterias.length) {
        return ctx.body = {
            success: false,
            message: '评分模版不存在'
        }
    }

    await sequelize.transaction((t) => {
        let competiton = {
            name, activity_id, project_id, win_count, referee_count,
            grade_template_id: template_id,
            status: CONSTS.STATUS.ACTIVE,
            created_at: new Date(),
            create_userid: admin_user_id
        }
        return Competition.update(competiton, {
            where: {
                status: CONSTS.STATUS.ACTIVE,
                id: competition_id
            }
        }, {transaction: t}).then((c) => {
            let competition_groups = groups.map((g) => {
                return {
                    name: g.name,
                    activity_id, project_id,
                    competition_id,
                    interval: JSON.stringify({
                        min: g.min, max: g.max
                    }),
                    status: CONSTS.STATUS.ACTIVE,
                    created_at: new Date(),
                    create_userid: admin_user_id
                }
            })
            return CompetitionGroup.update({
                status: CONSTS.STATUS.DELETED,
                updated_at: new Date(),
                update_userid: admin_user_id
            }, {
                where: {
                    status: CONSTS.STATUS.ACTIVE,
                    activity_id, project_id,
                    competition_id
                }
            }, {transaction: t}).then(() => {
                return CompetitionGroup.bulkCreate(competition_groups, {transaction: t})
            })

        })
    })

    return ctx.body = {
        success: true
    }

}

exports.deleteCompetition = async function (ctx, next) {
    let admin_user_id = ctx.admin_user_id
    let {
        activity_id, competition_id
    } = ctx.params;

    await sequelize.transaction((t) => {
        return Promise.all([
            Competition.update({
                status: CONSTS.STATUS.DELETED,
                updated_at: new Date(),
                update_userid: admin_user_id
            }, {
                where: {
                    status: CONSTS.STATUS.ACTIVE,
                    id: competition_id,
                    activity_id
                }
            }, {transaction: t}),
            CompetitionGroup.update({
                status: CONSTS.STATUS.DELETED,
                updated_at: new Date(),
                update_userid: admin_user_id
            }, {
                where: {
                    status: CONSTS.STATUS.ACTIVE,
                    competition_id, activity_id
                }
            }, {transaction: t}),
        ])
    })

    return ctx.body = {
        success: true
    }

}

exports.getAllCompetitionGroups = async function (ctx, next) {
    let competition_id = ctx.params.competition_id

    let [competition, groups] = await Promise.all([
        Competition.findOne({
            attributes: [
                'id', 'name'
            ],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                id: competition_id
            }
        }),
        CompetitionGroup.findAll({
            attributes: [
                'id', 'name'
            ],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                competition_id
            }
        })
    ])

    if(!competition) {
        return ctx.body = {
            success: false,
            message: '赛制不存在'
        }
    }

    return ctx.body = {
        success: true,
        groups
    }

}