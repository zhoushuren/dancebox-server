const  formidable = require('formidable')
const fs = require('fs')
const util = require('util')
// const formParse = Promise.promiseify(form.parse)


exports.img = async function(ctx) {
    const file = ctx.request.files;

    const form = new formidable.IncomingForm()
    // console.log(file)
    const formParse =  util.promisify(form.parse)
    // form.parse(ctx.req, function(err, fields, files) {
    //     console.log(files)
    //
    // })
    let obj = await formParse(ctx.req)
    console.log(obj)
    ctx.body = {

    }
}
