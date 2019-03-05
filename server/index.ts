// @ts-ignore
import {IMessage, request, server} from "websocket";
import {Db, MongoClient} from "mongodb";
import {Server} from "https";
import {IncomingMessage, ServerResponse} from "http";

let fs = require('fs');
let WebSocketServer = require('websocket').server;
let http = require('http');
let mongo = require('mongodb');
let db: Db;
let server: Server;
let socket: server;

let readline = require('readline');

function log(msg: string) {
	console.log((new Date().toLocaleString()) + ' ' + msg);
}

function prepareWebsocket() {
	server = http.createServer(function (request: IncomingMessage, response: ServerResponse) {
		log('Incoming request for ' + request.url + ', rejected');
		response.writeHead(404);
		response.end();
	});
	server.listen(config.port, function () {
		log('Listening on port ' + config.port);
	});
	socket = new WebSocketServer({
		httpServer: server,
		autoAcceptConnections: false
	});

	function originIsAllowed(origin: string) {
		return true;
	}

	socket.on('request', (request: request) => {
		if (!originIsAllowed(request.origin)) {
			request.reject();
			log('Connection rejected from ' + request.origin);
		} else {
			try {
				let conn = request.accept('echo-protocol', request.origin);
				log('Connection accepted');
				conn.on('message', (msg: IMessage) => {
					if (msg.type === 'utf8') {
						log(msg.utf8Data || "(null)");
						conn.sendUTF(msg.utf8Data || "");
					} else {
						log('Recv binary msg');
						conn.sendBytes(msg.binaryData || new Buffer(0));
					}
				});
			} catch (e) {
				log(e);
			}
		}
	});
}

function interactive() {
	let rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		terminal: false
	});

	rl.on("line", (input: string) => {
		if (input === "stop") {
			log("Server closing...");
			socket.closeAllConnections();
			server.close();
			log("Server closed");
			process.exit(0);
		} else {
			console.log("Bad command");
		}
	});
}

let config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
mongo.connect("mongodb://localhost:27017/" + config.db)
	.then((client: MongoClient) => {
		db = client.db(config.db);
		log("Database opened, using " + config.db);
	}, (err: any) => console.log(err))
	.then(() => prepareWebsocket())
	.then(() => interactive());