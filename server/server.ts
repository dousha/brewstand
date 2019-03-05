// @ts-ignore
import {IMessage, request, server} from "websocket"
import {Db, MongoClient} from "mongodb"
import {Server} from "https"
import {IncomingMessage, ServerResponse} from "http"

let fs = require('fs');
let path = require('path');
let WebSocketServer = require('websocket').server;
let http = require('http');
let mongo = require('mongodb');
let readline = require('readline');

function log(msg: string) {
	console.log((new Date().toLocaleString()) + ' ' + msg)
}

export module Brew {
	export interface EventListener {
		on(event: string, evObj: any): void
	}

	export interface Plugin {
		onEnable(): boolean
		onDisable(): void
		onCommand(cmd: string, args: Array<string>): boolean
		registerListeners(): Array<EventListener>
		readonly name: string
		readonly requisitions: Array<string>
		readonly commands: Array<string>
	}

	export class GameServer {
		public constructor() {
			mongo.connect("mongodb://localhost:27017/" + this.config.db)
				.then((client: MongoClient) => {
					this.db = client.db(this.config.db);
					log("Database opened, using " + this.config.db);
				}, (err: any) => console.log(err))
				.then(() => this.prepareWebsocket())
				.then(() => this.preparePlugins())
				.then(() => this.interactive());
		}

		private async prepareWebsocket() {
			let server = http.createServer(function (request: IncomingMessage, response: ServerResponse) {
				log('Incoming request for ' + request.url + ', rejected');
				response.writeHead(404);
				response.end();
			});
			server.listen(this.config.port);
			log('Listening on port ' + this.config.port);
			let socket = new WebSocketServer({
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
						log('Connection accepted from ' + request.host);
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

			this.server = server;
			this.socket = socket;
		}

		private async preparePlugins() {
			if (!fs.existsSync("plugins")) {
				fs.mkdirSync("plugins");
				log("Created plugins folder");
			}
			let count = 0;
			fs.readdirSync("plugins").forEach((f: string) => {
				// only a shallow walk
				let file = path.join("plugins", f);
				if (fs.statSync(file).isFile() && f.endsWith(".ts")) {
					// DBG
					console.log(f);
					++count;
				}
			});
			log("Loaded " + count + " plugins");
		}

		public interactive() {
			let rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout,
				terminal: false
			});

			rl.on("line", (input: string) => {
				if (input === "stop") {
					this.shutdown();
				} else {
					console.log("Bad command");
				}
			});

			log("Server started");
		}

		public shutdown() {
			log("Server closing...");
			this.socket && this.socket.closeAllConnections();
			this.server && this.server.close();
			// Kotlin has this.socket?.closeAllConnections(), you know..
			log("Server closed");
			process.exit(0);
		}

		private config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
		private db?: Db;
		private server?: Server;
		private socket?: server;
		private plugins: Map<string, Plugin> = new Map();
	}
}
