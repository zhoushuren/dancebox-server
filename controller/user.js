
const rp = require('request-promise')
const crypto = require('crypto')
const User = require('../model/User')
const AuthData = require('../model/AuthData')
const redis = require('../redis')
const randomstring = require('randomstring')
const appid = 'wx792ead777e9681e6'
const appSecret = '37dfd9ca4d64c9ba4d848141061ca0de'

exports.sessionKey = async function (ctx, next) {
  // console.log('post:', ctx.request.body.code)
  const {code} = ctx.request.body
//  https://api.weixin.qq.com/sns/jscode2session?appid=APPID&secret=SECRET&js_code=JSCODE&grant_type=authorization_code

  let res = await rp({
    uri:  `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`,
    json: true
  })

  ctx.body = {
    success: true,
    session_key: res.session_key,
    open_id: res.openid,
  }
}

const appId = 'wx792ead777e9681e6'
//微信小程序，传用户信息,需要签名验证
exports.login = async function(ctx) {
  let obj = ctx.request.body
  // console.log(obj)
  if(obj.errMsg !== 'getUserInfo:ok') {
    return
  }
  const encryptedData = obj.encryptedData
  const sessionKey = obj.session_key
  const iv = obj.iv

  const pc = new WXBizDataCrypt(appId, sessionKey)

  const data = pc.decryptData(encryptedData , iv)

  let result = await AuthData.findOne({where: {open_id: data.openId}})
  let session = randomstring.generate(128)
  if(result === null) {
    let user = await User.create({
      nick_name: data.nickName,
      gender: data.gender,
      language: data.language,
      city: data.city,
      province: data.province,
      country: data.country,
      avatar: data.avatarUrl
    })

    await AuthData.create({
      open_id: data.openId,
      session_key: data.session_key,
      type: 0,
      user_id: user.id
    })

    await setSession(session,user.id)
    ctx.body = {session_token: session}
    return
  }
  await setSession(session, result.dataValues.user_id)
  ctx.body = {session_token: session}
}

exports.list = async function(ctx) {
  let {page} = ctx.query
  let where = {}
  let res = await User.findAll({where})

  ctx.body = {
    success: true,
    list: res
  }
}

// 解密算法
function WXBizDataCrypt(appId, sessionKey) {
  this.appId = appId
  this.sessionKey = sessionKey
}

WXBizDataCrypt.prototype.decryptData = function (encryptedData, iv) {
  // base64 decode
  var sessionKey = new Buffer(this.sessionKey, 'base64')
  encryptedData = new Buffer(encryptedData, 'base64')
  iv = new Buffer(iv, 'base64')

  try {
    // 解密
    var decipher = crypto.createDecipheriv('aes-128-cbc', sessionKey, iv)
    // 设置自动 padding 为 true，删除填充补位
    decipher.setAutoPadding(true)
    var decoded = decipher.update(encryptedData, 'binary', 'utf8')

    decoded += decipher.final('utf8')

    decoded = JSON.parse(decoded)

  } catch (err) {
    console.error(err)
    throw new Error('Illegal Buffer')
  }

  if (decoded.watermark.appid !== this.appId) {
    throw new Error('Illegal Buffer')
  }

  return decoded
}

//生成 session
async function setSession(session, user_id) {

  let sessionUserHash = {
    user_id
  }

  let oldSession = await getSession(user_id)
  if (oldSession) {
    await delSession(oldSession)
  }
  return await redis.multi().hmset('session:' + session, sessionUserHash).exec()
}
async function getSession(user_id) {
  return await redis.get('us:' + user_id)
}

async function delSession(session) {
  await redis.del('session:' + session)
}
