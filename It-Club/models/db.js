/**
 * Created by Administrator on 2017/8/3.
 */
var MongoClient=require('mongodb').MongoClient;
var url=require('./setting.js');


//下划线,表示内部函数

//第一大类封装方法
function __connectdb(callback) {
    MongoClient.connect(url.dburl,function (err,db) {
       if(err){
           callback(err,null);
           return;
       }
       callback(null,db);
        //db.close(),  当我回调完之后,就吧数据库连接关闭,我只后的增删操作都会失败
    });
}

//向外暴露一个增的数据库操作方法
//集合名,数据项(json)
exports.insertMany=function (collectionName,json,callback) {
  __connectdb(function (err,db) {
      if(err){
          console.log('数据库连接失败');
          db.close();
          return;
      }
      db.collection(collectionName).insertMany(json,function (err,result) {
          if(err){
              callback(err,null);
              db.close();
              return;
          }
          callback(null,result);
          db.close();  //关闭数据库连接
      })
  })
};

//查找数据  json一个已经写好json格式
//类似于c++函数重载方法 
exports.find=function (collectionName,json,C,D) {
    if (arguments.length==3){
        var callback=C;
        var skipNumber=0;
        var limitNumber=0;
    }else if(arguments.length==4){
        var callback=D;
        var args=C;
        var skipNumber=args.skipNumber || 0;
        var limitNumber=args.limit || 0;
    }else {
        throw new Error("find函数的参数必须三个或者四个");
        return;
    }
  __connectdb(function (err,db) {
      if(err){
          callback(err,null);
          db.close();
          return;
      };
      //db.collection(collectionName).find(json) 在mongodb模块找出的不是结果集 toArray 是mongodb的方法
   // db.collection(collectionName).find(json).toArray(function (err,doc) {
   //       if(err){
   //           callback(err,null);
   //    db.close();
   //           return;
   //       }
   //       callback(null,doc);
   //   })
      //第二种方法  只是少了一层回调
      //  db.collection(collectionName).find(json).toArray(callback)
      // 第三种方法
      var arr=[];
      var R=db.collection(collectionName).find(json).skip(skipNumber).limit(limitNumber);
      R.each(function (err,doc) {
          if(err){
                         callback(err,null);
                         db.close();
                         return;
                    }
          //我的遍历还没走完
         if(doc != null){
              arr.push(doc);
          }else {
              callback(null,arr);
              db.close();
          }
      })
  })  
};

//删除
exports.deleteMany=function (collectionName,json,callback) {
    __connectdb(function (err,db) {
        if(err){
            console.log('数据库连接失败');
            db.close();
            return;
        }
        db.collection(collectionName).deleteMany(json,function (err,result) {
            if(err){
                callback(err,null);
                db.close();
                return;
            }
            callback(null,result);
            db.close();  //关闭数据库连接
        })
    })
};

//删除 json1 查询  json2 修改内容
exports.updateMany=function (collectionName,json1,json2,callback) {
    __connectdb(function (err,db) {
        if(err){
            console.log('数据库连接失败');
            db.close();
            return;
        }
        //看个人  {$set:json2}
        db.collection(collectionName).updateMany(json1,json2,function (err,result) {
            if(err){
                callback(err,null);
                db.close();
                return;
            }
            callback(null,result);
            db.close();  //关闭数据库连接
        })
    })
};

//获取数据库总数
exports.getCount = function (collectionName,callback) {
  __connectdb(function (err,db) {
      if(err){
          callback(err,null);
          db.close();
          return;
      };
      db.collection(collectionName).count(function (err,count) {
          if(err){
              callback(err,null);
              db.close();
              return;
          };
          callback(null,count);
          db.close();
      })
  })
};

//第二大类封装方法
/*
function studentScore(name,number,kecheng) {
    name=this.name;
    number=this.number;
}
studentScore.insert=function () {
    
};
module.exports=studentScore;*/
