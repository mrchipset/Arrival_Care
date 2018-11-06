var http = require('http');
var querystring = require('querystring');
 


var json = {
    'token': '95a94f53b5b5c3',
    'radio': 'gsm',
    'mcc': 310,
    'mnc': 410,
    'cells': [{
        'lac': 7033,
        'cid': 17811
    }],
    'wifi': [{
        'bssid': '00:17:c5:cd:ca:aa',
        'signal': -51
    }]};

var contents = JSON.stringify(json);
//https://us1.unwiredlabs.com/v2/process.php
var options = {
    host:'us1.unwiredlabs.com',
    path:'/v2/process.php',
    method:'POST',
    headers:{
        'Content-Type':'application/x-www-form-urlencoded',
        'Content-Length':contents.length
    }
}



//https://us1.unwiredlabs.com/v2/process.php
var options = {
    host:'us1.unwiredlabs.com',
    path:'/v2/process.php',
    method:'POST',
    headers:{
        'Content-Type':'application/x-www-form-urlencoded',
        'Content-Length':contents.length
    }
}
 
var req = http.request(options, function(res){
    res.setEncoding('utf8');
    res.on('data',function(data){
        console.log('data:',data);   //一段html代码
    });
});
console.log(contents);
req.write(contents);
req.end;