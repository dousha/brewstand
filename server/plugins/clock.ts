import { Brew } from "../server";
import Plugin = Brew.Plugin;
import GameServer = Brew.GameServer;
import Timeout = NodeJS.Timeout;

class Clock implements Plugin {
	readonly commands: Array<string> = [];
	readonly listeners: Array<Brew.Listener> = [];
	readonly name: string = "ServerClock";
	readonly requisitions: Array<string> = [];

	onCommand(cmd: string, args: Array<string>): boolean {
		return false;
	}

	onDisable(): void {
		this.pulseGenerator && clearInterval(this.pulseGenerator);
	}

	onEnable(): boolean {
		let instance = this;
		this.pulseGenerator = setInterval(function () {
			GameServer.instance.fireEvent("server-pulse", {
				"tick": instance.counter++
			});
		}, 50);
		return true;
	}

	private counter = 0;
	private pulseGenerator?: Timeout;
}

export = Clock
