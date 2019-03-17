import { WindowManager, UserWindow, Label } from "./ui.js";

let canvas = document.getElementById("main") as HTMLCanvasElement;
let wm = new WindowManager(canvas);
let win = new UserWindow("Test", 400, 300);
let lbl1 = new Label(0, 0, "test", {});
win.addComponent(lbl1);
wm.addWindow(win);
wm.resizeCanvas();
wm.update();
