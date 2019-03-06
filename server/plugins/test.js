"use strict";
var TestPlugin = (function () {
    function TestPlugin() {
        this.commands = [];
        this.name = "TestPlugin";
        this.requisitions = [];
        this.listeners = [
            new (function () {
                function class_1() {
                    this.type = "server-pulse";
                }
                class_1.prototype.onEvent = function (data) {
                    console.log(data);
                    return true;
                };
                return class_1;
            }())
        ];
    }
    TestPlugin.prototype.onCommand = function (cmd, args) {
        return false;
    };
    TestPlugin.prototype.onDisable = function () {
        console.log("Somehow!");
    };
    TestPlugin.prototype.onEnable = function () {
        console.log("It works!");
        return true;
    };
    return TestPlugin;
}());
module.exports = TestPlugin;
