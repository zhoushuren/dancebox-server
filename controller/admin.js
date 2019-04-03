
const Admin = require('../model/Admin')
const AdminSession = require('../model/AdminSession')
const sha256 = require('sha256')
const randomstring = require("randomstring")

exports.login = async function (ctx) {
    let { email, password} = ctx.request.body
    if( email === undefined || password === undefined ) {
        return ctx.body = {
            message: "密码错误",
            success: false
        }
    }


    let user = await Admin.findOne({where:{email}})
    if(user === null){
        return ctx.body = {
            success: false,
            error: ERR_CODE.USER_PASS_ERR
        }
    }
    let _password = signPassword(user.dataValues.algorithm, user.dataValues.salt,password)

    if( _password !== user.dataValues.password){
        return ctx.body = {
            success: false,
            message: "密码错误"
        }
    }
    let session_token =  randomstring.generate(32)



    try{
        console.log('------')
        console.log(session_token)
        console.log(user.dataValues)
        console.log('------')
        await AdminSession.upsert({
            session_token,
            admin_user_id: user.dataValues.id
        })

        ctx.body = {success: true, session_token}
    }catch (e){
        console.error(e)
        return ctx.body = {
            success: false
        }
    }
}

function signPassword(algorithm,salt,password) {
    if(algorithm === 'sha256') {
        return sha256(salt + password)
    }
}

exports.createAdmin = async function (ctx, next) {
    let { email, password} = ctx.request.body

    const algorithm = 'sha256'
    const salt = randomstring.generate(32)
    const _password  = signPassword(algorithm,salt,password)

    await Admin.create({
        email,
        password: _password,
        algorithm,
        salt
    })

    ctx.body = {
        success: true
    }
}

exports.getUserInfo = async function (ctx) {

    const admin = await Admin.findOne({where: {id: ctx.admin_user_id}, attributes:['id','user_name','email','created_at','status']})

    if(!admin){
        return  ctx.body = {
            success: false
        }
    }

    ctx.body = {
        success: true,
        user_info: admin
    }
}