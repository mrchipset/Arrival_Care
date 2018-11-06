var request=require('request');

var options = {
	headers: {"Connection": "close"},
    url: 'http://45.78.36.37/lbsapi.php',
    method: 'POST',
    json:true,
    body: {data:{channel : "aaa",appkey : "bbb"},sign : "ccc",token : "ddd"}
};

function callback(error, response, data) {
    if (!error && response.statusCode == 200) {
        console.log('----info------',data);
    }
}

request(options, callback);