/**
 * Author: Boxt.
 * Time: 2019/8/8.
 */

'use strict';

const Project = require('../model/Project');
const Referee = require('../model/Referee');
const RefereeAccount = require('../model/RefereeAccount');
const RefereeMapping = require('../model/RefereeAccountMapping');
const GradeTemplate = require('../model/GradeTemplate');
const GradeTemplateCriteria = require('../model/GradeTemplateCriteria');
const Competition = require('../model/Competition');
const CompetitionGroup = require('../model/CompetitionGroup');
const PlayerGrade = require('../model/PlayerGrade');
const Player = require('../model/Player');
const Activity = require('../model/Activity');
const CONSTS = require('../config/constant');
const XLSX = require('xlsx');
const fs = require('fs');
const sha256 = require('sha256');
const randomstring = require('randomstring');

function getNameObj(data) {
    return data.reduce((result, d) => {
        result[d.name] = d.id;
        return result;
    }, {});
}

function signPassword(algorithm,salt,password) {
    if(algorithm === 'sha256') {
        return sha256(salt + password)
    }
}

async function getActivityId() {
    let activity = await Activity.findOne({
        attributes: ['id', 'name'],
        where: {
            status: CONSTS.STATUS.ACTIVE
        },
        orderBy: [['end_time', 'desc']]
    });
    if(!activity) {
        console.log('--------------------------- 获取活动失败 ---------------------------');
        process.exit(0);
        return false;
    }
    console.log('----------------------------- 获取活动 -----------------------------');
    console.log(`--------- 活动id：${activity.id} 活动名称：${activity.name} ---------`);
}

function createProject(projects) {
    return Project.bulkCreate(projects);
}

function createReferee(referees) {
    return Referee.bulkCreate(referees);
}

async function createRefereeAccount(accounts, refereeMappings, proNames, comNames, refereeNames, reAcNames) {
    const [ pros, coms, referees ] = await Promise.all([
        Project.findAll({
            attributes: ['id', 'name'],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                name: proNames
            }
        }),
        Competition.findAll({
            attributes: ['id', 'name'],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                name: comNames
            }
        }),
        Referee.findAll({
            attributes: ['id', 'name', 'avatar'],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                name: refereeNames
            }
        })
    ]);

    const [ prosObj, comsObj, refereesObj, comGroups ] = await Promise.all([
        getNameObj(pros),
        getNameObj(coms),
        referees.reduce((result, r) => {
            result[r.name] = {
                id: r.id,
                avatar: r.avatar
            };
            return result;
        }, {}),
        CompetitionGroup.findAll({
            attributes: ['id', 'name', 'competition_id'],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                competition_id: coms.map((c) => c.id)
            }
        }),
    ]);

    let createAccounts = accounts.map((a) => {
        a.referee_id = refereesObj[a.reName].id;
        a.avatar = refereesObj[a.reName].avatar;
        a.project_id = prosObj[a.proName];
        return a;
    });
    await RefereeAccount.bulkCreate(createAccounts);
    if(refereeMappings && refereeMappings.length) {
        let reAcs = await RefereeAccount.findAll({
            attributes: ['id', 'name'],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                name: reAcNames
            }
        });
        let comGroupsObj = comGroups.reduce((result, g) => {
            result[g.competition_id + '_' + g.name] = g.id;
            return result;
        }, {});

        let reAcsObj = reAcs.reduce((result, a) => {
            result[a.dataValues.name] = a.dataValues.id;
            return result;
        }, {});
        let createMappings = refereeMappings.map((r) => {
            r.referee_account_id = reAcsObj[r.reAcName];
            r.referee_id = refereesObj[r.referee_name].id;
            r.project_id = prosObj[r.proName]
            r.competition_id = comsObj[r.comName];
            r.group_id = comGroupsObj[r.competition_id + '_' + r.group_name];
            return r;
        });
        await RefereeMapping.bulkCreate(createMappings);
    }
}

async function createTemplate(templates, criterias, templateNames) {
    await GradeTemplate.bulkCreate(templates);
    if(criterias && criterias.length) {
        let createTemplates = await GradeTemplate.findAll({
            attributes: ['id', 'name'],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                name: templateNames
            }
        });
        let templatesObj = getNameObj(createTemplates);
        let createCriterias = criterias.map((c) => {
            c.grade_template_id = templatesObj[c.temName];
            // delete c.temName;
            return c;
        });
        await GradeTemplateCriteria.bulkCreate(createCriterias);
    }
}

async function createCompetition(competitions, groups, competitionNames, projectNames, templateNames) {
    const [ pros, tems ] = await Promise.all([
        Project.findAll({
            attributes: ['id', 'name'],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                name: projectNames
            }
        }),
        GradeTemplate.findAll({
            attributes: ['id', 'name'],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                name: templateNames
            }
        })
    ]);

    const [ prosObj, temsObj ] = await Promise.all([
        getNameObj(pros),
        getNameObj(tems)
    ]);

    let createCompetitions = competitions.map((c) => {
        c.project_id = prosObj[c.project_name];
        c.grade_template_id = temsObj[c.grade_template_name];
        return c;
    });
    await Competition.bulkCreate(createCompetitions);
    if(groups && groups.length) {
        let coms = Competition.findAll({
            attributes: ['id', 'name'],
            where: {
                status: CONSTS.STATUS.ACTIVE,
                name: competitionNames
            }
        });
        let comsObj = await getNameObj(coms);
        let createGroups = groups.map((g) => {
            g.project_id = prosObj[g.proName]
            g.competition_id = comsObj[g.comName];
            return g;
        });
        await CompetitionGroup.bulkCreate(createGroups);
    }
}

async function createPlayer(players) {
    return Player.bulkCreate(players);
}

async function readProjectSheet(projectData) {
    // ["项目名称", "关联舞种", "单位参赛人数，最小值", "单位参赛人数，最大值"]
    // 直接写死字段名
    // TODO：按照第一行来标注字段，不要写死
    let projects = (projectData || []).map((lineObj) => {
        return {
            name: lineObj['项目名称'],
            dance: JSON.stringify(lineObj['关联舞种'].replace(/\s+/g, '').split(',')),
            unit_number: JSON.stringify({
                min: lineObj['单位参赛人数，最小值'],
                max: lineObj['单位参赛人数，最大值']
            }),
            status: CONSTS.STATUS.ACTIVE,
            created_at: new Date(),
            create_userid: 0
        }
    });
    await createProject(projects);
}

async function readRefereeSheet(refereeData) {
    // ["名字", "头像地址", "性别", "国家地区", "个人简介"]
    // 直接写死字段名
    // TODO：按照第一行来标注字段，不要写死
    let referees = (refereeData || []).map((lineObj) => {
        let _gender = lineObj['性别'], gender = 0;
        if(_gender == '男') gender = 1;
        else if(_gender == '女') gender = 2;
        return {
            name: lineObj['名字'],
            avatar: lineObj['头像地址'],
            gender,
            country: lineObj['国家地区'],
            profile: lineObj['个人简介'] || '',
            status: CONSTS.STATUS.ACTIVE,
            created_at: new Date(),
            create_userid: 0
        }
    });
    await createReferee(referees);
}

async function readTemplateSheet(templateData) {
    // ["模版名称", "分制", "排名依据", "评分项1 名称", "评分项1 权重"]
    // 直接写死字段名
    // TODO：按照第一行来标注字段，不要写死
    let criterias = [];
    let templateNames = [];
    let templates = (templateData || []).map((lineObj) => {
        let name = lineObj['模版名称'];
        let scale_type = lineObj['分制'] === '十分制' ? 2 : 1;
        let rank_type = lineObj['排名依据'] === '平均分' ? 1 : 2;
        templateNames.push(name);
        for(let i = 1; i <= 5; i ++) {
            let cName = lineObj[`评分项${i} 名称`];
            let cWeight = lineObj[`评分项${i} 权重`];
            if(cName && cWeight) {
                criterias.push({
                    temName: name,
                    name: cName,
                    weight: cWeight,
                    status: CONSTS.STATUS.ACTIVE,
                    created_at: new Date(),
                    create_userid: 0
                })
            }
        }

        return {
            name, scale_type, rank_type,
            status: CONSTS.STATUS.ACTIVE,
            created_at: new Date(),
            create_userid: 0
        }
    });
    await createTemplate(templates, criterias, templateNames);
}

async function readCompetitionSheet(competitionData) {
    // ["活动ID", "活动名称", "项目名称", "赛制名称", "晋级人数", "裁判人数", "评分模版名称", "分组1 名称", "分组1 号码牌最小值", "分组1 号码牌最大值"]
    // 直接写死字段名
    // TODO：按照第一行来标注字段，不要写死
    let groups = [];
    let competitionNames = [];
    let projectNames = [];
    let templateNames = [];
    let competitions = (competitionData || []).map((lineObj) => {
        let name = lineObj['赛制名称'];
        let projectName = lineObj['项目名称'];
        let templateName = lineObj['评分模版名称'];
        competitionNames.push(name);
        projectNames.push(projectName);
        templateNames.push(templateName);

        for(let i = 1; i <= 5; i ++) {
            let gName = lineObj[`分组${i} 名称`];
            let gMin = lineObj[`分组${i} 号码牌最小值`];
            let gMax = lineObj[`分组${i} 号码牌最大值`];
            if(gName && gMin && gMax) {
                groups.push({
                    name: gName,
                    proName: projectName,
                    comName: name,
                    activity_id: lineObj['活动ID'],
                    interval: JSON.stringify({
                        min: gMin, max: gMax
                    }),
                    status: CONSTS.STATUS.ACTIVE,
                    created_at: new Date(),
                    create_userid: 0
                })
            }
        }

        return {
            name,
            activity_id: lineObj['活动ID'],
            project_name: projectName,
            win_count: lineObj['晋级人数'],
            referee_count: lineObj['裁判人数'],
            grade_template_name: templateName,
            status: CONSTS.STATUS.ACTIVE,
            created_at: new Date(),
            create_userid: 0
        }
    });
    await createCompetition(competitions, groups, competitionNames, projectNames, templateNames);
}

async function readRefereeAccountSheet(refereeAccountData) {
    // ["用户名", "密码", "裁判库名称", "活动ID", "活动名称", "赛制名称", "项目名称", "分组1 名称"]
    // 直接写死字段名
    // TODO：按照第一行来标注字段，不要写死
    const algorithm = 'sha256'
    const salt = randomstring.generate(32)
    let refereeNames = [];
    let reAcNames = [];
    let proNames = [];
    let comNames = [];
    let refereeMappings = [];
    let dupObj = {};
    let accounts = (refereeAccountData || []).reduce((result, lineObj) => {
        const _password  = signPassword(algorithm, salt, lineObj['密码']);
        let refereeName = lineObj['裁判库名称'];
        let reAcName = lineObj['用户名'];
        refereeNames.push(refereeName);
        reAcNames.push(reAcName);
        proNames.push(lineObj['项目名称']);
        comNames.push(lineObj['赛制名称']);
        let accountDup = false;
        if(dupObj[reAcName + refereeName + lineObj['活动名称']]) {
            accountDup = true;
        } else dupObj[reAcName + refereeName + lineObj['活动名称']] = true;
        for(let i = 1; i <= 5; i ++) {
            let gName = lineObj[`分组${i} 名称`];
            if(gName) {
                refereeMappings.push({
                    referee_name: refereeName,
                    reAcName,
                    activity_id: lineObj['活动ID'],
                    proName: lineObj['项目名称'],
                    comName: lineObj['赛制名称'],
                    group_name: gName,
                    status: CONSTS.STATUS.ACTIVE,
                    created_at: new Date(),
                    create_userid: 0
                })
            }
        }

        if(!accountDup) {
            result.push({
                username: reAcName,
                password: _password, algorithm, salt,
                activity_id: lineObj['活动ID'],
                reName: refereeName,
                proName: lineObj['项目名称'],
                status: CONSTS.STATUS.ACTIVE,
                created_at: new Date(),
                create_userid: 0
            });
        }
        return result;
    }, []);

    await createRefereeAccount(accounts, refereeMappings, proNames, comNames, refereeNames, reAcNames);
}

async function readPlayerSheet(playerData) {
    // ["活动ID", "活动名称", "项目名称", "赛制名称", "参赛名", "手机", "号码牌"]
    // 直接写死字段名
    // TODO：按照第一行来标注字段，不要写死
    const [ pros, coms ] = await Promise.all([
        Project.findAll({
            attributes: ['id', 'name'],
            where: {
                status: CONSTS.STATUS.ACTIVE
            }
        }),
        Competition.findAll({
            attributes: ['id', 'name'],
            where: {
                status: CONSTS.STATUS.ACTIVE
            }
        })
    ]);

    const [ prosObj, comsObj ] = await Promise.all([
        getNameObj(pros),
        getNameObj(coms)
    ]);

    const comGroups = await CompetitionGroup.findAll({
        attributes: ['id', 'name', 'interval', 'competition_id'],
        where: {
            status: CONSTS.STATUS.ACTIVE,
            competition_id: coms.map(c => c.id)
        }
    });

    const comGroupsObj = comGroups.reduce((result, g) => {
        if(!result[g.competition_id]) result[g.competition_id] = [];
        result[g.competition_id].push({
            id: g.id,
            name: g.name,
            interval: JSON.parse(g.interval)
        });
        return result;
    }, {});

    let players = (playerData || []).reduce((result, lineObj) => {
        let number = lineObj['号码牌'];
        let competition_id = comsObj[lineObj['赛制名称']];

        let groups = comGroupsObj[competition_id];
        let group_id = null, group_name = null;

        if(groups && groups.length) {
            groups.forEach((g) => {
                if(number <= g.interval.max && number >= g.interval.min) {
                    group_id = g.id;
                    group_name = g.name;
                    if(number < 10) number = `00${Number(number)}`;
                    else if(number < 100) number = `0${Number(number)}`;
                }
            });
        }

        // console.log(group_id, group_name)

        if(group_id && group_name) {
            result.push({
                name: lineObj['参赛名'],
                phone: lineObj['手机'],
                number, group_id, group_name,
                activity_id: lineObj['活动ID'],
                project_id: prosObj[lineObj['项目名称']],
                project_name: lineObj['项目名称'],
                competition_id,
                competition_name: lineObj['赛制名称'],
                status: CONSTS.STATUS.ACTIVE,
                created_at: new Date(),
                create_userid: 0
            });
        }
        return result;
    }, []);
    await createPlayer(players);
}

async function start() {
    const filePath = process.argv[2];
    if(!filePath) {
        console.log('------------------------- 请填写模版文件路径 -------------------------');
        process.exit(0);
    }
    if(!fs.existsSync(filePath)) {
        console.log('-------------------------- 模版文件不存在 ---------------------------');
        process.exit(0);
    }

    let workbook = XLSX.readFile(filePath, { type: 'array' });
    // 只读取第一张表
    let [
        projectSheetName, refereeSheetName, templateSheetName,
        competitionSheetName, refereeAccountSheetName, playerSheetName
    ] = workbook.SheetNames;

    let projectSheet = workbook.Sheets[projectSheetName];
    let refereeSheet = workbook.Sheets[refereeSheetName];
    let templateSheet = workbook.Sheets[templateSheetName];
    let competitionSheet = workbook.Sheets[competitionSheetName];
    let refereeAccountSheet = workbook.Sheets[refereeAccountSheetName];
    let playerSheet = workbook.Sheets[playerSheetName];

    // 存在关联关系，有些需要顺序处理

    const [
        projectData, refereeData, templateData,
        competitionData, refereeAccountData, playerData
    ] = await Promise.all([
        XLSX.utils.sheet_to_json(projectSheet),
        XLSX.utils.sheet_to_json(refereeSheet),
        XLSX.utils.sheet_to_json(templateSheet),
        XLSX.utils.sheet_to_json(competitionSheet),
        XLSX.utils.sheet_to_json(refereeAccountSheet),
        XLSX.utils.sheet_to_json(playerSheet)
    ]);

    // 无关联关系
    await Promise.all([
        readProjectSheet(projectData),
        readRefereeSheet(refereeData),
        readTemplateSheet(templateData)
    ]);
    // 有关联关系
    await readCompetitionSheet(competitionData);
    await readRefereeAccountSheet(refereeAccountData);
    await readPlayerSheet(playerData);
    process.exit(0);
}

/*
 * 运行时指定环境变量
 * Windows: set DB_HOST=rm-uf66kc7s62ubby3800o.mysql.rds.aliyuncs.com DB_NAME=dancebox-test DB_USER=boxt
 * DB_PASS=DanceBox@2019 && node createTestData.js ./赛制数据导入模版.xlsx
 *
 * Linux:
 * export DB_HOST=rm-uf66kc7s62ubby3800o.mysql.rds.aliyuncs.com DB_NAME=dancebox-test DB_USER=boxt
 * DB_PASS=DanceBox@2019 && node createTestData.js ./赛制数据导入模版.xlsx
 * */
start();


