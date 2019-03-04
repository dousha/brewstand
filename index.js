let fs = require('fs');
let WebSocketServer = require('websocket').server;
let http = require('http');

function log(msg) {
	console.log(msg);
}

let config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
let server = http.createServer(function (request, response) {
	log((new Date()) + ' Incoming: ' + request.url);
	response.writeHead(404);
	response.end();
});
server.listen(config.port, function () {
	log((new Date()) + ' Listening on port ' + config.port);
});
let socket = new WebSocketServer({
	httpServer: server,
	autoAcceptConnections: false
});

function originIsAllowed(origin) {
	return true;
}

socket.on('request', function (requset) {
	if (!originIsAllowed(requset.origin)) {
		requset.reject();
		log('Connection rejected from ' + requset.origin);
	} else {
		try {
			let conn = requset.accept('echo-protocol', requset.origin);
			log('Connection accepted');
			conn.on('message', (msg) => {
				if (msg.type === 'utf8') {
					log(msg.utf8Data);
					conn.sendUTF(msg.utf8Data);
				} else {
					log('Recv binary msg');
					conn.sendBytes(msg.binaryData);
				}
			});
		} catch (e) {
			log(e);
		}
	}
});
