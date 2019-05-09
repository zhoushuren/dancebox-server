# DanceBox-server

API 接口

用户手机号注册

用户微信注册


后台用户登陆

显示用户列表接口



# 社区

话题表

id

name

banner

status


帖子表

id

user_name

user_avatar

title

content

img

created_at

status

up 赞

comment 评论


评论表



### 消息系统的设计

当发消息给用户的时候调用 setMessage方法，把消息推如reids的list内。每个用户用户一个redis key，类型为list的消息队列。

没推一个消息，把list的length通过 Websocket推送给用户。客户端显示出消息数量，点击消息数量为http请求获取消息列表，

这个http接口内做redis list 存Mysql，并清除list。返回Mysql里的消息列表

message:user_id ['{"type": "up", "content":"我爱你", ""}']

websocket 连接创建一个闭包，发消息执行闭包