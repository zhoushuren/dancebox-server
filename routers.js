
const Router = require('koa-router')
const activityAPI = require('./controller/activityAPI')
const file = require('./controller/file')

const router = new Router({
    prefix: '/api'
})

function wrap(cb) {
    return async (ctx, next) => {
        try{
            let data = await cb(ctx, next)
            if (data !== undefined) {
                ctx.body = {
                    success: true,
                    ...data
                }
            }
        }catch (e) {
            logger.error(e)
            if (e.error_code) {
                ctx.body = {
                    success: false,
                    ...e
                }
            }else{
                ctx.body = {
                    success: false,
                    msg: '未知错误'
                }
            }
        }
    }
}

router.get('/', async function (ctx, next) {
    await next()
})

router.get('/list', activityAPI.list)

router.post('/activity', activityAPI.create)


router.post('/img', file.img)
module.exports = router
