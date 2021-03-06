const  formidable = require('formidable')
const fs = require('fs')
const util = require('util')
// const formParse = Promise.promiseify(form.parse)
const path = require('path')
const randomstring = require('randomstring')
const send = require('koa-send');

const filePath = '/activity_img/img/'
const imgHost = process.env.IMGURL || 'http://127.0.0.1:3007'

exports.img = async function(ctx, next) {
    let obj = await formParse(ctx.req)
    ctx.status = 201
    ctx.body = {
        success: true,
        ...obj
    }
}

function formParse(req) {
    return new Promise((resolve, reject) => {
        const form = new formidable.IncomingForm()
        const targetFile = path.join(__dirname,'../upload');
        form.uploadDir = targetFile;
        form.parse(req, function(err, fields, files) {
            if(err) {
                reject(err)
            } else {
                const oldpath = files.file.path;

                const fileExtension = files.file.name.split('.').pop().toLowerCase();
                const fileName = randomstring.generate(16) + '.' + fileExtension
                const newpath = targetFile + '/' + fileName
                fs.rename(oldpath,newpath,(err)=>{
                    if(err) throw err;
                    resolve({
                        msg: '图片上传并改名成功',
                        file_name: filePath + fileName,
                        img_url: imgHost + filePath + fileName
                    })
                })

            }
        })
    })
}

exports.getImg = async function(ctx, next) {
    const targetFile = '/upload' +  '/' + ctx.params.name
    await send(ctx, targetFile);
}


// function test(file_path) {
//     const token = uptoken(bucket, file_path)
//     uploadFile(token,)
// }
// test('0fwqy5ZHbnbMq0P5.jpg')
