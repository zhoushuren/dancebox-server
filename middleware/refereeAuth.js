/**
 * Author: Boxt.
 * Time: 2019/7/9.
 */

'use strict';

//referee用户权限验证
const _cookie = require('cookie-parse')
const RefereeSession = require('../model/RefereeSession')
const RefereeAccount = require('../model/RefereeAccount')
const CONSTS = require('../config/constant')

function referee(cb) {
    return async (ctx, next) => {
        // const cookie = ctx.req.headers.cookie
        // const cookies = _cookie.parse(cookie)
        // if(!cookies || !cookies['Referee-Token']) {
        //     return ctx.body = {
        //         success: false,
        //         message: '没有权限'
        //     }
        // }
        // if(process.env.NODE_ENV == 'boxt') {
        //     await cb(ctx, next)
        // } else {
            let cookies = { "Referee-Token": "B5yOLGkbSxxHyjeez1azU4TbuRd2Tr06" }
            const result = await RefereeSession.findOne({
                where:{session_token: cookies['Referee-Token']}
            })
            if(!result) {
                return ctx.body = {
                    success: false,
                    message: '用户未登陆'
                }
            }
            const referee_account = await RefereeAccount.findOne({
                where:{
                    id: result.dataValues.referee_account_id,
                    status: CONSTS.STATUS.ACTIVE
                }
            })

            if(!referee_account) {
                return ctx.body = {
                    success: false,
                    message: '用户不存在'
                }
            }

            ctx.token = {
                referee_account_id: result.dataValues.referee_account_id,
                referee_account_name: result.dataValues.referee_account_name,
                activity_id: referee_account.dataValues.activity_id,
                referee_id: referee_account.dataValues.referee_id,
            }
            await cb(ctx, next)
        // }
    }
}
module.exports  = referee