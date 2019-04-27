
const Personal = require('../model/Personal')
exports.addPersonal = async function(ctx, next) {
    let { name, type, img } = ctx.request.body
    try{
        await Personal.create({
            name,
            type,
            img: img
        })
        ctx.body = {
            success: true
        }
    }catch (e) {
        console.error(e)
        ctx.body = {
            success: false
        }
    }


}

exports.personalList = async function(ctx, next) {
    let {type} = ctx.query
    const where ={
        status: 0
    }
    if(type !== undefined && type !== 'undefined') {
        where.type = type
    }
    const personal = await Personal.findAll({where})
    ctx.body = {
        success: true,
        personal
    }
}
exports.deletePersonal = async function (ctx, next) {
    let {id} = ctx.query
    let res = await Personal.findByPk(id)
    await res.update({status: 1})
    ctx.body = {
        success: true
    }
}