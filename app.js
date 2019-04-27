
const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const url = require('url')
const {  staticRouter, router} = require('./routers')
const message = require('./services/message')
const app = new Koa()

// const upload = multer({ dest: 'uploads/' })

// app.use(rouer.post('/img', upload.single('avatar')))


app.use(async(ctx,next)=>{

    try{
        await next()
    }catch (e){
        console.error(e)
        ctx.body = {
            success: false,
            error: '服务器错误'
        }
    }
})

app.use(bodyParser())

app.use(router.routes()).use(router.allowedMethods())

app.use(staticRouter.routes()).use(staticRouter.allowedMethods())

const port = process.env.PORT || 3007
const host = process.env.HOST || '0.0.0.0'
const server = app.listen(port,host)
// logger.info('user-center server restart')

server.on('upgrade', function upgrade(request, socket, head) {
  const pathname = url.parse(request.url).pathname;
  if (pathname === '/ws') {
    message.handleUpgrade(request, socket, head, function done(connection) {
      message.emit('connection', connection, request);
    });
  } else {
    socket.destroy();
  }
});
