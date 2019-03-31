const KoaRouter = require('koa-router')
const activityAPI = require('./controller/activityAPI')
const router = new KoaRouter({ prefix: '/api' })

router.get('/list', activityAPI.list)

router.post('/activity', activityAPI.create)

module.exports = router
