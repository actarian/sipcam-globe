import { PARTICLE_RADIUS, PARTICLE_SIZE } from './constants';

export class Points {

	constructor(coordinates) {
		const canvas = Points.getParticleCanvas();
		const texture = new THREE.CanvasTexture(canvas);
		const geometry = new THREE.BufferGeometry();
		const material = new THREE.PointsMaterial({
			size: PARTICLE_SIZE,
			map: texture,
			vertexColors: THREE.VertexColors,
			// blending: THREE.AdditiveBlending,
			depthTest: false,
			transparent: true
		});
		material.onBeforeCompile = shader => {
			shader.vertexShader = `
			attribute float customsize;
  varying float vVisible;
  ` + shader.vertexShader;
			shader.vertexShader = shader.vertexShader.replace(
				`gl_PointSize = size;`,
				`
    vec3 vNormal = normalMatrix * normal;
    vVisible = step( 0., dot( -normalize(mvPosition.xyz), normalize(vNormal) ) );

    gl_PointSize = customsize;
    `
			);
			// console.log(shader.vertexShader);
			shader.fragmentShader = `
    varying float vVisible;
` + shader.fragmentShader;
			shader.fragmentShader = shader.fragmentShader.replace(
				`#include <clipping_planes_fragment>`,
				`
    if ( floor(vVisible + 0.1) == 0.0 ) discard;
    #include <clipping_planes_fragment>
`
			);
			// console.log(shader.fragmentShader);
		}
		const vertices = new Float32Array(coordinates.length * 3);
		const normals = new Float32Array(coordinates.length * 3);
		const colors = new Float32Array(coordinates.length * 3);
		const sizes = new Float32Array(coordinates.length);
		const normal = new THREE.Vector3();
		const points = coordinates.map((x) => {
			return Points.getLatLonToVector(x.latitude, x.longitude, PARTICLE_RADIUS);
		}).forEach((point, i) => {
			const coordinate = coordinates[i];
			vertices[i * 3] = point.x;
			vertices[i * 3 + 1] = point.y;
			vertices[i * 3 + 2] = point.z;
			normal.copy(point).normalize();
			normals[i * 3] = normal.x;
			normals[i * 3 + 1] = normal.y;
			normals[i * 3 + 2] = normal.z;
			colors[i * 3] = coordinate.color.r;
			colors[i * 3 + 1] = coordinate.color.g;
			colors[i * 3 + 2] = coordinate.color.b;
			sizes[i] = PARTICLE_SIZE;
		});
		geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
		geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
		geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
		geometry.setAttribute('customsize', new THREE.Float32BufferAttribute(sizes, 1));
		const group = this.group = new THREE.Points(geometry, material);
	}

	static getParticleCanvas() {
		const canvas = document.createElement('canvas');
		canvas.width = 64;
		canvas.height = 64;
		const ctx = canvas.getContext('2d');
		const gradient = ctx.createRadialGradient(
			canvas.width / 2,
			canvas.height / 2,
			0,
			canvas.width / 2,
			canvas.height / 2,
			canvas.width / 2
		);
		gradient.addColorStop(0, 'rgba(255,255,255,1)');
		gradient.addColorStop(0.9, 'rgba(255,255,255,1)');
		gradient.addColorStop(0.91, 'rgba(255,255,255,0)');
		gradient.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		return canvas;
	}

	static getLatLonToVector(lat, lon, radius) {
		const phi = (90 - lat) * (Math.PI / 180);
		const theta = (lon + 180) * (Math.PI / 180);
		const x = -((radius) * Math.sin(phi) * Math.cos(theta));
		const z = ((radius) * Math.sin(phi) * Math.sin(theta));
		const y = ((radius) * Math.cos(phi));
		return new THREE.Vector3(x, y, z);
	}

}
