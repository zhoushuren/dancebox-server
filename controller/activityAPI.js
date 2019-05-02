
const Activity = require('../model/Activity')
const ActivityGame = require('../model/ActivityGame')
const ActivityTeach = require('../model/ActivityTeach')
const moment = require('moment')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
function filterTime () {

}
const activityImgURL  = process.env.IMGURL || 'http://127.0.0.1:3007'

function parseRemark(remark) {
    try{
        let arr = JSON.parse(remark)
        let result = ''
        arr.forEach(val => {
            result += '#' +val + " "
        })
        return result
    }catch (e) {

    }

}

async function getList(where) {
    let list = await Activity.findAll({
        where,
        order: [['start_time', 'asc']]
    })

    return {
        success: true,
        list: list.map(val => {
            return {
                start_time:  moment( val.dataValues.start_time).format('YYYY/MM/DD'),
                end_time: moment( val.dataValues.end_time).format('YYYY/MM/DD'),
                remark: parseRemark(val.dataValues.remark),
                img:  activityImgURL + val.dataValues.img,
                banner_img:  activityImgURL + val.dataValues.banner_img,
                title: val.dataValues.title,
                location: val.dataValues.location,
                city: val.dataValues.city,
                id: val.dataValues.id,
                status: val.dataValues.status,
                dance: JSON.parse(val.dataValues.dance).map(val => val.substr(0,1)),
                url: val.dataValues.url
            }
        })
    }
}
//管理后台
exports.list = async function(ctx, next) {
    // let {status} = ctx.query
    let result = await getList()
    ctx.body = result
}

//解决数据库雪崩
class ActivityService {
  getActivityList(obj) {
    if (this.requesting === undefined) {
      let self = this;
      this.requesting =  getList({status: 0,...obj}).finally(()=>{
        delete self.requesting;
      })
    }
    return this.requesting;
  }
}

let svs = new ActivityService()
//小程序
exports.activity_list = async function(ctx, next) {
    let {page,city} = ctx.query
    // let result = await getList({status: 0})
    // ctx.body = result
  let where = {
    start_time: {[Op.gte]: new Date()}
  }
  console.log(city)
    if(city !== '全国') {
      where.city = city
    }

    let result = await svs.getActivityList(where)
    ctx.body = result
}


exports.detail = async function (is_admin, ctx, next) {
    // console.log(is_admin)
    let {id}  = ctx.query
    if(!id) {
        ctx.status = 404
        return
    }
    try{
        let [ detail, gameObj,teach ] = await Promise.all([
            Activity.findOne({
                where: {
                    // status: 0,
                    id: id
                }
            }),
            ActivityGame.findOne({where: {activity_id: id}}),
            ActivityTeach.findOne({where: {activity_id: id}})
        ])
        let game = {}
        if(gameObj) {
            if(typeof gameObj.dataValues.project === 'string') {
                try{
                    game.project = JSON.parse(gameObj.dataValues.project)
                }catch (e) {
                    game.project = []
                }
            }
            if(typeof gameObj.dataValues.organizer === 'string') {
                try{
                    game.organizer = JSON.parse(gameObj.dataValues.organizer)
                    game.organizer =  game.organizer.map(val => {
                        let img = val.img
                        if(is_admin !== 'admin') {
                            img = activityImgURL+ val.img
                        }
                        return {
                            id: val.id,
                            name: val.name,
                            type: val.type,
                            img: img
                        }
                    })
                }catch (e) {
                    game.organizer = []
                }
            }
            if(typeof gameObj.dataValues.sponsor === 'string') {
                try{
                    game.sponsor = JSON.parse(gameObj.dataValues.sponsor)

                    game.sponsor =  game.sponsor.map(val => {
                        let img = val.img
                        if(is_admin !== 'admin') {
                            img = activityImgURL+ val.img
                        }
                        return {
                            id: val.id,
                            name: val.name,
                            type: val.type,
                            img: img
                        }
                    })
                }catch (e) {
                    game.sponsor = []
                }
            }
            if(typeof gameObj.dataValues.guest === 'string') {
                try{
                    game.guest = JSON.parse(gameObj.dataValues.guest)
                    game.guest =  game.guest.map(val => {
                        let img = val.img
                        if(is_admin !== 'admin') {
                            img = activityImgURL+ val.img
                        }
                        return {
                            id: val.id,
                            name: val.name,
                            type: val.type,
                            img: img
                        }
                    })
                }catch (e) {
                    game.guest = []
                }
            }
            game.desc = gameObj.dataValues.desc
            game.activity_id = gameObj.dataValues.activity_id
        }
        let _teach = {}
        if(teach) {
            try{
                let teacher = JSON.parse(teach.dataValues.teacher)
                _teach.teacher = teacher
                _teach.desc = teach.dataValues.desc
                _teach.time = teach.dataValues.time
                _teach.location = teach.dataValues.location
            }catch (e) {
                console.error(e)
            }
        }

        ctx.body = {
            success: true,
            activity: {
                start_time:  moment( detail.dataValues.start_time).format('YYYY/MM/DD'),
                end_time: moment( detail.dataValues.end_time).format('YYYY/MM/DD'),
                remark: parseRemark(detail.dataValues.remark),
                img:  activityImgURL + detail.dataValues.img,
                banner_img:  activityImgURL + detail.dataValues.banner_img,
                title: detail.dataValues.title,
                location: detail.dataValues.location,
                city: detail.dataValues.city,
                id: detail.dataValues.id,
                dance: JSON.parse(detail.dataValues.dance),
                url: detail.dataValues.url
            },
            game,
            teach_info: _teach
        }
    }catch (e) {
        console.error(e)
    }
}


exports.create = async function (ctx, next) {
    let {
        id,
        title,
        remark,
        date,
        location,
        img,
        city,
        banner_img,
        dance,
        url
    } = ctx.request.body
    try{
        if(id) {
            //update
        }else {
            try {
                await Activity.create({
                    title,
                    remark: JSON.stringify(remark),
                    start_time: date[0],
                    end_time: date[1],
                    location,
                    img,
                    banner_img,
                    city,
                    status: 1,
                    dance: JSON.stringify(dance),
                    url
                })
            }catch (e) {
                console.error(e)
            }
        }

        ctx.body =  {
            success: true,
        }
    }catch (e) {

    }
}

exports.setStatus = async function(ctx,next) {
    let { id, status} = ctx.request.body
    if(id === undefined || status === undefined || status !==1 || status !== 0 || status !== 2) {
        ctx.body = {
            success: false,
            message: '非法请求'
        }
    }
    let activity  = await Activity.findByPk(id)
    // console.log(activity)
    if(activity) {
        await activity.update({status})
    }

    ctx.body = {
        success: true
    }
}


exports.createGame = async function (ctx) {
    let {
        activity_id,
        project,
        organizer,
        sponsor,
        guest,
        desc
    } = ctx.request.body

    try{
        if(typeof project === 'object') {
            project = JSON.stringify(project)
        }
        if(typeof organizer === 'object') {
            organizer = JSON.stringify(organizer)
        }
        if(typeof sponsor === 'object') {
            sponsor = JSON.stringify(sponsor)
        }
        if(typeof guest === 'object') {
            guest = JSON.stringify(guest)
        }
        // if(typeof desc === 'object') {
        //     desc = JSON.stringify(desc)
        // }
        await ActivityGame.upsert({
            activity_id,
            project,
            organizer,
            sponsor,
            guest,
            desc
        })
        ctx.body = {
            success: true
        }
    } catch (e) {
        console.error(e)
    }
}

exports.createTeach = async function(ctx, next) {
    let {
        activity_id,
        desc,
        location,
        time,
        teacher
    } = ctx.request.body

    if(typeof teacher === 'object') {
        teacher = JSON.stringify(teacher)
    }
    await ActivityTeach.create({
        activity_id,
        desc,
        location,
        time,
        teacher
    })

    ctx.body = {
        success: true
    }
}

exports.getCity =async function(ctx, next) {
    let res = await Activity.findAll({where: {status: 0}, attributes:['city'], group: [['city']]})
    ctx.body = {
        success: true,
        data: res
    }
}