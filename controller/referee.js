/**
 * Author: Boxt.
 * Time: 2019/7/8.
 */

'use strict';
const Referee = require('../model/Referee')
const RefereeAccount = require('../model/RefereeAccount')
const RefereeAccountMapping = require('../model/RefereeAccountMapping')
const RefereeSession = require('../model/RefereeSession')
const Activity = require('../model/Activity')
const Project = require('../model/Project')
const Competition = require('../model/Competition')
const CompetitionGroup = require('../model/CompetitionGroup')
const sha256 = require('sha256')
const randomstring = require('randomstring')
const CONSTS = require('../config/constant')
const Sequelize = require('sequelize')
const sequelize = require('../config.js')

exports.login = async function (ctx) {
    let { username, password } = ctx.request.body
    if( !username || !password) {
        return ctx.body = {
            message: "用户名或密码错误",
            success: false
        }
    }

    let account = await RefereeAccount.findOne({
        where:{
            username,
            status: CONSTS.STATUS.ACTIVE
        }})
    if(!account){
        return ctx.body = {
            success: false,
            error: '用户不存在'
        }
    }
    let _password = signPassword(account.dataValues.algorithm, account.dataValues.salt,password)

    if( _password !== account.dataValues.password){
        return ctx.body = {
            success: false,
            message: "密码错误"
        }
    }
    let session_token =  randomstring.generate(32)

    try{
        let result = await RefereeSession.update({
            session_token,
            status: CONSTS.STATUS.ACTIVE
        }, {
            where: {
                referee_account_id: account.dataValues.id
            }
        })
        if(!result[0]) {
            await RefereeSession.create({
                session_token,
                status: CONSTS.STATUS.ACTIVE,
                referee_account_id: account.dataValues.id,
                created_at: new Date()
            })
        }
        let offline = account.offline ? true : false
        return ctx.body = {
            success: true,
            session_token, username, offline,
            avatar: account.avatar
        }
    }catch (e){
        console.error(e)
        return ctx.body = {
            success: false
        }
    }
}

exports.addRefereeAccount = async function (ctx, next) {
    let { username, password, referee_id, activity_id, project_id, competition_id, group_ids } = ctx.request.body

    let [activity, project, competition, groups, referee] = await Promise.all([
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
                activity_id, project_id,
                id: group_ids
            }
        }),
        Referee.findOne({
            attributes: ['id', 'name', 'avatar'],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                id: referee_id
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
    if(!groups || !groups.length || groups.length !== group_ids.length) {
        return ctx.body = {
            success: false,
            message: '赛制分组id不合法'
        }
    }
    if(!referee) {
        return ctx.body = {
            success: false,
            message: '裁判不存在'
        }
    }

    let admin_user_id = ctx.admin_user_id
    const algorithm = 'sha256'
    const salt = randomstring.generate(32)
    const _password  = signPassword(algorithm,salt,password)

    await sequelize.transaction((t) => {
        return RefereeAccount.create({
            username, referee_id,
            avatar: referee.avatar,
            activity_id, project_id,competition_id,
            password: _password,
            algorithm, salt,
            status: CONSTS.STATUS.ACTIVE,
            created_at: new Date(),
            create_userid: admin_user_id
        }, { transaction: t }).then((re) => {
            let referee_account_id = re.get('id')
            let mappings = groups.map((g) => {
                return {
                    referee_account_id,
                    referee_id: referee.id,
                    referee_name: referee.name,
                    activity_id, project_id, competition_id,
                    group_id: g.id,
                    group_name: g.name,
                    status: CONSTS.STATUS.ACTIVE,
                    created_at: new Date(),
                    create_userid: admin_user_id
                }
            })
            return RefereeAccountMapping.bulkCreate(mappings)
        })
    })


    return ctx.body = {
        success: true
    }
}

exports.updateRefereeAccount = async function (ctx, next) {
    let { offline } = ctx.request.body
    let {referee_account_id } = ctx.token
    if(offline!== 0 && offline !== 1) {
        return ctx.body = {
            success: false,
            error: '参数错误'
        }
    }

    let account = await RefereeAccount.findOne({
        where:{
            id: referee_account_id,
            status: CONSTS.STATUS.ACTIVE
        }
    })
    if(!account){
        return ctx.body = {
            success: false,
            error: '用户不存在'
        }
    }

    await RefereeAccount.update({
        offline
    }, {
        where: {
            id: referee_account_id,
            status: CONSTS.STATUS.ACTIVE
        }
    })

    return ctx.body = {
        success: true
    }
}

exports.getRefereeAccount = async function (ctx, next) {
    let { activity_id } = ctx.query
    if(!activity_id || isNaN(+activity_id)) {
        return ctx.body = {
            success: false,
            message: '活动id错误'
        }
    }

    let [accounts, mappings] = await Promise.all([
        RefereeAccount.findAll({
            attributes: [
                'id', 'username'
            ],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                activity_id
            }
        }),
        RefereeAccountMapping.findAll({
            attributes: [
                'referee_account_id', 'project_id',
                'referee_id', 'referee_name',
                'group_id', 'group_name'
            ],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                activity_id
            }
        })
    ])

    let referee_accounts_obj = {}
    let [accounts_obj, mappings_obj] = await Promise.all([
        accounts.reduce((result, a) => {
            result[a.id] = a.username
            return result
        }, {}),
        mappings.reduce((result, m) => {
            if(!result[m.referee_account_id]) result[m.referee_account_id] = []
            referee_accounts_obj[m.referee_account_id] = {
                project_id: m.project_id,
                referee_id: m.referee_id,
                referee_name: m.referee_name
            }
            result[m.referee_account_id].push({
                group_id: m.group_id,
                group_name: m.group_name
            })
            return result
        }, {})
    ])

    let referee_accounts = Object.keys(mappings_obj).map((referee_account_id) => {
        return {
            id: referee_account_id,
            username: accounts_obj[referee_account_id],
            project_id: referee_accounts_obj[referee_account_id].project_id,
            referee_id: referee_accounts_obj[referee_account_id].referee_id,
            referee_name: referee_accounts_obj[referee_account_id].referee_name,
            groups: mappings_obj[referee_account_id]
        }
    })

    return ctx.body = {
        success: true,
        referee_accounts
    }
}

exports.deleteRefereeAccountById = async function (ctx, next) {
    let admin_user_id = ctx.admin_user_id
    let referee_account_id = ctx.params.referee_account_id

    await sequelize.transaction((t) => {
        return Promise.all([
            RefereeAccount.update({
                status: CONSTS.STATUS.DELETED,
                updated_at: new Date(),
                update_userid: admin_user_id
            }, {
                where: {
                    status: CONSTS.STATUS.ACTIVE,
                    id: referee_account_id
                }
            }, {transaction: t}),
            RefereeAccountMapping.update({
                status: CONSTS.STATUS.DELETED,
                updated_at: new Date(),
                update_userid: admin_user_id
            }, {
                where: {
                    status: CONSTS.STATUS.ACTIVE,
                    referee_account_id
                }
            }, {transaction: t})
        ])
    })

    return ctx.body = {
        success: true
    }
}

exports.getAllReferee = async function (ctx) {
    let { pageIndex, pageSize } = ctx.query
    pageIndex = isNaN(+pageIndex) ? 1 : +pageIndex
    pageSize = isNaN(+pageSize) ? 10 : +pageSize
    let offset = (pageIndex - 1) * pageSize
    let [referees, count] = await Promise.all([
        Referee.findAll({
            attributes: ['id', 'name', 'gender', 'avatar', 'country'],
            where: {
                status: CONSTS.STATUS.ACTIVE
            },
            limit: pageSize,
            offset
        }),
        Referee.findAll({
            attributes: [
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
            ],
            where: {
                status: CONSTS.STATUS.ACTIVE
            }
        })
    ])

    count = count[0].dataValues.count
    return ctx.body = {
        success: true,
        referees,
        paging: {
            pageIndex, pageSize,
            totalCount: count,
            totalPage: Math.ceil(count / pageSize)
        }
    }
}

exports.addReferee = async function (ctx, next) {
    let admin_user_id = ctx.admin_user_id
    let { name, gender, avatar, country, profile } = ctx.request.body
    gender = +gender
    if(!name || isNaN(gender) || !avatar || !country) {
        return ctx.body = {
            success: false,
            message: '参数错误'
        }
    }

    await Referee.create({
        name, gender, avatar, country,
        profile: profile || '',
        status: CONSTS.STATUS.ACTIVE,
        created_at: new Date(),
        create_userid: admin_user_id
    })

    return ctx.body = {
        success: true
    }
}

exports.updateReferee = async function (ctx, next) {
    let referee_id = ctx.params.referee_id
    let admin_user_id = ctx.admin_user_id
    let { name, gender, avatar, country, profile } = ctx.request.body
    gender = +gender
    if(!name || isNaN(gender) || !avatar || !country) {
        return ctx.body = {
            success: false,
            message: '参数错误'
        }
    }

    let update = await Promise.all([
        Referee.update({
            name, gender, avatar, country,
            profile: profile || '',
            updated_at: new Date(),
            update_userid: admin_user_id
        }, {
            where: {
                id: referee_id,
                status: CONSTS.STATUS.ACTIVE
            }
        }),
        RefereeAccount.update({
            avatar
        }, {
            where: {
                status: CONSTS.STATUS.ACTIVE,
                referee_id
            }
        })
    ])

    // if(!update || !update[0] || !update[0][0]) {
    //     return ctx.body = {
    //         success: false,
    //         message: '裁判不存在'
    //     }
    // } else {
    //     return ctx.body = {
    //         success: true
    //     }
    // }

    return ctx.body = {
        success: true
    }


}

exports.getRefereeById = async function (ctx) {
    let referee_id = ctx.params.referee_id
    let referee = await Referee.findOne({
        attributes: ['id', 'name', 'gender', 'avatar', 'country', 'profile'],
        where: {
            status: CONSTS.STATUS.ACTIVE,
            id: referee_id
        }
    })

    if(!referee) {
        return ctx.body = {
            success: false,
            message: '裁判不存在'
        }
    } else {
        return ctx.body = {
            success: true,
            referee
        }
    }
}

exports.deleteRefereeById = async function (ctx) {
    let referee_id = ctx.params.referee_id
    let admin_user_id = ctx.admin_user_id
    let delete_obj = {
        status: CONSTS.STATUS.DELETED,
        updated_at: new Date(),
        update_userid: admin_user_id
    }
    await Promise.all([
        Referee.update(delete_obj, {
            where: {
                status: CONSTS.STATUS.ACTIVE,
                id: referee_id
            }
        }),
        RefereeAccount.update(delete_obj, {
            where: {
                status: CONSTS.STATUS.ACTIVE,
                referee_id
            }
        })
    ])

    return ctx.body = {
        success: true
    }
}

function signPassword(algorithm,salt,password) {
    if(algorithm === 'sha256') {
        return sha256(salt + password)
    }
}