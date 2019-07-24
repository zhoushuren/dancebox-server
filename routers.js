
const Router = require('koa-router')
const activityAPI = require('./controller/activityAPI')
const admin = require('./controller/admin')
const file = require('./controller/file')
const personal = require('./controller/personal')
const user = require('./controller/user')
const community = require('./controller/community')
const referee = require('./controller/referee')
const competition = require('./controller/competition')
const project = require('./controller/project')
const grade = require('./controller/grade')
const player = require('./controller/player')

const authenticated = require('./middleware/authenticated')
const refereeAuth = require('./middleware/refereeAuth')

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
router.get('/admin/community/post', authenticated(admin.getPostList))
router.post('/admin/community/status', authenticated(admin.setStatus))
router.post('/admin/community/up', authenticated(admin.setUp))
router.get('/admin/community/comment_list', authenticated(admin.getCommentlist))
router.post('/admin/community/setup', authenticated(admin.setUp))
router.post('/admin/community/set_recommend', authenticated(admin.setRecommend))

//静态资源
staticRouter.post('/img', file.img)

staticRouter.get('/img/:name', file.getImg)


//小程序接口
router.get('/activity/detail', activityAPI.detail.bind(null,'no_admin'))

router.get('/activitys/', activityAPI.activity_list)

router.get('/get_city', activityAPI.getCity)

router.post('/session_key', user.sessionKey)
router.post('/login', user.login)
router.get('/user_info', user.getUserInfo)

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
router.get('/community/count',community.count)

router.get('/community/message',community.getMessage)
router.get('/test_message',community.testMessage)

// 裁判客户端
router.post('/referee/login', referee.login)
router.get('/referee/competition', refereeAuth(competition.getCompetition))
router.post('/referee/grade', refereeAuth(grade.saveGrade))

// 裁判后台
router.post('/referee/account', authenticated(referee.addRefereeAccount))
router.get('/referee/account', authenticated(referee.getRefereeAccount))
router.delete('/referee/account/:referee_account_id', authenticated(referee.deleteRefereeAccountById))
router.get('/referee', authenticated(referee.getAllReferee))
router.post('/referee', authenticated(referee.addReferee))
router.put('/referee/:referee_id', authenticated(referee.updateReferee))
router.get('/referee/:referee_id', authenticated(referee.getRefereeById))
// router.delete('/referee/:referee_id', authenticated(referee.deleteRefereeById))

// 赛制
router.get('/competition', authenticated(competition.getAllCompetition))
router.post('/competition', authenticated(competition.addCompetition))
router.put('/competition/:competition_id', authenticated(competition.updateCompetition))
router.delete('/competition/:activity_id/:competition_id', authenticated(competition.deleteCompetition))
router.get('/competition/group/:competition_id', authenticated(competition.getAllCompetitionGroups))

// 选手管理
router.get('/player', authenticated(player.getAllPlayer))
router.post('/player', authenticated(player.addPlayer))
router.get('/player/grade', authenticated(grade.getAllGrades))
router.get('/player/:player_id', authenticated(player.getPlayerById))
router.put('/player/:player_id', authenticated(player.updatePlayerById))
router.delete('/player/:player_id', authenticated(player.deletePlayerById))
router.post('/player/check', authenticated(player.checkPlayerNumber))

// 项目
router.post('/project', authenticated(project.addProject))
router.get('/project', authenticated(project.getAllProject))
router.get('/project/:project_id', authenticated(project.getProjectById))
router.put('/project/:project_id', authenticated(project.updateProjectById))
router.delete('/project/:project_id', authenticated(project.deleteProjectById))

// 评分模版
router.post('/grade/template', authenticated(grade.addTemplate))
router.get('/grade/template', authenticated(grade.getAllTemplate))
router.delete('/grade/:template_id', authenticated(grade.deleteTemplateById))
// router.get('/grade/rank', authenticated(grade.getRankGrades))

module.exports = {
  staticRouter,
  router
}
