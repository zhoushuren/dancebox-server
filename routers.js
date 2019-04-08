
const Router = require('koa-router')
const activityAPI = require('./controller/activityAPI')
const admin = require('./controller/admin')
const file = require('./controller/file')
const personal = require('./controller/personal')

const authenticated = require('./middleware/authenticated')

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
            // logger.error(e)
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


router.post('/admin/login', admin.login)

router.get('/admin/info', authenticated(admin.getUserInfo))

router.post('/add_admin', admin.createAdmin)

router.get('/admin/activitys', activityAPI.list)

router.get('/admin/activity', activityAPI.detail)

router.get('/admin/game', activityAPI.createGame)

router.post('/admin/activity', authenticated(activityAPI.create))

router.put('/admin/activity', authenticated(activityAPI.setStatus))

router.post('/admin/personal', authenticated(personal.addPersonal))

router.get('/admin/personal', authenticated(personal.personalList))

router.get('/activity/list', activityAPI.list)

router.post('/img', file.img)

router.get('/img/:name', file.getImg)


//小程序接口
router.get('/activity/detail', activityAPI.detail)

router.get('/activitys/', activityAPI.activity_list)
module.exports = router
