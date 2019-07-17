/**
 * Author: Boxt.
 * Time: 2019/7/8.
 */

'use strict';
const Referee = require('../model/Referee')
const RefereeAccount = require('../model/RefereeAccount')
const RefereeSession = require('../model/RefereeSession')
const sha256 = require('sha256')
const randomstring = require('randomstring')
const CONSTS = require('../config/constant')
const Sequelize = require('sequelize')

exports.login = async function (ctx) {
    let { username, password } = ctx.request.body
    if( !username || !password) {
        return ctx.body = {
            message: "用户名或密码错误",
            success: false
        }
    }

    let account = await RefereeAccount.findOne({where:{ username }})
    if(!account){
        return ctx.body = {
            success: false,
            error: '密码错误'
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
        return ctx.body = {success: true, session_token, username, offline}
    }catch (e){
        console.error(e)
        return ctx.body = {
            success: false
        }
    }
}

exports.createRefereeAccount = async function (ctx, next) {
    let { username, password, referee_id, activity_id, project_id, groups } = ctx.request.body
    let admin_user_id = ctx.admin_user_id
    const algorithm = 'sha256'
    const salt = randomstring.generate(32)
    const _password  = signPassword(algorithm,salt,password)
    let group_ids = groups.map((g) => g.id)



    await Sequelize.transaction((t) => {
        return RefereeAccount.create({
            username, referee_id, activity_id, project_id,
            password: _password,
            algorithm, salt,
            status: CONSTS.STATUS.ACTIVE,
            created_at: new Date(),
            create_userid: admin_user_id
        }, { transaction: t }).then((referee) => {
            let referee_account_id = referee.get('id')

        })
    })


    return ctx.body = {
        success: true
    }
}

exports.getRefereeAccount = async function (ctx, next) {
    

    return ctx.body = {
        success: true
    }
}

function signPassword(algorithm,salt,password) {
    if(algorithm === 'sha256') {
        return sha256(salt + password)
    }
}