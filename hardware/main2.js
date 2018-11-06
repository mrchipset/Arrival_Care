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
var PORT = 3000;            //定义端口号
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




app.listen(8888);

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
    socket.on('login', function (data) {
        console.log("login");
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
