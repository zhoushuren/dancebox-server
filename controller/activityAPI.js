
const Activity = require('../model/Activity')

exports.list = async function (ctx, next) {

    let list = await Activity.findAll({
        where: {
            status: 0
        }
    })

    ctx.body = {
        success: true,
        list
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
        title,
        remark,
        start_time,
        end_time,
        location,
        img,
        detail
    } = ctx.request.body
    Activity.create({

    })
}

