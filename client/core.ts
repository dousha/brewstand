import { WindowManager, UserWindow, Label } from "./ui.js";

let canvas = document.getElementById("main") as HTMLCanvasElement;
let wm = new WindowManager(canvas);

let win = new UserWindow("Test", 400, 300);
let lbl1 = new Label(0, 0, "test", {});
win.addComponent(lbl1);
wm.addWindow(win);

let win2 = new UserWindow("Test2", 300, 200);
let lbl2 = new Label(0, 0, "666", {});
win2.addComponent(lbl2);
wm.addWindow(win2);

wm.resizeCanvas();
wm.setDebugging(true);
wm.update();
