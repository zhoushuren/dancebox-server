
const Topic = require('../model/Topic')
const Post = require('../model/Post')
const Comment = require('../model/Comment')
const Message = require('../model/Message')
exports.addTopic = async function(ctx, next) {
  const {name,banner,status} = ctx.request.body

  await Topic.create({
    name,
    banner,
    status
  })

  ctx.body = {
    success: true
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
    res
  }
}

//发帖
exports.addPost = async function(ctx, next) {
  //TODO: redis 里获取userid
  let user_id = 0
  let {topic_id,title,content} = ctx.request.body

  let res = await Topic.findByPk(topic_id)
  console.log(res)
  if(!res && res.status >0 ) {
    return
  }

  await Post.create({
    topic_id,
    title,
    content,
    user_id,
    topic_name: res.name
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
//获取帖子
exports.getPost = async function (ctx, next) {
  let {page} = ctx.query
  let data = await Post.findAll({where: {status:0},order: [['created_at', 'desc']]})

  ctx.body = {
    success: true,
    data
  }
}
//添加评论
exports.addComment = async function(ctx, next) {
  let {content,post_id,parent_id} = ctx.request.body
  let user_id = 0
  if(!parent_id) {
    parent_id = 0
  }
  await Comment.create({
    post_id,
    parent_id,
    content,
    user_id
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

  await res.update({status: 0})
  ctx.body = {
    success: true
  }
}

//获取评论
exports.getComment = async function(ctx, next) {
  let {post_id} = ctx.query
  let post = await Post.findByPk(post_id)
  if(!post) {
    return
  }

  let res = await Comment.findAll({where: {status: 0,post_id}})
  post.update({comment: 1})
  ctx.body = {
    success: true,
    list: res
  }
}

exports.up = async function(ctx, next) {
  let {id,type} = ctx.request.body
  let user_id = 0
  if(type === 'post') {
    let res = await Post.findByPk(id)
    if(!res) {
      return
    }
    await res.update({up: 1})
    console.log(res.dataValues.user_id)
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
  let user_id = 0
  let res = await Message.findAll({where: {to_user_id: user_id}})

  ctx.body = {
    success: true,
    data: res
  }
}