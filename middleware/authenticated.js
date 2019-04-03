//admin用户权限验证
const _cookie = require('cookie-parse')
const AdminSession = require('../model/AdminSession')
function admin(cb) {
    return async (ctx, next) => {
        const cookie = ctx.req.headers.cookie
        const cookies = _cookie.parse(cookie)
        if(!cookies || cookies['Admin-Token'] === undefined ) {
            return ctx.body = {
                success: false,
                message: '没有权限'
            }
        }

        const result = await AdminSession.findOne({where:{session_token: cookies['Admin-Token']}})

        if(result !== null) {
            ctx.admin_user_id = result.dataValues.admin_user_id
        }
        await cb(ctx, next)
    }
}
module.exports  = admin