//验证用户权限
const cookieParse = require('cookie-parse')
const redis = require('../redis')
exports.getUserInfoBySession = async function(ctx) {
  let session_token = ctx.req.headers.session_token
  console.log(session_token)
  if (session_token === undefined) {
    return null
  }
  // let cookies = cookieParse.parse(cookie)
  // let session_token = cookies.session_token
  return await redis.hgetall('session:' + session_token)
}