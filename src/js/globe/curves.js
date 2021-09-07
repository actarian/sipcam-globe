import { geoInterpolate } from 'd3-geo';
import * as THREE from 'three';
import { CURVE_MAX_ALTITUDE, CURVE_MIN_ALTITUDE, CURVE_SEGMENTS, DEGREE_TO_RADIAN, GLOBE_RADIUS } from './constants';

export class Curve {

	constructor(coords, color) {

		const material = this.material = new THREE.MeshBasicMaterial({
			// blending: THREE.AdditiveBlending,
			// opacity: 1,
			// transparent: true,
			color: color.getHex(),
		});

		const { spline } = getSplineFromCoords(coords);

		const geometry = new THREE.BufferGeometry();
		const points = new Float32Array(CURVE_SEGMENTS * 3);
		const vertices = spline.getPoints(CURVE_SEGMENTS - 1);

		for (let i = 0, j = 0; i < vertices.length; i++) {
			const vertex = vertices[i];
			points[j++] = vertex.x;
			points[j++] = vertex.y;
			points[j++] = vertex.z;
		}

		geometry.setAttribute('position', new THREE.BufferAttribute(points, 3));

		const i = this.i = 0;
		geometry.setDrawRange(0, i);

		this.mesh = new THREE.Line(geometry, material);
	}

	onRender(i, c, t) {
		i = (i + CURVE_SEGMENTS / 2 * c);
		const pause = Math.floor(i / (CURVE_SEGMENTS * 2)) % 7 !== 0;
		const index = i % (CURVE_SEGMENTS * 2);
		let from = 0;
		let to = 0;
		if (!pause) {
			to = index;
			if (index > CURVE_SEGMENTS) {
				from = index - CURVE_SEGMENTS;
				to = CURVE_SEGMENTS;
			}
		}
		this.mesh.geometry.setDrawRange(from, to);
	}

}

export class Curves {

	constructor(data) {
		const group = this.group = new THREE.Group();

		const items = [];

		const fromPoint = data.find(x => x.italy);
		const toPoints = data.filter(x => !x.italy);
		toPoints.forEach((p) => {
			items.push({
				coords: [fromPoint.latitude, fromPoint.longitude, p.latitude, p.longitude],
				color: p.color,
			});
		});

		this.items = items;
		const curves = this.curves = items.map((item, index) => new Curve(item.coords, item.color));
		curves.forEach(x => group.add(x.mesh));

		this.i = 0;
	}

	onRender() {
		const i = Math.floor(this.i++ / 5);
		const t = this.curves.length;
		this.curves.forEach((x, c) => x.onRender(i, c, t));
	}

}

export function clamp(num, min, max) {
	return num <= min ? min : (num >= max ? max : num);
}

export function coordinateToPosition(lat, lng, radius) {
	const phi = (90 - lat) * DEGREE_TO_RADIAN;
	const theta = (lng + 180) * DEGREE_TO_RADIAN;
	return new THREE.Vector3(
		- radius * Math.sin(phi) * Math.cos(theta),
		radius * Math.cos(phi),
		radius * Math.sin(phi) * Math.sin(theta)
	);
}

export function getSplineFromCoords(coords) {
	const startLat = coords[0];
	const startLng = coords[1];
	const endLat = coords[2];
	const endLng = coords[3];
	// spline vertices
	const start = coordinateToPosition(startLat, startLng, GLOBE_RADIUS);
	const end = coordinateToPosition(endLat, endLng, GLOBE_RADIUS);
	const altitude = clamp(start.distanceTo(end) * .75, CURVE_MIN_ALTITUDE, CURVE_MAX_ALTITUDE);
	const interpolate = geoInterpolate([startLng, startLat], [endLng, endLat]);
	const midCoord1 = interpolate(0.25);
	const midCoord2 = interpolate(0.75);
	const mid1 = coordinateToPosition(midCoord1[1], midCoord1[0], GLOBE_RADIUS + altitude);
	const mid2 = coordinateToPosition(midCoord2[1], midCoord2[0], GLOBE_RADIUS + altitude);
	return {
		start,
		end,
		spline: new THREE.CubicBezierCurve3(start, mid1, mid2, end),
	};
}


