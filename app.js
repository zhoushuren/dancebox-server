
const Koa = require('koa')
const bodyParser = require('koa-bodyparser')

const {  staticRouter, router} = require('./routers')

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
app.listen(port,host)
// logger.info('user-center server restart')
