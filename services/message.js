//消息服务

const rp = require('request-promise')
async function setMessage({to_user_id,from_user_info,from_content, content,type,_id }) {
  return await rp({
    uri: 'http://127.0.0.1:3001/message',
    method: 'POST',
    form: {
      to_user_id: to_user_id,
      from_user_info,
      from_content,
      content: content,
      type,
      _id
    },
    headers: {
      'cache-control': 'no-cache',
      'content-type': 'application/x-www-form-urlencoded'
    },
  })
}

module.exports = setMessage