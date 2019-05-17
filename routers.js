
const Router = require('koa-router')
const activityAPI = require('./controller/activityAPI')
const admin = require('./controller/admin')
const file = require('./controller/file')
const personal = require('./controller/personal')
const user = require('./controller/user')
const community = require('./controller/community')

const authenticated = require('./middleware/authenticated')

const router = new Router({
    prefix: '/api'
})

const staticRouter = new Router({
  prefix: '/activity_img'
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

router.get('/admin/activity', activityAPI.detail.bind(null,'admin'))

router.post('/admin/game', activityAPI.createGame)

router.post('/admin/teach', activityAPI.createTeach)

router.post('/admin/activity', authenticated(activityAPI.create))

router.put('/admin/activity', authenticated(activityAPI.setStatus))

router.post('/admin/personal', authenticated(personal.addPersonal))

router.get('/admin/personal', authenticated(personal.personalList))

router.delete('/admin/personal', authenticated(personal.deletePersonal))

//用户
router.get('/admin/users', authenticated(user.list))

//社区

router.post('/admin/community/topic', authenticated(community.addTopic))
router.get('/admin/community/topics', authenticated(community.getTopic))
router.get('/admin/community/post', authenticated(community.getPostList))

//静态资源
staticRouter.post('/img', file.img)

staticRouter.get('/img/:name', file.getImg)


//小程序接口
router.get('/activity/detail', activityAPI.detail.bind(null,'no_admin'))

router.get('/activitys/', activityAPI.activity_list)

router.get('/get_city', activityAPI.getCity)

router.post('/session_key', user.sessionKey)
router.post('/login', user.login)

router.get('/activity/list', activityAPI.list)

//社区接口
router.delete('/community/topic',community.deleteTopic)
router.get('/community/topic',community.getTopic)
router.get('/community/topic/detail',community.getTopicDetail)

router.post('/community/post',community.addPost)
router.delete('/community/post',community.deletePost)
router.get('/community/posts',community.getPostList)
router.get('/community/post',community.getPost)
router.get('/community/recommend',community.recommend)

router.post('/community/comment',community.addComment)
router.delete('/community/comment',community.deleteComment)
router.get('/community/comment',community.getComment)

router.post('/community/up',community.up)
router.post('/community/report',community.report)

router.get('/community/message',community.getMessage)
router.get('/test_message',community.testMessage)

module.exports = {
  staticRouter,
  router
}
