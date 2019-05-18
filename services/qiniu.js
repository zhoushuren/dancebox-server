var qiniu = require("qiniu");
//需要填写你的 Access Key 和 Secret Key
qiniu.conf.ACCESS_KEY = 'SRP3n9QDnbdss_8LXaUK1fTyz_jZjgWWdNzSU-zq';
qiniu.conf.SECRET_KEY = 'YTbx6x03Dsi_fOPAUFYk-JNvgbfWkskCzX-VkuHV';
const bucket = 'wx';

exports.uploadQiniu = function (file_name) {
  const mac = new qiniu.auth.digest.Mac();
  const options = {
    scope: bucket,
  }
  const putPolicy = new qiniu.rs.PutPolicy(options);

  const uploadToken = putPolicy.uploadToken(mac);
  const config = new qiniu.conf.Config();
  const localFile = "./upload/" + file_name;
  const formUploader = new qiniu.form_up.FormUploader(config);
  const putExtra = new qiniu.form_up.PutExtra();

//file
  formUploader.putFile(uploadToken, file_name, localFile, putExtra, function(respErr, respBody, respInfo) {
    if (respErr) {
      throw respErr;
    }

    if (respInfo.statusCode == 200) {
      console.log(respBody);
      //传成功，删除本地图片
    } else {
      console.log(respInfo.statusCode);
      console.log(respBody);
    }
  })
}
