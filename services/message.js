//消息服务

const WebSocket = require('ws')
const redis = require('../redis')
const ws = new WebSocket.Server({ noServer: true })

const ConnectionList = {} //连接的闭包

ws.on('connection', function connection(connection) {
  // let timer = setInterval(async()=>{
  //   if (instance.state.pair ) {
  //     for (let key in instance.func) {
  //       let result = await instance.func[key](instance.state.pair )
  //       connection.send(JSON.stringify(result));
  //     }
  //   }
  // },1000)

  connection.on('message', function incoming(message) {
    console.log('1111')
    console.log(message)
    // TODO: 验证sessiontoken
    let user_id = 0 //这个用户建立连接
    ConnectionList[ 'function_' +user_id] = function(data) {
      connection.send(JSON.stringify(data))
    }
  })
  connection.on('close', function(reasonCode, description) {

  })

});

//消息类型

/*
*
* 1 帖子评论
* 2 收到回复
* 3 赞
* */

//给哪个userid发消息
async function setMessage(message, user_id) {
  let obj = {
    type: message.type,
    content: message.content,
    time: Date.now(),

  }
  console.log(obj)
  console.log(ConnectionList[ 'function_' +user_id])
  await redis.lpush('message:' +user_id , JSON.stringify(obj))

  if(ConnectionList[ 'function_' +user_id]) {
    let len = await redis.llen('message:' +user_id)
    console.log(len)
    ConnectionList[ 'function_' +user_id](len)
  }
}

module.exports = {
  ws,
  setMessage
}