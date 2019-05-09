
const moment = require('moment')
const Topic = require('../model/Topic')
const Post = require('../model/Post')
const Comment = require('../model/Comment')
const Message = require('../model/Message')
const {getUserInfoBySession} = require('../services/authService')
const rp = require('request-promise')
const activityImgURL  = process.env.IMGURL || 'http://127.0.0.1:3007'

exports.addTopic = async function(ctx, next) {
  const {name,banner,status, desc} = ctx.request.body
  try{
    await Topic.create({
      name,
      banner,
      status,
      desc
    })

    ctx.body = {
      success: true
    }
  }catch (e) {
    ctx.body = {
      success: false
    }
  }
}

exports.deleteTopic = async function (ctx, next) {
  const {id} = ctx.query

  if(!id) {
    return
  }

  let res = await Topic.findByPk(id)
  if(res){
    await res.update({status:1})
  }
  ctx.body = {
    success: true
  }
}

exports.getTopic = async function (ctx, next) {
  let res = await Topic.findAll({where: {status: 0}})
  ctx.body = {
    success: true,
    list: res.map(val => {
      return {
        id: val.dataValues.id,
        name: val.dataValues.name,
        desc: val.dataValues.desc,
        banner: activityImgURL + val.dataValues.banner
      }
    })
  }
}

exports.getTopicDetail = async function (ctx) {
  let {id} = ctx.query
  if(!id) {
    return
  }
  let res = await Topic.findOne({where: {id: id}})
  if(!res) {
    return
  }
  ctx.body = {
    success: true,
    data: {
      id: res.dataValues.id,
      name: res.dataValues.name,
      desc: res.dataValues.desc,
      banner: activityImgURL + res.dataValues.banner
    }
  }
}

//发帖
exports.addPost = async function(ctx, next) {
  let user_info = await getUserInfoBySession(ctx)
    console.log(user_info)
  if(!user_info) {
    return //没权限
  }
  let user_id = user_info.user_id
  let {topic_id,title,content,img_list} = ctx.request.body

  let res = await Topic.findByPk(topic_id)
  if(!res && res.status >0 ) {
    return
  }

  if(img_list) {
    img_list = JSON.stringify(img_list)
  }

  await Post.create({
    topic_id,
    title,
    content,
    user_id,
    user_name: user_info.nick_name,
    user_avatar: user_info.avatar,
    topic_name: res.name,
    img_list
  })

  ctx.body = {
    success: true
  }
}
//删帖
exports.deletePost = async function(ctx,next) {
  const {id} = ctx.query
  let res = await Post.findByPk(id)
  res.update({
    status:0
  })
  ctx.body = {
    success: true
  }
}
//获取帖子列表
exports.getPostList = async function (ctx, next) {
  let {page,topic_id} = ctx.query
  const where = {status: 0}
  if(topic_id) {
    where.topic_id = topic_id
  }
  let data = await Post.findAll({where,order: [['created_at', 'desc']],attributes:['user_avatar','id','topic_id', 'topic_name', 'title', 'up', 'comment', 'user_name', 'created_at']})

  let list = data.map( val => {
    let createAt = new Date(val.created_at).getTime()
    let now = Date.now()
      let diff = now = createAt
      let format_time = moment(val.created_at).format('MM月DD日')
      if(diff < (3600 * 1000)) {
          format_time = '一小时前'
      }
      if(diff < (60*15 * 1000)) {
        let f = diff / (60*1000)
          format_time = f + '分钟前'
      }
    return {
        user_avatar: val.user_avatar,
        id :val.id,
        topic_id: val.topic_id,
        topic_name: val.topic_name,
        title: val.title,
        up: val.up,
        comment: val.comment,
        user_name: val.user_name,
        created_at: val.created_at,
        format_time: format_time
    }
  })
  ctx.body = {
    success: true,
    list: list
  }
}
//获取帖子详情
exports.getPost = async function(ctx) {
  let {post_id} = ctx.query
  if(!post_id) {
    return
  }
  const where = {status: 0,id: post_id}

  let data = await Post.findOne({where,order: [['created_at', 'desc']],attributes:['img_list','user_avatar','id','topic_id','content', 'topic_name', 'title', 'up', 'comment', 'user_name', 'created_at']})

  if(data.img_list) {
    try{
      data.img_list = JSON.parse(data.img_list)
    }catch (e) {
     console.error(e)
    }
  }
  ctx.body = {
    success: true,
    data: data
  }
}
//添加评论
exports.addComment = async function(ctx, next) {
  let {content,post_id,parent_id} = ctx.request.body
  let user_info = await getUserInfoBySession(ctx)
  if(!user_info) {
    return //没权限
  }

  let post = await Post.findByPk(post_id)

  if(!post) {
    return
  }

  let user_id = user_info.user_id
  if(!parent_id) {
    parent_id = 0
  }
  await Comment.create({
    post_id,
    parent_id,
    content,
    user_id,
    user_avatar: user_info.avatar,
    user_name: user_info.nick_name
  })
    await post.increment('comment')
   rp({
      uri: 'http://127.0.0.1:3001/messaage?password=dancebox',
      method: 'POST',
      data: {
          user_id: post.user_id,
          content: content,
          type: 'comment'
      }
  }).then((res) => {
    console.log(res)
   })
  ctx.body = {
    success: true
  }
}

//删除评论
exports.deleteComment = async function (ctx,next) {
  let {id} = ctx.query

  let res = await Comment.findByPk(id)
  if(!res) {
    return
  }

  let post = await Post.findByPk(res.post_id)
    await post.decrement('comment') //减1
  await res.update({status: 2}) //2是删除
  ctx.body = {
    success: true
  }
}

//获取评论
exports.getComment = async function(ctx, next) {
  let {post_id,parent_id} = ctx.query
  let post = await Post.findByPk(post_id)
  if(!post) {
    return
  }

  let where = {status: 0,post_id,parent_id: 0}
  if(parent_id) {
      where.parent_id = parent_id
      let comment = await Comment.findByPk(parent_id)
      await comment.increment('reply')
  }

  let res = await Comment.findAll({where })
  ctx.body = {
    success: true,
    list: res
  }
}

exports.up = async function(ctx, next) {
  let {id,type} = ctx.request.body
  let user_info = await getUserInfoBySession(ctx)
  if(!user_info) {
    return //没权限
  }
  let user_id = user_info.user_id
  if(type === 'post') {
    let res = await Post.findByPk(id)
    if(!res) {
      return
    }
    await res.increment('up')
    // return
    await Message.create({
      _id: id,
      type,
      action: 'up',
      to_user_id: res.dataValues.user_id,
      to_user_name: res.dataValues.user_name,
      from_user_id: user_id,
      from_user_name: user_id //TODO: 暂时这样写
    })
  }
  if(type === 'comment') {
    let res = await Comment.findByPk(id)
    if(!res) {
      return
    }
    await res.update({up: 1})
    await Message.create({
      _id: id,
      type,
      action: 'up',
      to_user_id: res.dataValues.user_id,
      to_user_name: res.dataValues.user_name,
      from_user_id: user_id,
      from_user_name: user_id //TODO: 暂时这样写
    })
  }
  ctx.body = {
    success: true
  }
}

exports.getMessage = async function(ctx, next) {
  let user_info = await getUserInfoBySession(ctx)
  if(!user_info) {
    return //没权限
  }
  let user_id = user_info.user_id
  let res = await Message.findAll({where: {to_user_id: user_id}})

  ctx.body = {
    success: true,
    data: res
  }
}

const {setMessage} = require('../services/message')

exports.testMessage = async function (ctx) {

  await setMessage({
    type: 'up',
    content: 'test111111'
  },
    0
  )

  ctx.body = {
    success: true
  }
}