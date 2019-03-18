export class WindowManager {
	public constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.resizeCanvas();
		if (document) {
			document.onresize = this.resizeCanvas;
		}
		let instance = this;
		canvas.onmousemove = function (e) {
			instance.handleMouseMove(e);
		};
		canvas.onmousedown = function (e) {
			instance.handleMouseDown(e);
		};
		canvas.onmouseup = function (e) {
			instance.handleMouseUp(e);
		};
	}

	public update() {
		let ctx = this.canvas.getContext("2d");
		if (ctx) {
			for (let w of this.windows) {
				if (this.fullRepaint) {
					ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
					this.fullRepaint = false;
				}
				ctx.save();
				ctx.translate(w.getX(), w.getY());
				ctx.clearRect(0, 0, w.getW(), w.getH() + w.getTitleBarHeight());
				w.render(ctx);
				this.debugging && w.drawDebugBorder(ctx);
				ctx.restore();
			}
			if (this.debugging) {
				this.drawDebugOverlay(ctx);
			}
		} else {
			alert("WTF?");
		}
	}

	public resizeCanvas() {
		if (document && document.documentElement) {
			let rect = document.documentElement.getClientRects()[0];
			let width = Math.floor(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
			let height = Math.floor(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
			this.canvas.width = width;
			this.canvas.height = height;
		} else {
			alert("WTF?");
		}
	}

	public addWindow(window: UserWindow) {
		this.windows.push(window);
		this.fullRepaint = true;
		return this.windows.length - 1;
	}

	public removeWindow(index: number) {
		let windows = this.windows.splice(index, 1);
		for (let window of windows) {
			window.onClose();
		}
		this.fullRepaint = true;
	}

	public isDebugging() {
		return this.debugging;
	}

	public setDebugging(b: boolean) {
		this.debugging = b;
	}

	public handleMouseMove(e: MouseEvent) {
		this.mouseX = e.clientX;
		this.mouseY = e.clientY;
		if (this.dragWindow && this.mouseButton === 0) {
			let deltaX = this.mouseX - this.dragMouseX;
			let deltaY = this.mouseY - this.dragMouseY;
			this.dragWindow.moveTo(this.dragWindowX + deltaX, this.dragWindowY + deltaY);
			this.fullRepaint = true;
		}
		this.update();
	}

	public handleMouseDown(e: MouseEvent) {
		this.mouseX = e.clientX;
		this.mouseY = e.clientY;
		let win = this.getPointingWindow();
		if (win) {
			let controls = win.getControlsUnderCursor(this.mouseX - win.getX(), this.mouseY - win.getY());
			if (controls && controls.length > 0) {
				controls.forEach(it => it.onClick())
			} else {
				this.dragMouseX = this.mouseX;
				this.dragMouseY = this.mouseY;
				this.dragWindowX = win.getX();
				this.dragWindowY = win.getY();
				this.dragWindow = win;
				this.setFocus(win);
			}
		}
		this.mouseButton = e.button;
		this.update();
	}

	public handleMouseUp(e: MouseEvent) {
		this.mouseButton = -1;
		this.dragWindow = undefined;
	}

	public getPointingWindow(): UserWindow | undefined {
		let wins = this.windows.filter(it => it.isCursorInWindow(this.mouseX, this.mouseY));
		if (wins && wins.length > 0) {
			return wins[wins.length - 1]; // the focused window is always at tail
		} else {
			return undefined;
		}
	}

	public getPointingControl() {
		let win = this.getPointingWindow();
		if (win) {
			return win.getControlUnderCursor(this.mouseX - win.getX(), this.mouseY - win.getY());
		}
	}

	private drawDebugOverlay(ctx: CanvasRenderingContext2D) {
		ctx.font = "12px monospace";
		ctx.fillStyle = "black";
		ctx.strokeStyle = "black";
		ctx.textBaseline = "bottom";
		let corner = ctx.canvas.height - 2;
		ctx.clearRect(0, corner - 12, ctx.canvas.width, 12);
		let pointingWindow = this.getPointingWindow();
		let pointingControl = this.getPointingControl();
		ctx.fillText(`MX: ${this.mouseX}; MY: ${this.mouseY}; WIN: ${pointingWindow}; CTRL: ${pointingControl} WINFOCUS: ${this.hasFocus(pointingWindow)}`, 0, corner);
	}

	private hasFocus(win: UserWindow | undefined): boolean {
		return win != undefined && this.windows[this.windows.length - 1] === win;
	}

	private setFocus(win: UserWindow) {
		let i = this.windows.indexOf(win);
		if (i >= 0) {
			this.windows.splice(i, 1);
			this.windows.push(win);
		}
	}

	private canvas: HTMLCanvasElement;
	private windows: Array<UserWindow> = new Array<UserWindow>();
	private debugging = false;
	private fullRepaint = false;

	private mouseX = 0;
	private mouseY = 0;
	private mouseButton = -1;
	private dragMouseX = 0;
	private dragMouseY = 0;
	private dragWindow?: UserWindow;
	private dragWindowX = 0;
	private dragWindowY = 0;
}

export class UserWindow {
	public constructor(title: string, height: number, width: number) {
		this.title = title;
		this.height = height;
		this.width = width;
	}

	public render(ctx: CanvasRenderingContext2D) {
		// draw a box
		ctx.fillStyle = "black";
		ctx.strokeStyle = "black";
		ctx.font = '12px monospace';
		ctx.textBaseline = "top";
		ctx.lineWidth = 1;
		ctx.strokeRect(0, 0, this.width, this.titleBarHeight);
		ctx.fillText(this.title, 3, 3);
		ctx.strokeRect(0, this.titleBarHeight, this.width, this.height);
		// translate into the stuff
		ctx.save();
		ctx.translate(0, this.titleBarHeight);
		// then draw components
		for (let component of this.components) {
			if (component.isVisible) {
				component.render(ctx);
			}
		}
		ctx.restore();
	}

	public drawDebugBorder(ctx: CanvasRenderingContext2D) {
		ctx.save();
		ctx.translate(0, this.titleBarHeight);
		this.components.forEach(it => it.drawDebugBorder(ctx));
		ctx.restore();
	}

	public addComponent(component: Component) {
		this.components.push(component);
	}

	public moveTo(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	public resizeTo(w: number, h: number) {
		this.width = w;
		this.height = h;
	}

	public setTitle(title: string) {
		this.title = title;
	}

	public onClose() { }

	public getX() {
		return this.x;
	}

	public getY() {
		return this.y;
	}

	public getW() {
		return this.width;
	}

	public getH() {
		return this.height;
	}

	public getTitleBarHeight() {
		return this.titleBarHeight;
	}

	public isCursorInWindow(x: number, y: number) {
		let xDelta = x - this.x;
		let yDelta = y - this.y;
		return xDelta > 0 && yDelta > 0 && xDelta < this.width && yDelta < this.height + this.titleBarHeight;
	}

	public getControlUnderCursor(relativeX: number, relativeY: number) {
		let filtered = this.getControlsUnderCursor(relativeX, relativeY);
		if (filtered && filtered.length > 0) {
			return filtered[0];
		}
		return undefined;
	}

	public getControlsUnderCursor(relativeX: number, relativeY: number) {
		return this.components.filter(it => it.isCursorOnControl(relativeX, relativeY - this.titleBarHeight));
	}

	public needAttention() {
		return this.needFocus;
	}

	private x = 0;
	private y = 0;
	private titleBarHeight = 20;
	private title: string;
	private height: number;
	private width: number;
	private components: Array<Component> = new Array<Component>();
	private needFocus = false;
}

export abstract class Component {
	protected constructor(x: number, y: number, width: number, height: number, visible: boolean = true) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.visible = visible;
	}

	public abstract render(ctx: CanvasRenderingContext2D): void;

	public abstract onClick(): void;

	public abstract onHover(): void;

	public abstract onLeave(): void;

	public drawDebugBorder(ctx: CanvasRenderingContext2D) {
		ctx.strokeStyle = "blue";
		ctx.lineWidth = 1;
		ctx.strokeRect(this.x, this.y, this.width, this.height);
	}

	public getX() {
		return this.x;
	}

	public setX(x: number) {
		this.x = x;
	}

	public getY() {
		return this.y;
	}

	public setY(y: number) {
		this.y = y;
	}

	public getW() {
		return this.width;
	}

	public setW(w: number) {
		this.width = w;
	}

	public getH() {
		return this.height;
	}

	public setH(h: number) {
		this.height = h;
	}

	public isVisible() {
		return this.visible;
	}

	public setVisible(visible: boolean) {
		this.visible = visible;
	}

	public isCursorOnControl(x: number, y: number) {
		if (!this.visible || this.width < 1 || this.height < 1) return false;
		let xDelta = x - this.x;
		let yDelta = y - this.y;
		return xDelta > 0 && yDelta > 0 && xDelta < this.width && yDelta < this.height;
	}

	protected x: number;
	protected y: number;
	protected width: number;
	protected height: number;
	protected visible: boolean;
}

export class Label extends Component {
	public constructor(x: number, y: number, caption: string, {
		font = "monospace",
		size = 16,
		color = "#000",
		background = "#FFF",
		width = 200
	}) {
		super(x, y, width, size);
		this.caption = caption;
		this.font = font;
		this.size = size;
		this.color = color;
		this.background = background;
		this.width = width;
	}

	render(ctx: CanvasRenderingContext2D): void {
		ctx.font = `${this.size}px ${this.font}`;
		ctx.fillStyle = this.color;
		ctx.fillText(this.caption, this.x, this.y, this.width);
	}

	public getText() {
		return this.caption;
	}

	public setText(caption: string) {
		this.caption = caption;
	}

	public onClick(): void { }

	public onHover(): void { }

	public onLeave(): void { }

	private caption: string;
	private font: string;
	private size: number;
	private color: string;
	private background: string;
}
