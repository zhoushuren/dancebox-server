
const moment = require('moment')
const Sequelize = require('sequelize')
const Op = Sequelize.Op
const Topic = require('../model/Topic')
const Post = require('../model/Post')
const Comment = require('../model/Comment')
const Message = require('../model/Message')
const Report = require('../model/Report')
const redis = require('../redis')
const {getUserInfoBySession} = require('../services/authService')
const setMessage = require('../services/message')
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
  let {page} = ctx.query
  let res = await Topic.findAll({where: {status: 0}})
  ctx.body = {
    success: true,
    list: res.map(val => {
      return {
        id: val.dataValues.id,
        name: val.dataValues.name,
        desc: val.dataValues.desc,
        post_count: val.dataValues.post_count,
        view_count: val.dataValues.view_count,
        sort: val.dataValues.sort,
        banner: activityImgURL + val.dataValues.banner,
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
  await res.increment('view_count')
  ctx.body = {
    success: true,
    data: {
      id: res.dataValues.id,
      name: res.dataValues.name,
      desc: res.dataValues.desc,
      post_count: res.dataValues.post_count,
      view_count: res.dataValues.view_count,
      sort: res.dataValues.sort,
      banner: activityImgURL + res.dataValues.banner
    }
  }
}

//发帖
exports.addPost = async function(ctx, next) {
  let user_info = await getUserInfoBySession(ctx)

  if(!user_info.user_id) {
    return //没权限
  }
  let user_id = user_info.user_id
  let {topic_id,title,content,img_list} = ctx.request.body

  let res = await Topic.findByPk(topic_id)
  if(!res && res.status >0 ) {
    return
  }

  res.increment('post_count')

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
//时间格式
function formarTime(time) {
  let now = Date.now()
  let at = new Date(time).getTime()
  if((now - at) < 3600000 ) {
    return '刚刚'
  }
  if((now - at) < (3600000*24) ){
    return '几小时前'
  }
  if((now - at) < (3600000*24 *10) ){
    return '几天前'
  }
  return moment(time).format('MM月DD日')
}
//获取帖子列表
exports.getPostList = async function (ctx, next) {
  let {updated_at,topic_id} = ctx.query
  const where = {status: 0}
  if(topic_id) {
    where.topic_id = topic_id
  }

  if(updated_at != undefined) {
    where.updated_at =  {[Op.lt]: updated_at}
  }
  let data = await Post.findAll({where,order: [['updated_at', 'desc']],attributes:['user_avatar','id','topic_id', 'topic_name', 'title', 'up', 'comment', 'user_name', 'created_at', 'updated_at'],limit: 20})

  let list = data.map( val => {
    let format_time = formarTime(val.created_at)
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
        updated_at: val.updated_at,
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

  let data = await Post.findOne({where,attributes:['img_list','user_avatar','id','topic_id','content', 'topic_name', 'title', 'up', 'comment', 'user_name', 'created_at']})

  if(data.img_list) {
    try{
      data.img_list = JSON.parse(data.img_list)
    }catch (e) {
     console.error(e)
    }
  }

  data.increment('view_count')

  let format_time = formarTime(data.created_at)
  ctx.body = {
    success: true,
    data: {
      ...data.dataValues,
      format_time
    }
  }
}
//添加评论
exports.addComment = async function(ctx, next) {
  let {content,post_id,parent_id,img, reply_other_id} = ctx.request.body
  let user_info = await getUserInfoBySession(ctx)
  if(!user_info.user_id) {
    return //没权限
  }

  let post = await Post.findByPk(post_id)

  if(!post) {
    return //非法
  }
  let message_to_user_id = post.user_id //  消息发给谁,默认是楼主
  let other_user_name   //@谁? 默认回复的是楼主，不需要@
  if(parent_id) {
    // where.parent_id = parent_id
    let comment = await Comment.findByPk(parent_id)
    if(!comment){
      return //非法
    }
    other_user_name = comment.user_name
    await comment.increment('reply') //  父帖子的回复数量+1
    message_to_user_id = comment.user_id  // 回复的是这个楼，消息发给这个楼
  }
  let user_id = user_info.user_id
  if(!parent_id) {
    parent_id = 0
  }

  //小窗口里的对话
  if(reply_other_id) {
    let comment = await Comment.findByPk(reply_other_id)
    if(!comment){
      return //非法
    }
    other_user_name = comment.user_name
    message_to_user_id = comment.user_id  // 回复的是这个楼，消息发给这个楼
  }

  await Comment.create({
    post_id,
    parent_id,
    content,
    user_id,
    user_avatar: user_info.avatar,
    user_name: user_info.nick_name,
    img,
    other_user_name
  })
  await post.increment('comment')

  await setMessage({
    to_user_id: message_to_user_id,
    from_user_info: user_info,
    from_content: post.title.substr(0,16),
    content: content,
    type: 'comment',
    _id: post_id
  })

  ctx.body = {
    success: true
  }
}

//删除评论
exports.deleteComment = async function (ctx,next) {
  let {id} = ctx.query

  let user_info = await getUserInfoBySession(ctx)
  if(!user_info.user_id) {
    return //没权限
  }

  let res = await await Comment.findByPk(id)
  if(!res) {
    return
  }

  if(user_info.user_id != res.user_id) {
    console.log('没权限删除别人的帖子')
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
  let {post_id,parent_id,last_id} = ctx.query
  let post = await Post.findByPk(post_id)
  if(!post) {
    return
  }

  let user_info = await getUserInfoBySession(ctx)

  let where = {status: 0,post_id,parent_id: 0}

  if(parent_id>0) {
    where.parent_id = parent_id
  }

  if(last_id > 0) {
    where.id = {[Op.lt]: last_id}
  }
  let res = await Comment.findAll({where ,limit: 20, order: [['id', 'desc']]})

  if(!user_info.user_id) {
    ctx.body = {
      success: true,
      list: res
    }
  }else{
    //有用户， 需要显示是否是自己的帖子

    let upHash = await redis.hgetall('up:' + user_info.user_id + ':' + post.id)
    let list = res.map(val => {
      let my
      if(val.dataValues.user_id == user_info.user_id) {
        my = true
      }
      let format_time = formarTime(val.created_at)
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
        img: val.dataValues.img,
        other_user_name: val.dataValues.other_user_name,
        my,
        already_up: upHash[val.dataValues.id],
        format_time
      }
    })
    ctx.body = {
      success: true,
      list: list
    }
  }
}

exports.up = async function(ctx, next) {
  let {id,type,post_id} = ctx.request.body
  let user_info = await getUserInfoBySession(ctx)
  if( !user_info.user_id) {
    return //没权限
  }
  let user_id = user_info.user_id
  let post = await Post.findByPk(post_id)
  if(type === 'post') {
    if(!post) {
      return
    }
    await post.increment('up')
  }
  else if(type === 'comment') {
    let comment = await Comment.findByPk(id)
    if(!comment) {
      return
    }

    let [already_up] = await redis.hmget('up:' +user_id + ':' + post.id,  id)

    if(already_up === 'true') {
      await redis.del('up:' +user_id + ':' + post.id)
      ctx.body = {
        success: true,
        count: false
      }
      return
    }
    await comment.increment('up')
    let res = await redis.hmset('up:' +user_id + ':' + post.id,  id, true) //我赞了哪个帖子下面的哪个评论
    await setMessage({
      to_user_id: comment.user_id,
      from_user_info: user_info,
      from_content: comment.content.substr(0,16),
      content: '',
      type: 'up',
      _id: id
    })
    ctx.body = {
      success: true,
      count: true
    }
  }

}

exports.getMessage = async function(ctx, next) {
  let user_info = await getUserInfoBySession(ctx)
  if(!user_info.user_id) {
    return //没权限
  }
  let user_id = user_info.user_id

  let m_len = await redis.llen('message:' +user_id)

  if(m_len >0) {
    let newMessage = await redis.lrange('message:' + user_id, 0,  -1) //所有元素
    try{
      // {to_user_id,from_user_info,from_content, content,type }
      let message = newMessage.map(val => {
        let obj = JSON.parse(val)
        // console.log('jsonData:',obj)
        return {
          _id: obj._id,
          type: obj.type,
          to_user_id: obj.to_user_id,
          from_user_name: obj.from_user_info.nick_name,
          from_user_avatar: obj.from_user_info.avatar,
          from_user_id: obj.from_user_info.user_id,
          from_content: obj.from_content,
          content: obj.content,
        }
      })

      await Message.bulkCreate(message)
      await redis.del('message:' + user_id) //消息入库后删掉内存里的消息
    }catch (e) {
      console.error('json解析失败',e)
      console.log(newMessage)
    }
  }
  let res = await Message.findAll({where: {to_user_id: user_id},order: [['created_at','desc']]})

  let list = res.map(val => {
    let notice = ''

    if(val.type === 'comment') {
      notice = val.from_user_name + ' 评论了你'
    }

    if(val.type === 'up') {
      notice = val.from_user_name + ' 赞了你'
    }
    let format_time = formarTime(val.created_at)
    return {
      notice,
      _id: val._id,
      type: val.type,
      to_user_id: val.to_user_id,
      from_user_name: val.from_user_name,
      from_user_avatar: val.from_user_avatar,
      from_user_id: val.from_user_id,
      from_content: val.from_content,
      content: val.content,
      format_time
    }
  })

  ctx.body = {
    success: true,
    list: list
  }
}

exports.recommend = async function(ctx) {
  let {updated_at} = ctx.query
  const where = {status: 0, recommend: 1}

  if(updated_at != undefined) {
    where.updated_at =  {[Op.lt]: updated_at}
  }
  let data = await Post.findAll({where,order: [['updated_at', 'desc']],attributes:['content','user_avatar','id','topic_id', 'topic_name', 'title', 'up', 'comment', 'user_name', 'created_at', 'updated_at'],limit: 20})

  let list = data.map( val => {
    let format_time = formarTime(val.created_at)
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
      updated_at: val.updated_at,
      format_time: format_time
    }
  })
  ctx.body = {
    success: true,
    list: list
  }
}


exports.report = async function(ctx) {
  let {type,id, report_type} = ctx.request.body

  await Report.create({
    item_id: id,
    type,
    report_type
  })

  ctx.body = {
    success: true
  }
}

exports.count = async function(ctx) {
  let user_info = await getUserInfoBySession(ctx)
  if(!user_info.user_id) {
    return //没权限
  }

  let post = Post.count({where: {user_id: user_info.user_id}})
  let comment = Comment.count({where: {user_id: user_info.user_id}})

  let [res1, res2 ] = await Promise.all([post,comment])

  ctx.body = {
    post: res1,
    comment: res2
  }
}

exports.testMessage = async function (ctx) {

  await setMessage({
    type: 'up',
    content: 'test111111'
  })

  ctx.body = {
    success: true
  }
}
