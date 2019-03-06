"use strict";
var server_1 = require("../server");
var GameServer = server_1.Brew.GameServer;
var Clock = (function () {
    function Clock() {
        this.commands = [];
        this.listeners = [];
        this.name = "ServerClock";
        this.requisitions = [];
        this.counter = 0;
    }
    Clock.prototype.onCommand = function (cmd, args) {
        return false;
    };
    Clock.prototype.onDisable = function () {
        this.pulseGenerator && clearInterval(this.pulseGenerator);
    };
    Clock.prototype.onEnable = function () {
        var instance = this;
        this.pulseGenerator = setInterval(function () {
            GameServer.instance.fireEvent("server-pulse", {
                "tick": instance.counter++
            });
        }, 50);
        return true;
    };
    return Clock;
}());
module.exports = Clock;
