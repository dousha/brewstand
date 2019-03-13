export class WindowManager {
	public constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.resizeCanvas();
		if (document) {
			document.onresize = this.resizeCanvas;
		}
	}

	public update() {
		let ctx = this.canvas.getContext("2d");
		if (ctx) {
			for (let w of this.windows) {
				ctx.save();
				ctx.translate(w.X, w.Y);
				w.render(ctx);
				ctx.restore();
			}
		} else {
			alert("WTF?");
		}
	}

	public resizeCanvas() {
		if (document && document.documentElement) {
			let width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
			let height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
			this.canvas.width = width;
			this.canvas.height = height;
		} else {
			alert("WTF?");
		}
	}

	public addWindow(window: UserWindow) {
		this.windows.push(window);
		return this.windows.length - 1;
	}

	public removeWindow(index: number) {
		let windows = this.windows.splice(index, 1);
		for (let window of windows) {
			window.onClose();
		}
	}

	public get isDebugging() {
		return this.debugging;
	}

	public set isDebugging(b: boolean) {
		this.debugging = b;
	}

	private canvas: HTMLCanvasElement;
	private windows: Array<UserWindow> = new Array<UserWindow>();
	private debugging = false;
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
		ctx.strokeRect(0, 0, this.width, 20);
		ctx.fillText(this.title, 3, 3);
		ctx.strokeRect(0, 20, this.width, this.height);
		// translate into the stuff
		ctx.save();
		ctx.translate(this.x, this.y);
		// then draw components
		for (let component of this.components) {
			if (component.isVisible) {
				component.render(ctx);
			}
		}
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

	public get requestForFocus() {
		return this.needFocus;
	}

	public get X() {
		return this.x;
	}

	public get Y() {
		return this.y;
	}

	private x = 0;
	private y = 0;
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

	public get X() {
		return this.x;
	}

	public set X(x: number) {
		this.x = x;
	}

	public get Y() {
		return this.y;
	}

	public set Y(y: number) {
		this.y = y;
	}

	public get W() {
		return this.width;
	}

	public set W(w: number) {
		this.width = w;
	}

	public get H() {
		return this.height;
	}

	public set H(h: number) {
		this.height = h;
	}

	public get isVisible() {
		return this.visible;
	}

	public set isVisible(visible: boolean) {
		this.visible = visible;
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

	public get text() {
		return this.caption;
	}

	public set text(caption: string) {
		this.caption = caption;
	}

	private caption: string;
	private font: string;
	private size: number;
	private color: string;
	private background: string;
}
