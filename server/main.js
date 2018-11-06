var net = require('net')    //引入网络模块
var app = require('http').createServer(handler)
var io = require('socket.io')(app);
var fs = require('fs');
var http = require('http');
var mysql = require('mysql');

var sqlite3 = require('sqlite3');  
var values = require('object.values');

var sessions={};
var socket_table={};
var tcp_table=new Set();
var tcp_session={};
var ss;
var HOST = '0.0.0.0';     //定义服务器地址
var PORT = 6666;            //定义端口号
var buff;//tcp缓冲区
var socket_id;
var gps_info;

/*
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'arrival',
  password : 'arrivalzxcvbnm,./',
  database : 'arrival'
});
*/

var pool = mysql.createPool({
    protocol : 'mysql',
    host     : 'localhost',
    port     :  3306,
    user     : 'root',
    password : 'zhou,./0810',
    database : 'arrival',
    connectionLimit:100 //最大连接数
})

function bufToArray(buffer) {
  let array = new Array();
  for (data of buffer.values()) array.push(data);
  return array;
}

//tcp数据包解析
function session_parse(session_data)
{
    //console.log(session_data);
    if(session_data[1]==0x78&&session_data[session_data.length-2]==0x0d
        &&session_data[session_data.length-1]==0x0a)//判断完整数据包
    {
        return new Map([['protocol',session_data[3]],['data',session_data.slice(4,session_data.length-2)]]);
    }else
    {
        return null;
    }
}

function gps_parse(gps_data)
{
    var longitude;//经度
    var latitude;//纬度
    var speed=gps_data[15];
    var gps_state=(gps_data[16]&0x10)>>4;
    var satellite_num=gps_data[6]&0x0F;//微信数量
    var direction=(gps_data[16]&0x03)<<8+gps_data[17];//航向
    var wd;//东经0，西经2，南纬0，北纬1
    switch((gps_data[16]&0x0C)>>2)
    {
        case 0:
            wd='es';
            break;
        case 1:
            wd='en'
            break;
        case 2:
            wd='ws'
            break;
        case 3:
            wd='wn'
            break;
    }
    longitude=parseInt(gps_data.slice(7,11).toString('hex'),16);
    latitude=parseInt(gps_data.slice(11,15).toString('hex'),16);
    longitude=longitude/60/30000.0;
    latitude=latitude/60/30000.0;
    return new Map([['longitude',longitude],['latitude',latitude],['speed',speed],['wd',wd],
        ['gps_state',gps_state],['satellite_num',satellite_num],['direction',direction]]);
}

function str2hexCharCode(str)
{
    let tmp='';
    for (var i = 0; i <str.length; i++) {
       tmp+=str[i].charCodeAt().toString(16);
    }
    return tmp;
}

function getLocation(socket,wifi_values,wifi_length,lbs_values,gsm_mode,lbs_length)
{
    //https://us1.unwiredlabs.com/v2/process.php
    var mcc = gsm_mode[0]*256+gsm_mode[1];
    var mnc = gsm_mode[2];
    var lac = 10342;
    var cid = 3873;
    /*
    var json = {
        'token': '95a94f53b5b5c3',
        'radio': 'gsm',
        'mcc': mcc,
        'mnc': mnc,
        'cells': [],
        'wifi': []
    };
    */
    var json={
      "homeMobileCountryCode": mcc,
      "homeMobileNetworkCode": mnc,
      "radioType": "gsm",
      //"carrier": "Vodafone",
      "considerIp": "true",
      "cellTowers": [
        // See the Cell Tower Objects section below.
      ],
      "wifiAccessPoints": [
        // See the WiFi Access Point Objects section below.
      ]
};

    //for(i=0;i<lbs_length;i++)
    for(i=0;i<1;i++)    
    {
        lac = lbs_values[i*5]*256+lbs_values[i*5+1];
        cid = lbs_values[i*5+2]*256+lbs_values[i*5+3];
        json.cellTowers.push({'locationAreaCode':lac,'cellId':cid,'mobileCountryCode':mcc,'mobileNetworkCode':mnc});
    }
    console.log('wifi',wifi_values);
    for(i=0;i<wifi_length;i++)
    {
        let bssid='';
        var tmp = wifi_values.slice(i*7,i*7+7);
        for (var j = 0; j < tmp.length; j++) {
            bssid+=tmp[j].toString(16);
            if(j < tmp.length-1)
                bssid+=':';
        }
        json.wifiAccessPoints.push({'macAddress':bssid});
        console.log('bssid',bssid);

    }
    var contents = JSON.stringify(json);
    //https://us1.unwiredlabs.com/v2/process.php
    var options = {
        host:'45.78.36.37',
        path:'/lbsapi.php',
        method:'POST',
        headers:{
            'Content-Type':'application/json',
            'Content-Length':contents.length
        }
    }


    var req = http.request(options, function(res){
    res.setEncoding('utf8');
    res.on('data',function(data){
        
        let res_json=JSON.parse(data);
        if(res_json.hasOwnProperty('location'))
        {
            let lat=res_json.location.lat;
            let lon=res_json.location.lng;
            if(lat>0)
                lat='+'+lat;
            else
                lat=''+lat;
            if(lon>0)
                lon='+'+lon;
            else
                lon=''+lon;
            let send_data=str2hexCharCode(lat)+'2C'+str2hexCharCode(lon);
            let send_buff='7878'+send_data.length.toString(16)+'69'+send_data+'0d0a';
            socket.write(new Buffer(send_buff,'hex'));
            console.log(str2hexCharCode(lat)+'2C'+str2hexCharCode(lon));
            console.log(lat,lon);
            //connection.connect();
 
            var  addSql = 'INSERT INTO location_info(id,hardware_id,lac,cid,lat,lon) VALUES(0,?,?,?,?,?)';
            var  addSqlParams = [socket.id,lac,cid,lat,lon];
            pool.getConnection(function(err,conn){
                if(err){
                    //do something
                }
                conn.query(addSql,addSqlParams,function (err, result) {
                if(err){
                 console.log('[INSERT ERROR] - ',err.message);
                 return;
                }        

               console.log('--------------------------INSERT----------------------------');
               //console.log('INSERT ID:',result.insertId);        
               console.log('INSERT ID:',result);      
               console.log('-----------------------------------------------------------------\n\n');  
                conn.release(); //释放连接
                });
            });
            /*
            //增
            connection.query(addSql,addSqlParams,function (err, result) {
                if(err){
                 console.log('[INSERT ERROR] - ',err.message);
                 return;
                }        

               console.log('--------------------------INSERT----------------------------');
               //console.log('INSERT ID:',result.insertId);        
               console.log('INSERT ID:',result);        
               console.log('-----------------------------------------------------------------\n\n');  
            });

            connection.end();
            */
            socket.write(data);
        }
        else
        {
            console.log("Error");
        }
        console.log('data:',data);   //一段html代码
    });
    });
    console.log(contents);
    req.write(contents);
    req.end;

}
console.info('Server is running on port ' + PORT);
var server = net.createServer();

//监听连接事件
server.on('connection', function(socket) {
    var client = socket.remoteAddress + ':' + socket.remotePort;
    console.info('Connected to ' + client);
    //监听数据接收事件
    socket.on('data', function(data) {
            console.log(new Buffer(data).toString('hex'));
            session_data=session_parse(data);
            console.log(session_data);
            switch(session_data.get('protocol'))
            {
                case 0x01://设备登陆
                    socket.id = session_data.get('data').toString('hex');
                    let  addSql = 'SELECT hardware_id FROM hardcore_info where hardware_id = ?';
                    let  addSqlParams = [socket.id];

                    //let  addSqlParams = [socket.id,lac,cid,lat,lon];
                    pool.getConnection(function(err,conn){
                        if(err){
                            //do something
                        }
                        conn.query(addSql,addSqlParams,function (err, result) {
                        if(err){
                         console.log('[INSERT ERROR] - ',err.message);
                         return;
                        }               
                        console.log(result);
                        console.log(result.length);
                       if(result.length==0)
                       {
                            let  addSql = 'INSERT INTO hardcore_info(id,hardware_id) VALUES(0,?)';
                            let  addSqlParams = [socket.id];
                            conn.query(addSql,addSqlParams,function (err, result) {
                            if(err){
                             console.log('[INSERT ERROR] - ',err.message);
                             return;
                            }        

                           console.log('--------------------------INSERT----------------------------');
                           //console.log('INSERT ID:',result.insertId);        
                           console.log('INSERT ID:',result);      
                           console.log('-----------------------------------------------------------------\n\n');  
                             })

                       }
                       console.log('-----------------------------------------------------------------\n\n');  
                        conn.release(); //释放连接
                        })
                    });

                    console.log(socket.id);
                    tcp_table.add(socket.id);

                    console.log(tcp_table);
                    socket.write(Buffer.from('787801010D0A','hex'));
                    tcp_session[socket.id]=socket;
                    socket.write(Buffer.from('78780397005A0D0A','hex'));
                    socket.write(Buffer.from('78780213010D0A','hex'));
                    break;
                case 0x10://GPS定位数据
                    gps_info=gps_parse(session_data.get('data'));
                    console.log(gps_info.get('longitude'),gps_info.get('latitude'),gps_info.get('speed'),gps_info.get('wd'),
                        gps_info.get('direction'),gps_info.get('satellite_num'),gps_info.get('gps_state'));
                    console.log("id"+socket.id);
                    break;
                case 0x08://心跳包,更新在线状态
                    break;
                case 0x13://状态包,加入数据库电量信息session_data.get['data'][1],
                          //上传时间信息session_data.get['data'][2,session_data.get['data'].length-2]
                    console.log("状态：",session_data.get('data')[0]
                        ,session_data.get('data')[1,session_data.get('data').length-2]);
                    socket.write(Buffer.from('787801800D0A','hex'));
                    break;
                case 0x14://设备休眠
                    break;
                case 0x15://恢复出厂设置
                    break;
                case 0x69://wifi+lbs
                    //获取Wi-Fi定位信息
                    let wifi_values = session_data.get('data').slice(6,6+7*data[2]);//单个数据长度为7
                    let lbs_values = session_data.get('data').slice(10+7*data[2],55+36*data[2]);//获取基站信息,单个数据长度为5
                    let wifi_length = data[2];
                    let lbs_length = data[data[2]*7+10];
                    let gsm_mode = data.slice(data[2]*7+11,data[2]*7+14);
                    console.log(gsm_mode[0]*256+gsm_mode[1]);
                    //通过wifi和ibs进行定位
                    getLocation(socket,wifi_values,wifi_length,lbs_values,gsm_mode,lbs_length);

                    break;
                default:
                    break;
            }

            //console.log(socket);
            });

    //监听连接断开事件
    socket.on('end', function() {
        console.log('Client disconnected.');
        tcp_table.delete(socket.id);
        console.log(tcp_table);
    });
});

//TCP服务器开始监听特定端口
server.listen(PORT, HOST);


app.listen(9999);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.on('connection', function (socket) {
    console.log("connection");
    socket.emit('news',{login:"login"});
    socket.on('login', function (data) {
        if(typeof(data)!='object')
            data=JSON.parse(data);
        sessions[data.phone]=socket;
        socket_table[socket.id]=data.phone;
        console.log(data);
        socket.emit("login",data);
        console.log(socket_table);
        var db = new sqlite3.Database('./db/sessions.db',function() {
            db.all("select * from message where to_user=?",[data.phone],function(err,res){
            if(!err)
                res.forEach((row) => {
                    socket.emit('message',JSON.stringify({from:row.from_user,message:row.message}));
                    db.run("delete from message where id=?",[row.id]);
                });
            else
              console.log(err);
            });
            db.close();
        });
        


      });
      //接收消息
      socket.on('message', function (data) {
        if(typeof(data)!='object')
          data=JSON.parse(data);
        console.log("socket");
        if(values(socket_table).includes(data.phone))
        {
            console.log("send");
            sessions[data.phone].emit('message',JSON.stringify({from:socket_table[socket.id],content:data.message}));
        }
        else
        {
            console.log("save");
            if(typeof(data.message=='object'))
                ss=JSON.stringify(data.message);
            else
                ss=data.message;
            var db = new sqlite3.Database('./db/sessions.db',function() {
            db.run("insert into message values(NULL,?,?,?)",[socket_table[socket.id],data.phone,ss]
                ,function(){db.close();})}); 
            console.log(typeof(data.message));
        }
      });

    socket.on('function', function (data) {
        if(typeof(data)!='object')
          data=JSON.parse(data);
        console.log("function");
        let time1;
        let time2;
        time1=new Date();
        time2=new Date(time1-data.time*1000);
        var  addSql = 'SELECT lat,lon,time FROM location_info where hardware_id=? and time<? and time>?';
        var  addSqlParams = [data.hardware_id,time1,time2];
        console.log(time1,time2);
        pool.getConnection(function(err,conn){
            if(err){
                //do something
            }
            conn.query(addSql,addSqlParams,function (err, result) {
            if(err){
             console.log('[INSERT ERROR] - ',err.message);
             return;
            }        

           console.log('--------------------------INSERT----------------------------');
           //console.log('INSERT ID:',result.insertId);        
            //console.log('INSERT ID:',result);
                let this_send_buff=[];      
                for (var i=0; i<result.length; i++) {          
                    let firstResult = result[i];
                    this_send_buff.push({'lat':firstResult.lat,'lon':firstResult.lon,'time':firstResult.time});
                }
                console.log(this_send_buff);
                sessions[data.phone].emit('message',JSON.stringify(this_send_buff)); 
           console.log('-----------------------------------------------------------------\n\n');  
            conn.release(); //释放连接
            });
        });

      });

      //删除连接
      socket.on('disconnect', function (data) {
        //if(typeof(data)!='object')
        //  data=JSON.parse(data);
        console.log("disconnect");
        delete sessions[socket_table[socket.id]];
        delete socket_table[socket.id];
        console.log(socket_table);

      });

});
