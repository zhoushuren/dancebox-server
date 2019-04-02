
const Activity = require('../model/Activity')

exports.list = async function(ctx, next) {
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
        id,
        title,
        remark,
        date,
        location,
        img,
        detail
    } = ctx.request.body
    console.log(title)
    console.log(location)
    console.log(date)
    try{
        if(id) {
            //update
        }else {
            try {
                await Activity.create({
                    title,
                    remark,
                    start_time: date[0],
                    end_time: date[1],
                    location,
                    img,
                    detail,
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

exports.delete = async function(ctx,next) {

}

