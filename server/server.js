"use strict";
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
    var EventListener = (function () {
        function EventListener() {
        }
        return EventListener;
    }());
    Brew.EventListener = EventListener;
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
                .then(function () { return _this.prepareWebsocket(); });
        }
        GameServer.prototype.prepareWebsocket = function () {
            var server = http.createServer(function (request, response) {
                log('Incoming request for ' + request.url + ', rejected');
                response.writeHead(404);
                response.end();
            });
            server.listen(this.config.port);
            log('Listening on port ' + this.config.port);
            var socket = new WebSocketServer({
                httpServer: server,
                autoAcceptConnections: false
            });
            function originIsAllowed(origin) {
                return true;
            }
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
        };
        GameServer.prototype.preparePlugins = function () {
            if (!fs.existsSync("plugins")) {
                fs.mkdirSync("plugins");
            }
            fs.readdirSync("plugins").forEach(function (f) {
                var file = path.join("plugins", f);
                if (fs.statSync(file).isFile() && f.endsWith(".js")) {
                    console.log(f);
                }
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
