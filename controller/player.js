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
const file = require('../controller/file');
const CONSTS = require('../config/constant')
const Excel = require('exceljs');

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
            if(number <= g.interval.max && number >= g.interval.min) {
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

exports.uploadPlayers = async function (ctx, next) {
    let admin_user_id = ctx.admin_user_id
    let {
        project_id, activity_id,
        competition_id
    } = ctx.request.body
    if(!project_id || !competition_id) {
        return ctx.body = {
            success: false,
            message: '参数错误'
        }
    }

    let [activity, project, competition, groups] = await Promise.all([
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

    const filePath = await file.getPlayerFilePath(ctx);
    if(!filePath) return ctx.body = {
        success: false,
        message: '文件上传错误'
    }

    let playersArr = await getPlayerFromFile(filePath);

    let { failPlayers, players } = await playersArr.reduce((result, player) => {
        if(!result.players) result.players = [];
        if(!result.failArr) result.failArr = [];
        let player_group = groups.reduce((result, g) => {
            try {
                g.interval = JSON.parse(g.interval)
                if( player.number <= g.interval.max &&
                    player.number >= g.interval.min ) {
                    result = {
                        group_id: g.id,
                        group_name: g.name
                    }
                }
            } catch (e) { }
            return result
        }, {});
        if(!player_group.group_id) {
            failPlayers.push({
                name: player.name,
                number: player.number,
                phone: player.phone,
                message: '号码牌无对应分组区间，请检查后重试！'
            });
        }
        players.push({
            name: player.name,
            number: player.number,
            phone: player.phone,
            activity_id, project_id,
            competition_id,
            group_id: player_group.group_id,
            group_name: player_group.group_name,
            project_name: project.name,
            competition_name: competition.name,
            status: CONSTS.STATUS.ACTIVE,
            created_at: new Date(),
            create_userid: admin_user_id
        });
    }, {});
    await Player.bulkCreate(players);

    return ctx.body = {
        success: true,
        failPlayers
    }
}

function getPlayerFromFile(filePath) {
    return new Promise((resolve, reject) => {
        let players = [];
        const workbook = new Excel.Workbook();
        workbook.xlsx.readFile(filePath).then(function() {
            const worksheet = workbook.getWorksheet(1);
            worksheet.eachRow((row, rowNumber) => {
                if(rowNumber > 1) {
                    let name = row.values[1];
                    let phone = row.values[2];
                    let number = row.values[3];
                    if(name && phone && number) {
                        players.push({
                            name, phone, number
                        });
                    }
                }
            });
            resolve(players);
        });
    })
}

exports.getPlayerById = async function (ctx, next) {
    let player_id = ctx.params.player_id

    let player = await Player.findOne({
        attributes: [
            'id', 'name', 'phone', 'number',
            'activity_id', 'project_id', 'project_name',
            'competition_id', 'competition_name',
            'group_id', 'group_name'
        ],
        where: {
            id: player_id,
            status: CONSTS.STATUS.ACTIVE
        }
    })

    if(!player) {
        return ctx.body = {
            success: false,
            message: '选手不存在'
        }
    }

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
    if(!activity_id || isNaN(+activity_id)) {
        return ctx.body = {
            success: false,
            message: '参数错误'
        }
    }
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
        where: {
            number, activity_id, competition_id, project_id,
            status: CONSTS.STATUS.ACTIVE
        }
    })

    return ctx.body = {
        success: true,
        allow: Boolean(!player)
    }
}