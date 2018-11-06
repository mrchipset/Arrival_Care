var net = require('net');   //引入网络模块
var HOST = '111.231.231.145';     //定义服务器地址
var PORT = 3000;            //定义端口号
//创建一个TCP客户端实例
var client = net.connect(PORT, HOST, function() {
    console.log('Connected to the server.');
    for (var i = 0; i < 1; i++) {
    	client.write(new Buffer('787801010ABB0E0D0A','hex'));
    }
        client.write(new Buffer('787812100A03170F32179C026B3F3E0da028c01F34600D0A','hex'));

});

//监听数据传输事件
client.on('data', function(data) {
    //console.log(new Buffer(data).toString('hex'));
    console.log(new Buffer(data).toString('hex'));

    //client.destroy();

});

//监听连接关闭事件
client.on('end', function() {
    console.log('Server disconnected.');
    console.log();
});


process.stdin.setEncoding('utf8');

process.stdin.on('readable', () => {
  const chunk = process.stdin.read();
  if (chunk !== null) {
    client.write(new Buffer(chunk,'hex'));
  }
});

process.stdin.on('end', () => {
  process.stdout.write('end\r\n');
});
