
const Admin = require('../model/Admin')
const AdminSession = require('../model/AdminSession')
const sha256 = require('sha256')
const randomstring = require("randomstring")
const Topic = require('../model/Topic')
const Post = require('../model/Post')
const moment = require('moment')
const Comment = require('../model/Comment')
const Message = require('../model/Message')
const Report = require('../model/Report')

const QIniuCdn = 'http://static.dancebox.cn'

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
            error: '密码错误'
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
        // console.log('------')
        // console.log(session_token)
        // console.log(user.dataValues)
        // console.log('------')
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

//获取帖子列表
exports.getPostList = async function (ctx, next) {
    let {updated_at,topic_id,select} = ctx.query
    const where = {}
    if(topic_id) {
        where.topic_id = topic_id
    }

    if(select == 1 || select == 0) {
        where.status = select
    }

    if(updated_at != undefined) {
        where.updated_at =  {[Op.lt]: updated_at}
    }
    let data = await Post.findAll({where,order: [['sort', 'desc'],['updated_at', 'desc']],limit: 20})
    ctx.body = {
        success: true,
        list: data
    }
}

exports.setStatus = async function (ctx, next) {
    let {status, type, id} = ctx.request.body

    if(type === 'post') {
        let post = await Post.findByPk(id)

        await post.update({status})
    }

    if(type === 'comment') {
        let comment = await Comment.findByPk(id)

        await comment.update({status})
    }

    ctx.body = {
        success: true
    }
}

exports.getCommentlist = async function (ctx) {
    let {updated_at,topic_id,select} = ctx.query
    let where = {}

    if(select == 1 || select == 0 || select == 2) {
        where.status = select
    }

    let res = await Comment.findAll({where ,limit: 20, order: [['id', 'desc']]})

    let list = res.map((val) => {
        let _img
        if( val.dataValues.img) {
            _img = val.dataValues.img.indexOf('http') === 0 ? val.dataValues.img : QIniuCdn + '/' + val.dataValues.img
        }

        return {
            id: val.dataValues.id,
            post_id: val.dataValues.post_id,
            content: val.dataValues.content,
            user_name: val.dataValues.user_name,
            user_avatar: val.dataValues.user_avatar,
            status: val.dataValues.status,
            parent_id: val.dataValues.parent_id,
            user_id: val.dataValues.user_id,
            up: val.dataValues.up,
            reply: val.dataValues.reply,
            img: _img,
            other_user_name: val.dataValues.other_user_name,
            created_at: val.dataValues.created_at,
        }
    })
    ctx.body = {
        success: true,
        list: list
    }
}

exports.setUp = async function(ctx) {
    let { sort, id, type} = ctx.request.body

    if(type === 'post') {
        let post = await Post.findByPk(id)
        await post.update({sort: sort})
    }

    if(type === 'topic') {
        let topic = await Topic.findByPk(id)
        await topic.update({sort: sort})
    }

    ctx.body = {
        success: true
    }
}

exports.setRecommend = async function (ctx) {
    let {id, recommend} = ctx.request.body

    let post = await Post.findByPk(id)

    await post.update({recommend})

    ctx.body = {
        success: true
    }
}