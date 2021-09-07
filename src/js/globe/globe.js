import { GLOBE_RADIUS, PARTICLE_SIZE, PARTICLE_THRESHOLD } from './constants';
import { Curves } from './curves';
import { DragService } from './drag.service';
import { Points } from './points';
import { Tooltip } from './tooltip';

THREE.Euler.prototype.add = function(euler) {
	this.set(this.x + euler.x, this.y + euler.y, this.z + euler.z, this.order);
	return this;
};

export const Modes = {
	Interactive: 'interactive',
	Curves: 'curves',
};

export class Globe {

	static init() {
		return Array.prototype.slice.call(document.querySelectorAll('.group--globe')).map(x => new Globe(x));
	}

	constructor(element) {
		this.element = element;
		this.load();
	}

	load() {
		const src = this.element.getAttribute('data-src');
		fetch(src).then(response => response.json()).then(data => {
			data = data.map(x => {
				x.latitude = x.position.lat;
				x.longitude = x.position.lng;
				x.color = x.type === 'company' ? new THREE.Color(`#00833e`) : new THREE.Color(`#283583`);
				return x;
			});
			const italy = data.find(x => x.italy);
			const foreign = data.filter(x => !x.italy);
			this.data = [italy].concat(foreign);
			this.loadTexture();
		})
	}

	loadTexture() {
		const src = this.element.getAttribute('data-texture');
		const loader = new THREE.TextureLoader();
		loader.crossOrigin = '';
		loader.load(src, (texture) => {
			// texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			// texture.repeat.set(2, 2);
			this.globeTexture = texture;
			this.initScene();
		});
	}

	initScene() {
		const element = this.element;
		const mode = this.mode = element.getAttribute('data-mode') === Modes.Interactive ? Modes.Interactive : Modes.Curves;

		// this.mouse = { x: 0, y: 0 };
		// this.parallax = { x: 0, y: 0 };

		const renderer = this.renderer = new THREE.WebGLRenderer({
			alpha: true,
			antialias: true
		});
		// renderer.shadowMap.enabled = true;
		renderer.setSize(window.innerWidth, window.innerHeight);
		element.appendChild(renderer.domElement);

		const scene = this.scene = new THREE.Scene();
		// scene.fog = new THREE.FogExp2(0x000000, 0.1); // new THREE.Fog(0x000000, 0, 10);

		const camera = this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 100);
		camera.position.set(0, 1.0, 2.0);
		camera.up = new THREE.Vector3(0, 0, -1);
		camera.lookAt(new THREE.Vector3(0, 0, 0));

		const ambient = this.ambient = new THREE.AmbientLight(0x999696);
		scene.add(ambient);

		const directional1 = this.directional1 = new THREE.DirectionalLight(0xfffbfb, 0.5);
		directional1.position.set(0, 1.5, 1);
		scene.add(directional1);

		// const directional2 = this.directional2 = new THREE.DirectionalLight(0xfffbfb, 0.2);
		// directional2.position.set(0, -2, -1);
		// scene.add(directional2);

		const particleRef = new THREE.Vector3(0.0, 0.0, 1.0);

		const globeRotation = this.globeRotation = new THREE.Euler(0.0, Math.PI * 1.2, 0.0, 'XYZ');
		const globeDragRotation = this.globeDragRotation = new THREE.Euler(0, 0, 0, 'XYZ');
		const globeStartDragRotation = this.globeStartDragRotation = new THREE.Euler(0, 0, 0, 'XYZ');
		const globeSpeedRotation = this.globeSpeedRotation = new THREE.Euler(0, 0, 0, 'XYZ');

		const globeGroup = this.globeGroup = new THREE.Group();
		globeGroup.rotation.set(globeRotation.x, globeRotation.y, globeRotation.z);
		scene.add(globeGroup);

		const globe = this.globe = this.getGlobe(this.globeTexture);
		globeGroup.add(globe);

		const points = this.points = new Points(this.data);
		globeGroup.add(points.group);

		if (mode === Modes.Curves) {
			const curves = this.curves = new Curves(this.data);
			globeGroup.add(curves.group);
		}

		const raycaster = this.raycaster = new THREE.Raycaster();
		raycaster.params.Points.threshold = PARTICLE_THRESHOLD;

		const pointer = this.pointer = new THREE.Vector2();

		this.onResize = this.onResize.bind(this);
		this.onPointerMove = this.onPointerMove.bind(this);
		this.onPointerUp = this.onPointerUp.bind(this);

		window.addEventListener('resize', this.onResize, false);
		document.addEventListener('pointermove', this.onPointerMove);
		document.addEventListener('pointerup', this.onPointerUp);
		// document.addEventListener('mousemove', onMouseMove, false);

		const dragService = this.dragService = new DragService(element, (down) => {
			globeStartDragRotation.copy(globeDragRotation);
		}, (move) => {
			globeDragRotation.copy(globeStartDragRotation).add(new THREE.Euler(Math.PI * move.strength.y * 0.5, Math.PI * move.strength.x, 0, 'XYZ'));
			globeSpeedRotation.set(0, 0, 0, 'XYZ');
		}, (up) => {
			globeSpeedRotation.set(Math.PI * up.speed.y * 0.5, Math.PI * up.speed.x, 0, 'XYZ');
		});

		this.onPlay();
		this.onResize();

		this.element.classList.add('init');
	}

	getGlobe(texture) {
		const geometry = new THREE.SphereGeometry(GLOBE_RADIUS, 48, 48);
		const material = new THREE.MeshStandardMaterial({
			color: 0xffffff,
			roughness: 0.8,
			metalness: 0.0,
			map: texture,
			roughnessMap: texture,
		});
		const mesh = new THREE.Mesh(geometry, material);
		return mesh;
	}

	addShadow(parent) {
		const geometry = new THREE.PlaneGeometry(100, 100);
		geometry.rotateX(-Math.PI / 4);
		const material = new THREE.ShadowMaterial();
		material.opacity = 0.2;
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.z = -0.6;
		mesh.receiveShadow = true;
		parent.add(mesh);
		return mesh;
	}

	onResize() {
		const element = this.element;
		const renderer = this.renderer;
		const camera = this.camera;
		const size = {
			width: 0,
			height: 0,
			aspect: 0,
		};
		size.width = element.offsetWidth;
		/*
		gsap.set(element, {
			height: element.offsetWidth < 1024 ? element.offsetWidth * 0.9 : element.offsetWidth * 0.6
		});
		*/
		size.height = element.offsetHeight;
		size.aspect = size.width / size.height;
		if (renderer) {
			renderer.setSize(size.width, size.height);
		}
		if (camera) {
			camera.aspect = size.aspect;
			camera.zoom = (window.innerWidth < 768) ? 1.3 : 1;
			camera.updateProjectionMatrix();
		}
	}

	onPointerMove(event) {
		const rect = this.element.getBoundingClientRect();
		const x = event.clientX - rect.x;
		const y = event.clientY - rect.y;
		const w = rect.width;
		const h = rect.height;
		this.pointer.x = (x / w) * 2 - 1;
		this.pointer.y = -(y / h) * 2 + 1;
	}

	onPointerUp(event) {
		const rect = this.element.getBoundingClientRect();
		const x = event.clientX - rect.x;
		const y = event.clientY - rect.y;
		const w = rect.width;
		const h = rect.height;
		this.pointer.x = (x / w) * 2 - 1;
		this.pointer.y = -(y / h) * 2 + 1;
		this.pointerUp = true;
	}

	/*
	onMouseMove(e) {
		const w2 = window.innerWidth / 2;
		const h2 = window.innerHeight / 2;
		this.mouse = {
			x: (e.clientX - w2) / w2,
			y: (e.clientY - h2) / h2,
		};
		// console.log('onMouseMove', mouse);
	}
	*/

	/*
	doParallax() {
		// parallax
		this.parallax.x += (this.mouse.x - this.parallax.x) / 8;
		this.parallax.y += (this.mouse.y - this.parallax.y) / 8;
		//
		this.directional1.position.set(this.parallax.x * 0.3, 2 + this.parallax.y * 0.3, 0.5);
		this.directional2.position.set(this.parallax.x * 0.3, -2 + this.parallax.y * 0.3, 0);
	}
	*/

	onRender(delta) {
		if (this.tooltip == null) {
			if (!this.dragService.dragging) {
				this.globeRotation.x += this.globeSpeedRotation.x;
				this.globeRotation.y += this.globeSpeedRotation.y;
				this.globeSpeedRotation.x += (0.0000 - this.globeSpeedRotation.x) / 50;
				this.globeSpeedRotation.y += (0.0003 - this.globeSpeedRotation.y) / 50;
			}
			this.globeGroup.rotation.copy(this.globeRotation).add(this.globeDragRotation);
			if (this.mode === Modes.Curves) {
				this.curves.onRender();
			}
			/*
			particles.geometry.vertices.forEach((vertex, i) => {
				const local = globeGroup.localToWorld(vertex.clone());
				const distance = local.distanceTo(particleRef);
				const s = Math.max(0, Math.min(1, (1 - distance))) * 5;
				particles.geometry.colors[i] = new THREE.Color(s, s, s);
				particles.geometry.colorsNeedUpdate = true;
			});
			*/
			this.onCheckIntersections();
		}
		this.renderer.render(this.scene, this.camera);
		// doParallax();
	}

	onPlay() {
		const clock = new THREE.Clock();
		const loop = (time) => {
			const delta = clock.getDelta();
			this.onRender(delta);
			window.requestAnimationFrame(loop);
		}
		loop();
	}

	onCheckIntersections() {
		if (this.mode === Modes.Interactive) {
			const points = this.points.group;
			const geometry = points.geometry;
			const attributes = geometry.attributes;
			const raycaster = this.raycaster;
			const pointer = this.pointer;
			const camera = this.camera;
			raycaster.setFromCamera(pointer, camera);
			const intersections = raycaster.intersectObject(points);
			const intersection = (intersections.length) > 0 ? intersections[0] : null;
			this.pointIndex = intersection ? intersection.index : -1;
		}
	}

	point = { pow: 1 };
	pointIndex_ = -1;
	set pointIndex(pointIndex) {
		if (this.pointIndex_ !== pointIndex) {
			this.pointIndex_ = pointIndex;
			const points = this.points.group;
			const geometry = points.geometry;
			const attributes = geometry.attributes;
			/*
			for (let i = 0, t = attributes.customsize.array.length; i < t; i++) {
				attributes.customsize.array[i] = PARTICLE_SIZE * (i == pointIndex ? 3 : 1);
			}
			attributes.customsize.needsUpdate = true;
			*/
			gsap.set(this.element, { cursor: pointIndex !== -1 ? 'pointer' : 'auto' });
			const o = this.point;
			o.pow = 0;
			gsap.to(o, {
				pow: 1,
				duration: 0.6,
				ease: Power3.easeOut,
				overwrite: 'all',
				onUpdate: () => {
					for (let i = 0, t = attributes.customsize.array.length; i < t; i++) {
						if (i === pointIndex) {
							attributes.customsize.array[i] = PARTICLE_SIZE * (1 + 1 * o.pow);
						} else if (attributes.customsize.array[i] > PARTICLE_SIZE) {
							attributes.customsize.array[i] = PARTICLE_SIZE;
						}
					}
					attributes.customsize.needsUpdate = true;
				}
			});
		}
		if (this.pointerUp) {
			this.pointerUp = false;
			this.onPointSelected(pointIndex);
		}
	}

	onPointSelected(index) {
		if (index !== -1) {
			const item = this.data[index];
			const tooltip = this.tooltip = new Tooltip(item, () => {
				this.element.removeChild(tooltip.element);
				this.tooltip = null;
			});
			this.element.appendChild(tooltip.element);
			console.log('onPointSelected', index, this.tooltip);
			if (typeof window['onPointSelected'] === 'function') {
				window.onPointSelected(item, index);
			}
		}
	}

}
