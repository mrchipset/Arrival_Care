//https://github.com/websockets/ws/blob/master/doc/ws.md#new-wsserveroptions-callback
var WebSocketServer = require('ws').Server,
  wss = new WebSocketServer({
    port: 3000 //监听接口
  });

//广播
wss.broadcast = function broadcast(s,ws) {
  // console.log(ws);
  // debugger;
  wss.clients.forEach(function each(client) {
      if(s == 1){
        client.send("get");
      }

  });
};

// 初始化
wss.on('connection', function(ws) {
  // console.log(ws.clients.session);
  // console.log("在线人数", wss.clients.length);
  //ws.send('你是第' + wss.clients.length + '位');
  // 发送消息
  ws.on('message', function(data) {
	if(data!="Data Got!")
	{
  wss.clients.forEach(function each(client) {
     client.send("get");

  });    
}else
{
	  wss.clients.forEach(function each(client) {
     client.send("Data Got!");
});

}
  });
  // 退出聊天
  ws.on('close', function(close) {

  });
});
