//消息服务

const WebSocket = require('ws')

const ws = new WebSocket.Server({ noServer: true })
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

  })
  connection.on('close', function(reasonCode, description) {

  })

});

module.exports = ws