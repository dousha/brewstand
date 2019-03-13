class WindowManager {
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
				w.render(ctx);
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
		this.windows.splice(index, 1);
	}

	private canvas: HTMLCanvasElement;
	private windows: Array<UserWindow> = new Array<UserWindow>();
}

class UserWindow {
	public constructor(title: string, height: number, width: number) {
		this.title = title;
		this.height = height;
		this.width = width;
	}

	public render(ctx: CanvasRenderingContext2D) {
		for (let component of this.components) {
			if (component.isVisible) {
				component.render(ctx);
			}
		}
	}

	public addComponent(component: Component) {
		this.components.push(component);
	}

	private title: string;
	private height: number;
	private width: number;
	private components: Array<Component> = new Array<Component>();
}

abstract class Component {
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

class Label extends Component {
	public constructor(x: number, y: number, caption: string, options: {
		font: "monospace",
		size: 16,
		color: "#000",
		background: "#FFF",
		width: 200
	}) {
		super(x, y, options.width, options.size);
		this.caption = caption;
		this.options = options;
	}

	render(ctx: CanvasRenderingContext2D): void {
		ctx.font = `${this.options.size}px ${this.options.font}`;
		ctx.fillText(this.caption, this.x, this.y, this.width);
	}

	private caption: string;
	private options: any;
}
