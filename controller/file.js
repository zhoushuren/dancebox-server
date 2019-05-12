const  formidable = require('formidable')
const fs = require('fs')
const util = require('util')
// const formParse = Promise.promiseify(form.parse)
const path = require('path')
const randomstring = require('randomstring')
const send = require('koa-send');
var qiniu = require("qiniu");
//需要填写你的 Access Key 和 Secret Key
qiniu.conf.ACCESS_KEY = 'SRP3n9QDnbdss_8LXaUK1fTyz_jZjgWWdNzSU-zq';
qiniu.conf.SECRET_KEY = 'YTbx6x03Dsi_fOPAUFYk-JNvgbfWkskCzX-VkuHV';
const bucket = 'wx';

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

function uptoken(bucket, key) {
    console.log(bucket, key)
    const putPolicy = new qiniu.rs.PutPolicy(bucket+":"+key);
    return putPolicy.token();
}

//构造上传函数
function uploadFile(uptoken, key, localFile) {
    var extra = new qiniu.io.PutExtra();
    qiniu.io.putFile(uptoken, key, localFile, extra, function(err, ret) {
        if(!err) {
            // 上传成功， 处理返回值
            console.log(ret.hash, ret.key, ret.persistentId);
        } else {
            // 上传失败， 处理返回代码
            console.log(err);
        }
    });
}


exports.uploadQiniu = async function (file_path) {
    //生成上传 Token
    const token = uptoken(bucket, '/upload/'+file_path)
    uploadFile(token,)
}


function test(file_path) {
    const token = uptoken(bucket, file_path)
    uploadFile(token,)
}
test('0fwqy5ZHbnbMq0P5.jpg')
