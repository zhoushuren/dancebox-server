
const rp = require('request-promise')

const User = require('../model/User')

const appid = 'wx792ead777e9681e6'
const appSecret = '37dfd9ca4d64c9ba4d848141061ca0de'

exports.login = async function (ctx, next) {
  console.log('post:', ctx.request.body.code)
  const {code} = ctx.request.body
//  https://api.weixin.qq.com/sns/jscode2session?appid=APPID&secret=SECRET&js_code=JSCODE&grant_type=authorization_code

  let res = await rp({
    uri:  `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`,
    json: true
  })

  // console.log(res)

  let result = await User.findOne({where: {open_id: res.openid}})

  if(result) {

  }else{
    User.create({
      open_id: res.openid,
      session_key: res.session_key
    })
  }

  ctx.body = {
    success: true
  }
}