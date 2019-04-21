
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

    const personal = await Personal.findAll({where: {status: 0}})

    ctx.body = {
        success: true,
        personal
    }
}