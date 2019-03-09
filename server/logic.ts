namespace Brew {
	export class Vector2 {
		public constructor(x: number, y: number) {
			this.x = x;
			this.y = y;
		}

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

		public distanceFrom(vec: Vector2): number {
			return Math.sqrt(this.distanceFromSq(vec));
		}

		public distanceFromSq(vec: Vector2): number {
			let xComponent = this.x - vec.x;
			xComponent *= xComponent;
			let yComponent = this.y - vec.y;
			yComponent *= yComponent;
			return xComponent + yComponent;
		}

		private x: number;
		private y: number;
	}

	export class Tile {
		private name = "";
	}

	export class World {
		private name = "(null)";
		private map = [];
		private entities = [];
	}

	export class Item {
		public constructor(type = "air", quantity = 1, meta = {}) {
			this._type = type;
			this._quantity = quantity;
			this._meta = meta;
		}

		public consume(entity: Entity): boolean {
			if (this._meta.hasOwnProperty("consume") && typeof this._meta.consume === "function") {
				let consumeFunction = this._meta.consume;
				consumeFunction(entity);
			}
			return --this._quantity === 0;
		}

		public get type() {
			return this._type;
		}

		public get meta() {
			return this._meta;
		}

		public get quantity() {
			return this._quantity;
		}

		private readonly _type: string;
		private _quantity: number;
		private readonly _meta: any;
	}

	export class Inventory {
		public constructor(capacity = 30, holder = undefined, name = "Inventory") {
			this.capacity = capacity;
			this.content = new Array<Item>(capacity);
			this.holder = holder;
			this.name = name;
		}

		public getItemAt(index: number): Item | undefined {
			if (index < 0 || index >= this.capacity) {
				return undefined;
			}
			return this.content[index];
		}

		public setItemAt(index: number, item: Item) {
			if (index < 0 || index > this.capacity) {
				return;
			}
			this.content[index] = item;
		}

		public consumeItemAt(index: number, entity: Entity) {
			if (index < 0 || index > this.capacity) {
				return;
			}
			this.content[index].consume(entity);
		}

		private readonly capacity: number;
		private readonly content: Array<Item>;
		private holder?: Entity;
		private name: string;
	}

	export abstract class Entity {
		public constructor(world: World, position: Vector2, name = "UnnamedEntity") {
			this._world = world;
			this._position = position;
			this._name = name;
		}

		public teleport(world: World, position: Vector2) {

		}

		public get inventory() {
			return this._inventory;
		}

		public set inventory(invetory: Inventory) {
			this._inventory = invetory;
		}

		public get name() {
			return this._name;
		}

		public get position() {
			return this._position;
		}

		public set position(vec: Vector2) {
			this._position = vec;
		}

		private _world: World;
		private _position: Vector2;
		private _inventory = new Inventory();
		private readonly _name: string;
	}

	export class NonPlayerCharacter extends Entity{

	}

	export class Player extends Entity {

	}
}
