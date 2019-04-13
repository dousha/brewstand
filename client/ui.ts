function _overlap(s1: number, e1: number, s2: number, e2: number) {
	return s1 + e1 > s2 && s2 + e2 > s1;
}

function overlap(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) {
	return _overlap(x1, w1, x2, y2) && _overlap(y1, h1, y2, h2);
}

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
		canvas.onmouseup = function () {
			instance.handleMouseUp();
		};
		canvas.oncontextmenu = function () {
			return false;
		};
		setInterval(function () {
			instance.update();
		}, 16);
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
		//this.update();
	}

	public handleMouseDown(e: MouseEvent) {
		e.preventDefault();
		this.mouseX = e.clientX;
		this.mouseY = e.clientY;
		let win = this.getPointingWindow();
		if (win) {
			let controls = win.getControlsUnderCursor(this.mouseX - win.getX(), this.mouseY - win.getY());
			if (controls && controls.length > 0) {
				controls.forEach(it => it.onClick(e.button))
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
		//this.update();
	}

	public handleMouseUp() {
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
		ctx.fillText(`MX: ${this.mouseX}; MY: ${this.mouseY}; WIN: ${pointingWindow && pointingWindow.getTitle()}; CTRL: ${pointingControl && pointingControl.constructor.name} WINFOCUS: ${this.hasFocus(pointingWindow)}`, 0, corner);
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
		if (this.needGlobalRedraw) {
			ctx.clearRect(0, 0, w.getW(), w.getH() + w.getTitleBarHeight());
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
		} else {
			let component = this.hintedComponents.shift();
			while (component) {
				ctx.clearRect(component.getX(), component.getY(), component.getW(), component.getH());
				component.render(ctx);
				component = this.hintedComponents.shift();
			}
		}
	}

	public drawDebugBorder(ctx: CanvasRenderingContext2D) {
		ctx.save();
		ctx.translate(0, this.titleBarHeight);
		this.components.forEach(it => it.drawDebugBorder(ctx));
		ctx.restore();
	}

	public addComponent(component: Component) {
		component.setWindow(this);
		this.components.push(component);
	}

	public moveTo(x: number, y: number) {
		this.x = x;
		this.y = y;
		this.needGlobalRedraw = true;
	}

	public resizeTo(w: number, h: number) {
		this.width = w;
		this.height = h;
		this.needGlobalRedraw = true;
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

	public getTitle() {
		return this.title;
	}

	public hintRedraw(component: Component) {
		this.hintedComponents.push(component);
	}

	public hintRedraw(x: number, y: number, w: number, h: number) {
		for (let component of this.components) {

		}
	}

	private x = 0;
	private y = 0;
	private titleBarHeight = 20;
	private title: string;
	private height: number;
	private width: number;
	private components: Array<Component> = new Array<Component>();
	private needFocus = false;
	private hintedComponents: Array<Component> = new Array<Component>();
	private needGlobalRedraw = false;
}

export enum ClickType {
	LeftMouseButton = 0,
	MiddleMouseButton = 1,
	RightMouseButton = 2
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

	public abstract onClick(button: ClickType): void;

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

	public notifyParentResize(newWidth: number, newHeight: number) {

	}

	public setWindow(win: UserWindow) {
		this.win = win;
	}

	protected x: number;
	protected y: number;
	protected width: number;
	protected height: number;
	protected visible: boolean;
	protected win?: UserWindow;
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
	private readonly font: string;
	private readonly size: number;
	private color: string;
	private background: string;
}

export class Button extends Component {
	public constructor(x: number, y: number, caption: string, {
		width = 200,
		height = 30,
		baseColor = "#D4D0C8",
		lineColor = "#0e0e0e",
		font = "Arial",
		size = 12,
		fontColor = "#000000",
		onClick = function (button: ClickType) {
			console.log(button);
		},
		onHover = function () { },
		onLeave = function () { }
	}) {
		super(x, y, width, height);
		this.caption = caption;
		this.baseColor = baseColor;
		this.borderColor = lineColor;
		this.font = font;
		this.size = size;
		this.fontColor = fontColor;
		this.onClick = onClick;
		this.onHover = onHover;
		this.onLeave = onLeave;
	}

	render(ctx: CanvasRenderingContext2D): void {
		ctx.fillStyle = `${this.baseColor}`;
		ctx.fillRect(this.x, this.y, this.width, this.height);
		ctx.strokeStyle = `${this.borderColor}`;
		ctx.strokeRect(this.x, this.y, this.width, this.height);
		ctx.fillStyle = `${this.fontColor}`;
		ctx.font = `${this.size}px ${this.font}`;
		let metric = ctx.measureText(this.caption);
		let left = (this.width - metric.width) / 2;
		let top = (this.height - this.size) / 2;
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.fillText(this.caption, left, top);
		ctx.restore();
	}

	public getText() {
		return this.caption;
	}

	public setText(caption: string) {
		this.caption = caption;
	}

	public getBaseColor() {
		return this.baseColor;
	}

	public setBaseColor(color: string) {
		this.baseColor = color;
	}

	public getBorderColor() {
		return this.borderColor;
	}

	public setBorderColor(color: string) {
		this.borderColor = color;
	}

	public getFontColor() {
		return this.fontColor;
	}

	public setFontColor(color: string) {
		this.fontColor = color;
	}

	public drawDebugBorder(ctx: CanvasRenderingContext2D) {
		super.drawDebugBorder(ctx);
		let metric = ctx.measureText(this.caption);
		let left = (this.width - metric.width) / 2;
		let top = (this.height - this.size) / 2;
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.strokeRect(left, top, metric.width, this.size);
		ctx.restore();
	}

	private caption: string;
	private baseColor: string;
	private borderColor: string;
	private readonly font: string;
	private readonly size: number;
	private fontColor: string;

	public readonly onClick: (button: ClickType) => void;
	public readonly onHover: () => void;
	public readonly onLeave: () => void;
}

export enum ImageType {
	EXTERNAL,
	BASE64_PNG = "image/png;base64",
	BASE64_JPG = "image/jpeg;base64",
	CANVAS,
}

export class Picture extends Component {
	public constructor(x: number, y: number, w: number, h: number, {
		path = "assets/pictures/missing.png",
		type = ImageType.EXTERNAL,
		alt = "Picture",
	}: {path: string | HTMLCanvasElement, type: ImageType, alt: string}) {
		super(x, y, w, h);
		this.path = path;
		this.type = type;
		this.alt = alt;
	}

	onClick(button: ClickType): void {
	}

	onHover(): void {
	}

	onLeave(): void {
	}

	render(ctx: CanvasRenderingContext2D): void {
		// load picture
		if (this.isImageMissing) {
			ctx.fillStyle = "red";
			ctx.fillText(this.alt, this.x, this.y, this.width);
			return;
		}
		if (!this.img) {
			let img = new Image();
			if (this.type & 0x10) {
				// external source
				let request = new XMLHttpRequest();
				let url = this.path as string;
				request.onreadystatechange = () => {
					if (request.readyState == XMLHttpRequest.DONE && request.status === 200) {
						img.src = url;
						let instance = this;
						img.addEventListener('load', function () {
							ctx.drawImage(img, instance.x, instance.y, instance.width, instance.height);
						});
						this.img = img;
					} else {
						// draw alt
						this.isImageMissing = true;
					}
				};
				request.open("HEAD", url, true);
				request.send();
			} else {
				// internal source
				let img = new Image();
				if (this.type !== ImageType.CANVAS) {
					img.src = `data:${this.type},${this.path}`;
					this.img = img;
				} else {
					this.img = this.path as HTMLCanvasElement;
				}
				ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
			}
		} else {
			ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
		}
	}

	private readonly path: string | HTMLCanvasElement;
	private readonly type: ImageType;
	private readonly alt: string;
	private img: HTMLImageElement | undefined = undefined;
	private isImageMissing = false;
}
