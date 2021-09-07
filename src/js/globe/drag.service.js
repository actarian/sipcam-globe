export class DragService {

	constructor(target, downCallback, moveCallback, upCallback) {
		this.target = target || document;
		this.downCallback = downCallback || function(e) {
			console.log('DragListener.downCallback not setted', e);
		};
		this.moveCallback = moveCallback || function(e) {
			console.log('DragListener.moveCallback not setted', e);
		};
		this.upCallback = upCallback || function(e) {
			console.log('DragListener.upCallback not setted', e);
		};
		this.dragging = false;
		this.init();
	}

	init() {
		this.event = {
			position: { x: 0, y: 0 },
			distance: { x: 0, y: 0 },
			strength: { x: 0, y: 0 },
			speed: { x: 0, y: 0 },
			target: this.target,
		};
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
		this.onTouchStart = this.onTouchStart.bind(this);
		this.onTouchMove = this.onTouchMove.bind(this);
		this.onTouchEnd = this.onTouchEnd.bind(this);
		this.target.addEventListener('mousedown', this.onMouseDown, false);
		this.target.addEventListener('touchstart', this.onTouchStart, false);
	}

	onDown(x, y) {
		this.down = { x, y };
		this.position = { x, y };
		this.strength = { x: 0, y: 0 };
		this.distance = this.distance || { x: 0, y: 0 };
		this.speed = { x: 0, y: 0 };
		this.downCallback(this);
	}

	onDrag(x, y) {
		this.dragging = true;
		const down = this.down;
		const position = this.position;
		const strength = this.strength;
		const speed = this.speed;
		const target = this.target;
		const distance = this.distance;
		distance.x = x - down.x;
		distance.y = y - down.y;
		strength.x = distance.x / window.innerWidth * 2;
		strength.y = distance.y / window.innerHeight * 2;
		// speed.x += (strength.x - this.strength.x) * 0.1;
		// speed.y += (strength.y - this.strength.y) * 0.1;
		const sx = (x - position.x) / window.innerWidth * 2;
		const sy = (y - position.y) / window.innerHeight * 2;
		speed.x = speed.x * 0.5 + sx;
		speed.y = speed.y * 0.5 + sy;
		position.x = x;
		position.y = y;
		this.strength = strength;
		const event = this.event;
		event.position.x = x;
		event.position.y = y;
		event.distance.x = distance.x;
		event.distance.y = distance.y;
		event.strength.x = strength.x;
		event.strength.y = strength.y;
		event.speed.x = speed.x;
		event.speed.y = speed.y;
		this.moveCallback(event);
	}

	onUp(x, y) {
		this.dragging = false;
		this.upCallback(this);
	}

	onMouseDown(e) {
		this.target.removeEventListener('touchstart', this.onTouchStart);
		this.onDown(e.clientX, e.clientY);
		this.addMouseListeners();
	}

	onMouseMove(e) {
		this.onDrag(e.clientX, e.clientY);
	}

	onMouseUp(e) {
		this.removeMouseListeners();
		this.onDrag(e.clientX, e.clientY);
		this.onUp();
	}

	onTouchStart(e) {
		this.target.removeEventListener('mousedown', this.onMouseDown);
		if (e.touches.length > 0) {
			e.preventDefault();
			this.onDown(e.touches[0].pageX, e.touches[0].pageY);
			this.addTouchListeners();
		}
	}

	onTouchMove(e) {
		if (e.touches.length > 0) {
			e.preventDefault();
			this.onDrag(e.touches[0].pageX, e.touches[0].pageY);
		}
	}

	onTouchEnd(e) {
		this.removeTouchListeners();
		this.onDrag(this.position.x, this.position.y);
		this.onUp();
	}

	addMouseListeners() {
		document.addEventListener('mousemove', this.onMouseMove, false);
		document.addEventListener('mouseup', this.onMouseUp, false);
	}

	addTouchListeners() {
		document.addEventListener('touchend', this.onTouchEnd, false);
		document.addEventListener('touchmove', this.onTouchMove, false);
	}

	removeMouseListeners() {
		document.removeEventListener('mousemove', this.onMouseMove);
		document.removeEventListener('mouseup', this.onMouseUp);
	}

	removeTouchListeners() {
		document.removeEventListener('touchend', this.onTouchEnd);
		document.removeEventListener('touchmove', this.onTouchMove);
	}
}
