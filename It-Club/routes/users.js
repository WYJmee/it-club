var express = require('express');
var moment=require('moment');
var formidable=require('formidable');
var crypto=require('crypto');
var path=require('path');
var fs=require('fs');
var gm=require('gm');
var router = express.Router();

var db=require('../models/db.js');

/*默认自带加多了/users*/

/*用户个人中心首页*/
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/*用户发表内容*/
router.post('/posts',function (req,res) {
  var content=req.body.content;
  var title=req.body.title;
  db.insertMany("contents",[{"username":req.session.users[0].username,"title":title,"content":content,"time":moment().format('YYYY-MM-DD HH:mm:ss'),"click":0,"comments":[]}],function (err,r) {
    if(err){
      console.log(err);
      res.send("-1");
      return;
    }
    res.send("1");
  });
});

/*show用户个人头像页面*/
router.get('/setavatar',function (req,res) {
  res.render("setavatar",{"users":req.session.users,"active":"index"});
});

/*修改用户的个人头像   回调地狱*/
router.post('/setavatar',function (req,res) {
  var form = new formidable.IncomingForm();
  form.uploadDir='./public/images/tempup';

  form.parse(req,function (err,fileds,files) {
    if(err){
      console.log('未知错误');
      return;
    }
    var size=parseInt(files.img.size);
    if(size>10 * 1024 * 1024){
      res.send('图片的大小不要超过10M');
      fs.unlink(files.img.path);
      return;
    }
    res.locals={
      "time":  moment().format('YYYYMMDD'),
      "random": parseInt(Math.random()*10000+10000),
      "extname": path.extname(files.img.name),
      "oldPath": path.normalize(__dirname+'/../'+files.img.path)
    };
    res.locals.newpath=path.normalize(__dirname+"/../public/images/avatar/"+req.session.users[0].username+res.locals.extname);
    // fs.rename 附带一个移动文件的功能
    fs.rename(res.locals.oldPath,res.locals.newpath,function (err) {
      if(err){
        console.log('改名失败');
        return;
      }
      db.updateMany("users",{"username":req.session.users[0].username},{$set:{"avatar":"/images/avatar/"+req.session.users[0].username+res.locals.extname}},function (err,r) {
          console.log(r);
          if(err){
            console.log('用户头像,数据库修改失败');
            return;
          }
          req.session.users[0].avatar="/images/avatar/"+req.session.users[0].username+res.locals.extname;
          res.redirect('back');
      });
    })

  });
});

/*show 裁剪预览效果页面*/
router.get('/cutavatar',function (req,res) {
  res.render('cutavatar',{"avatar":req.session.users[0].avatar});
});

/*图片裁剪功能*/
router.get('/docut',function (req,res) {
  res.locals.w=req.query.w;
  res.locals.h=req.query.h;
  res.locals.x=req.query.x;
  res.locals.y=req.query.y;
  res.locals.filePath=req.session.users[0].avatar;

  gm("./public"+res.locals.filePath)
      .crop( res.locals.w, res.locals.h, res.locals.x,res.locals.y)
      .resize(100,100,"!")
      .write("./public"+res.locals.filePath,function (err) {
        if(err){
          res.send("-1");
          return;
        }
        res.send('1');
      })
});

/*show 用户个人中心页面*/
router.get('/userinfo',function (req,res) {
    db.find("users",{},function (err,doc) {
        if(err){
            console.log(err)
        }else {
            res.render('userinfo',{"users":req.session.users,"active":"userinfo","countUsers":doc});
        }
    })
});

router.post("/userinfo",function (req,res) {
    res.locals={
        "username":req.body.username,
        "age":req.body.age,
        "sex":req.body.sex,
        "password":req.body.password
    };
    var md5=crypto.createHash('md5');
    var sbt=parseInt(res.locals.password)*10000+res.locals.username;
    var scretPsw=md5.update(sbt).digest('hex');
    db.updateMany("users",{"username":req.session.users[0].username},{$set:{"username":res.locals.username,"sex":res.locals.sex,"age":res.locals.age,"psw":scretPsw}},function (err,result) {
        if(err){
            console.log(err)
        }else{
            db.updateMany("contents",{"username":req.session.users[0].username},{$set:{"username":res.locals.username}},function (err,r) {
                if(err){
                    console.log(err)
                }
                else {
                    req.session.users[0].username=res.locals.username;
                    req.session.users[0].age=res.locals.age;
                    req.session.users[0].sex=res.locals.sex;
                    res.redirect("back")
                }
            })
        }

    })
})
//查询用户个人资料界面
router.get("/:name",function (req,res) {
    db.find("users",{"username":req.params.name},function (err,result) {
        if(err){
            console.log(err);
        }else{
            db.find("contents",{"username":result[0].username},function (err,doc) {
                if(err){
                    console.log(err);
                }else {
                    console.log(result,doc)
                    res.render("users",{"active":req.params.name,"username":result[0].username,"sex":result[0].sex,"age":result[0].age,"avatar":result[0].avatar,"contents":doc,"time":doc})
                }
            })
        }
    })

})


module.exports = router;
