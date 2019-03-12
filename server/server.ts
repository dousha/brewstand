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

export interface Listener {
	onEvent(data: any): boolean;
	readonly type: string;
}

export interface Plugin {
	onEnable(): boolean
	onDisable(): void
	onCommand(cmd: string, args: Array<string>): boolean
	readonly name: string
	readonly requisitions: Array<string>
	readonly commands: Array<string>
	readonly listeners: Array<Listener>
}

export class GameServer {
	private constructor() {
		this.prepareEverything();
		setInterval(function () {

		}, 1000);
	}

	private prepareEverything() {
		mongo.connect("mongodb://localhost:27017/" + this.config.db, {
			useNewUrlParser: true
		}).then((client: MongoClient) => {
			this.db = client.db(this.config.db);
			log("Database opened, using " + this.config.db);
		}, (err: any) => console.log(err))
			.then(() => this.prepareWebsocket())
			.then(() => this.preparePlugins());
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
			return origin && origin !== "*";
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
					conn.on('close', (reasonCode: number, description: string) => {
						log(`${conn.remoteAddress} closed (${reasonCode}): ${description}`);
					});
				} catch (e) {
					log(e);
				}
			}
		});

		this.server = server;
		this.socket = socket;
	}

	private static isPlugin(instance: any): instance is Plugin {
		return instance && instance.name && typeof(instance.name) === "string";
	}

	private async preparePlugins() {
		if (!fs.existsSync("plugins")) {
			fs.mkdirSync("plugins");
			log("Created plugins folder");
		}
		let count = 0;
		let loadQueue = new Array<Plugin>();
		fs.readdirSync("plugins").forEach((f: string) => {
			// only a shallow walk
			let file = path.join("plugins", f);
			if (fs.statSync(file).isFile() && f.endsWith(".js")) {
				let moduleName = "./" + path.join("plugins", f.substring(0, f.length - 3));
				let module = require(moduleName);
				let instance = new module(); // export = class
				if (GameServer.isPlugin(instance)) {
					let plugin = instance as Plugin;
					loadQueue.push(plugin);
				} else {
					log(`${file} is not a plugin, or the class is not correctly exported`);
				}
				++count;
			}
		});
		while (loadQueue.length > 0) {
			let plugin = loadQueue.shift();
			if (!plugin) continue; // should never happen
			let loadedPlugins = new Set(this.plugins.keys());
			if (plugin.requisitions.filter(v => loadedPlugins.has(v)).length > 0) {
				// delay loading
				loadQueue.push(plugin);
				continue;
			}

			log(`Loading ${plugin.name}...`);
			try {
				if (!plugin.onEnable()) {
					log(`Failed loading ${plugin.name} because it reported an error`);
				} else {
					this.plugins.set(plugin.name, plugin);
					let pluginListeners = plugin.listeners;
					for (let listener of pluginListeners) {
						let localListeners = this.listeners.get(listener.type) || new Array<Listener>();
						localListeners.push(listener);
						this.listeners.set(listener.type, localListeners);
					}
				}
			} catch (e) {
				log(`Failed loading ${plugin.name} because it's generating exceptions:`);
				log(e);
			}
			log(`Loaded ${plugin.name}`);
		}
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
		this.plugins.forEach((value, key) => {
			log(`Disabling ${key}...`);
			try {
				value.onDisable();
			} catch (e) {
				log(e);
			}
		});
		this.socket && this.socket.closeAllConnections();
		this.server && this.server.close();
		// Kotlin has this.socket?.closeAllConnections(), you know..
		log("Server closed");
		process.exit(0);
	}

	public fireEvent(type: string, data: any) {
		(this.listeners.get(type) || new Array<Listener>()).forEach(it => {
			it.onEvent(data);
		});
	}

	public static get instance() {
		return (this._this) || (this._this = new GameServer());
	}

	private static _this: GameServer = new GameServer();
	private config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
	private db?: Db;
	private server?: Server;
	private socket?: server;
	private plugins: Map<string, Plugin> = new Map<string, Plugin>();
	private listeners: Map<string, Array<Listener>> = new Map<string, Array<Listener>>();
}
