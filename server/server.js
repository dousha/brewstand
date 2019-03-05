"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require('fs');
var path = require('path');
var WebSocketServer = require('websocket').server;
var http = require('http');
var mongo = require('mongodb');
var readline = require('readline');
function log(msg) {
    console.log((new Date().toLocaleString()) + ' ' + msg);
}
var Brew;
(function (Brew) {
    var GameServer = (function () {
        function GameServer() {
            var _this = this;
            this.config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
            this.plugins = new Map();
            mongo.connect("mongodb://localhost:27017/" + this.config.db)
                .then(function (client) {
                _this.db = client.db(_this.config.db);
                log("Database opened, using " + _this.config.db);
            }, function (err) { return console.log(err); })
                .then(function () { return _this.prepareWebsocket(); })
                .then(function () { return _this.preparePlugins(); })
                .then(function () { return _this.interactive(); });
        }
        GameServer.prototype.prepareWebsocket = function () {
            return __awaiter(this, void 0, void 0, function () {
                function originIsAllowed(origin) {
                    return true;
                }
                var server, socket;
                return __generator(this, function (_a) {
                    server = http.createServer(function (request, response) {
                        log('Incoming request for ' + request.url + ', rejected');
                        response.writeHead(404);
                        response.end();
                    });
                    server.listen(this.config.port);
                    log('Listening on port ' + this.config.port);
                    socket = new WebSocketServer({
                        httpServer: server,
                        autoAcceptConnections: false
                    });
                    socket.on('request', function (request) {
                        if (!originIsAllowed(request.origin)) {
                            request.reject();
                            log('Connection rejected from ' + request.origin);
                        }
                        else {
                            try {
                                var conn_1 = request.accept('echo-protocol', request.origin);
                                log('Connection accepted');
                                conn_1.on('message', function (msg) {
                                    if (msg.type === 'utf8') {
                                        log(msg.utf8Data || "(null)");
                                        conn_1.sendUTF(msg.utf8Data || "");
                                    }
                                    else {
                                        log('Recv binary msg');
                                        conn_1.sendBytes(msg.binaryData || new Buffer(0));
                                    }
                                });
                            }
                            catch (e) {
                                log(e);
                            }
                        }
                    });
                    this.server = server;
                    this.socket = socket;
                    return [2];
                });
            });
        };
        GameServer.prototype.preparePlugins = function () {
            return __awaiter(this, void 0, void 0, function () {
                var count;
                return __generator(this, function (_a) {
                    if (!fs.existsSync("plugins")) {
                        fs.mkdirSync("plugins");
                        log("Created plugins folder");
                    }
                    count = 0;
                    fs.readdirSync("plugins").forEach(function (f) {
                        var file = path.join("plugins", f);
                        if (fs.statSync(file).isFile() && f.endsWith(".js")) {
                            console.log(f);
                            ++count;
                        }
                    });
                    log("Loaded " + count + " plugins");
                    return [2];
                });
            });
        };
        GameServer.prototype.interactive = function () {
            var _this = this;
            var rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
                terminal: false
            });
            rl.on("line", function (input) {
                if (input === "stop") {
                    _this.shutdown();
                }
                else {
                    console.log("Bad command");
                }
            });
            log("Server started");
        };
        GameServer.prototype.shutdown = function () {
            log("Server closing...");
            this.socket && this.socket.closeAllConnections();
            this.server && this.server.close();
            log("Server closed");
            process.exit(0);
        };
        return GameServer;
    }());
    Brew.GameServer = GameServer;
})(Brew = exports.Brew || (exports.Brew = {}));
