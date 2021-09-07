
export const GLOBE_RADIUS = 0.5;
export const PARTICLE_RADIUS = GLOBE_RADIUS + 0.001;
export const PARTICLE_SIZE = 0.03;
export const PARTICLE_THRESHOLD = 0.015;
export const GLOBE_CENTER = new THREE.Vector3(0, 0, 0);

export const PI_TWO = Math.PI * 2;
export const PI_HALF = Math.PI / 2;



export const CURVE_SEGMENTS = 128;
export const CURVE_MIN_ALTITUDE = GLOBE_RADIUS / 10;
export const CURVE_MAX_ALTITUDE = GLOBE_RADIUS;
export const CURVE_COLOR = 0x283583;

export const DEGREE_TO_RADIAN = Math.PI / 180;

export const COORDINATES = window.COORDINATES || [
	{ latitude: 43.9096538, longitude: 12.8399805, color: '283583' }, // pesaro
	{ latitude: 41.8519772, longitude: 12.2347364, color: '00833e' }, // rome
	{ latitude: 51.5287718, longitude: -0.2416791, color: '283583' }, // london
	{ latitude: 55.6713812, longitude: 12.4537393, color: '00833e' }, // copenaghen
	{ latitude: 40.6976637, longitude: -74.1197623, color: '283583' }, // new york
	{ latitude: 19.3911668, longitude: -99.4238221, color: '00833e' }, // mexico city
	{ latitude: 39.9390731, longitude: 116.11726, color: '283583' }, // beijing
	{ latitude: 31.2243084, longitude: 120.9162376, color: '00833e' }, // shangai
].map(x => {
	x.color = new THREE.Color(`#${x.color}`);
	return x;
});
