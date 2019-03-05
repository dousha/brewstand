let fs = require('fs');
let WebSocketServer = require('websocket').server;
let http = require('http');
let mongo = require('mongodb');
let db;
let server;
let socket;
let readline = require('readline');
function log(msg) {
    console.log((new Date().toLocaleString()) + ' ' + msg);
}
function prepareWebsocket() {
    server = http.createServer(function (request, response) {
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
    function originIsAllowed(origin) {
        return true;
    }
    socket.on('request', (request) => {
        if (!originIsAllowed(request.origin)) {
            request.reject();
            log('Connection rejected from ' + request.origin);
        }
        else {
            try {
                let conn = request.accept('echo-protocol', request.origin);
                log('Connection accepted');
                conn.on('message', (msg) => {
                    if (msg.type === 'utf8') {
                        log(msg.utf8Data || "(null)");
                        conn.sendUTF(msg.utf8Data || "");
                    }
                    else {
                        log('Recv binary msg');
                        conn.sendBytes(msg.binaryData || new Buffer(0));
                    }
                });
            }
            catch (e) {
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
    rl.on("line", (input) => {
        if (input === "stop") {
            log("Server closing...");
            socket.closeAllConnections();
            server.close();
            log("Server closed");
            process.exit(0);
        }
        else {
            console.log("Bad command");
        }
    });
}
let config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
mongo.connect("mongodb://localhost:27017/" + config.db)
    .then((client) => {
    db = client.db(config.db);
    log("Database opened, using " + config.db);
}, (err) => console.log(err))
    .then(() => prepareWebsocket())
    .then(() => interactive());
