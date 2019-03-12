import { Plugin, Listener } from "../server";

class TestPlugin implements Plugin {
	readonly commands: Array<string> = [];
	readonly name: string = "TestPlugin";
	readonly requisitions: Array<string> = [];
	readonly listeners: Array<Listener> = [
		new class implements Listener {
			readonly type: string = "server-pulse";
			onEvent(data: any): boolean {
				console.log(data);
				return true;
			}
		}
	];

	onCommand(cmd: string, args: Array<string>): boolean {
		return false;
	}

	onDisable(): void {
		console.log("Somehow!");
	}

	onEnable(): boolean {
		console.log("It works!");
		return true;
	}
}

export = TestPlugin;
