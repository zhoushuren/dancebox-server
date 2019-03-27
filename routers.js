const KoaRouter = require('koa-router')
const activityAPI = require('./controller/activityAPI')
const router = new KoaRouter({ prefix: '/api' })

router.get('/list', activityAPI.list)

module.exports = router
