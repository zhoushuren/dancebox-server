
const Activity = require('../model/Activity')
const ActivityGame = require('../model/ActivityGame')
const moment = require('moment')
function filterTime () {

}
const activityImgURL  = process.env.IMGURL || 'http://192.168.1.2:3007/api/img/'

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
        where
    })

    return {
        success: true,
        list: list.map(val => {
            return {
                start_time:  moment( val.dataValues.start_time).format('YYYY/MM/DD'),
                end_time: moment( val.dataValues.start_time).format('YYYY/MM/DD'),
                remark: parseRemark(val.dataValues.remark),
                img:  activityImgURL + val.dataValues.img,
                title: val.dataValues.title,
                location: val.dataValues.location,
                city: val.dataValues.city,
                id: val.dataValues.id,
                status: val.dataValues.status
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
//小程序
exports.activity_list = async function(ctx, next) {
    let {page} = ctx.query
    let result = await getList({status: 0})
    ctx.body = result
}

exports.detail = async function (ctx, next) {
    let {id}  = ctx.query
    if(!id) {
        ctx.status = 404
        return
    }
    try{
        let detail = await Activity.findOne({
            where: {
                status: 0,
                id: id
            }
        })

        ctx.body = {
            success: true,
            activity: {
                start_time:  moment( detail.dataValues.start_time).format('YYYY/MM/DD'),
                end_time: moment( detail.dataValues.start_time).format('YYYY/MM/DD'),
                remark: parseRemark(detail.dataValues.remark),
                img:  activityImgURL + detail.dataValues.img,
                title: detail.dataValues.title,
                location: detail.dataValues.location,
                city: detail.dataValues.city,
                id: detail.dataValues.id
            },

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
        city
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
                    city,
                    status: 0
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
    if(id === undefined || status === undefined || status !==1 || status !== 0) {
        ctx.body = {
            success: false,
            message: '非法请求'
        }
    }
    let activity  = await Activity.findByPk(id)
    console.log(activity)
    if(activity) {
        await activity.update({status})
    }

    ctx.body = {
        success: true
    }
}


exports.createGame = async function (ctx) {
    const {
        activity_id,
        project,
        organizer,
        sponsor,
        guest,
        desc
    } = ctx.request.body

    try{

        await ActivityGame.create({
            activity_id,
            project: JSON.stringify(project),
            organizer: JSON.stringify(organizer),
            sponsor: JSON.stringify(sponsor),
            guest: JSON.stringify(guest),
            desc: JSON.stringify(desc)
        })

        ctx.body = {
            success: true
        }
    } catch (e) {
        console.error(e)
    }
}
