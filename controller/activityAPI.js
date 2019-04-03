
const Activity = require('../model/Activity')
const moment = require('moment')
function filterTime () {

}

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
exports.list = async function(ctx, next) {
    let list = await Activity.findAll({
        where: {}
    })

    ctx.body = {
        success: true,
        list: list.map(val => {
            val.dataValues.start_time = moment( val.dataValues.start_time).format('YYYY/MM/DD')
            val.dataValues.end_time  =  moment( val.dataValues.start_time).format('YYYY/MM/DD')
            val.dataValues.remark = parseRemark(val.dataValues.remark)
            return val
        })
    }
}

exports.detail = async function (ctx, next) {
    let {id}  = ctx.query
    if(!id) {
        ctx.status = 404
        return
    }

    let detail = await Activity.findOne({
        where: {
            status: 0,
            id: id
        }
    })

    ctx.body = {
        success: true
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
    console.log(1112222)
    console.log(id, status)
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

}
