/**
 * @license sipcam-globe v1.0.0
 * (c) 2021 Luca Zampetti <lzampetti@gmail.com>
 * License: MIT
 */

(function(g,f){typeof exports==='object'&&typeof module!=='undefined'?f(require('three')):typeof define==='function'&&define.amd?define(['three'],f):(g=typeof globalThis!=='undefined'?globalThis:g||self,f(g.THREE));}(this,(function(THREE$1){'use strict';function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}var GLOBE_RADIUS = 0.6;
var PARTICLE_RADIUS = GLOBE_RADIUS + 0.001;
var PARTICLE_SIZE = 0.03;
var PARTICLE_THRESHOLD = 0.015;
var GLOBE_CENTER = new THREE.Vector3(0, 0, 0);
var CURVE_SEGMENTS = 128;
var CURVE_MIN_ALTITUDE = GLOBE_RADIUS / 10;
var CURVE_MAX_ALTITUDE = GLOBE_RADIUS;
var DEGREE_TO_RADIAN = Math.PI / 180;
var COORDINATES = window.COORDINATES || [{
  latitude: 43.9096538,
  longitude: 12.8399805,
  color: '283583'
}, // pesaro
{
  latitude: 41.8519772,
  longitude: 12.2347364,
  color: '00833e'
}, // rome
{
  latitude: 51.5287718,
  longitude: -0.2416791,
  color: '283583'
}, // london
{
  latitude: 55.6713812,
  longitude: 12.4537393,
  color: '00833e'
}, // copenaghen
{
  latitude: 40.6976637,
  longitude: -74.1197623,
  color: '283583'
}, // new york
{
  latitude: 19.3911668,
  longitude: -99.4238221,
  color: '00833e'
}, // mexico city
{
  latitude: 39.9390731,
  longitude: 116.11726,
  color: '283583'
}, // beijing
{
  latitude: 31.2243084,
  longitude: 120.9162376,
  color: '00833e'
} // shangai
].map(function (x) {
  x.color = new THREE.Color("#" + x.color);
  return x;
});var pi = Math.PI;
var halfPi = pi / 2;

var degrees = 180 / pi;
var radians = pi / 180;
var atan2 = Math.atan2;
var cos = Math.cos;
var sin = Math.sin;
var sqrt = Math.sqrt;

function asin(x) {
  return x > 1 ? halfPi : x < -1 ? -halfPi : Math.asin(x);
}

function haversin(x) {
  return (x = sin(x / 2)) * x;
}function geoInterpolate(a, b) {
  var x0 = a[0] * radians,
      y0 = a[1] * radians,
      x1 = b[0] * radians,
      y1 = b[1] * radians,
      cy0 = cos(y0),
      sy0 = sin(y0),
      cy1 = cos(y1),
      sy1 = sin(y1),
      kx0 = cy0 * cos(x0),
      ky0 = cy0 * sin(x0),
      kx1 = cy1 * cos(x1),
      ky1 = cy1 * sin(x1),
      d = 2 * asin(sqrt(haversin(y1 - y0) + cy0 * cy1 * haversin(x1 - x0))),
      k = sin(d);

  var interpolate = d ? function(t) {
    var B = sin(t *= d) / k,
        A = sin(d - t) / k,
        x = A * kx0 + B * kx1,
        y = A * ky0 + B * ky1,
        z = A * sy0 + B * sy1;
    return [
      atan2(y, x) * degrees,
      atan2(z, sqrt(x * x + y * y)) * degrees
    ];
  } : function() {
    return [x0 * degrees, y0 * degrees];
  };

  interpolate.distance = d;

  return interpolate;
}var Curve = /*#__PURE__*/function () {
  function Curve(coords, color) {
    var material = this.material = new THREE$1.MeshBasicMaterial({
      // blending: THREE.AdditiveBlending,
      // opacity: 1,
      // transparent: true,
      color: color.getHex()
    });

    var _getSplineFromCoords = getSplineFromCoords(coords),
        spline = _getSplineFromCoords.spline;

    var geometry = new THREE$1.BufferGeometry();
    var points = new Float32Array(CURVE_SEGMENTS * 3);
    var vertices = spline.getPoints(CURVE_SEGMENTS - 1);

    for (var _i = 0, j = 0; _i < vertices.length; _i++) {
      var vertex = vertices[_i];
      points[j++] = vertex.x;
      points[j++] = vertex.y;
      points[j++] = vertex.z;
    }

    geometry.setAttribute('position', new THREE$1.BufferAttribute(points, 3));
    var i = this.i = 0;
    geometry.setDrawRange(0, i);
    this.mesh = new THREE$1.Line(geometry, material);
  }

  var _proto = Curve.prototype;

  _proto.onRender = function onRender(i, c, t) {
    i = i + CURVE_SEGMENTS / 2 * c;
    var pause = Math.floor(i / (CURVE_SEGMENTS * 2)) % 7 !== 0;
    var index = i % (CURVE_SEGMENTS * 2);
    var from = 0;
    var to = 0;

    if (!pause) {
      to = index;

      if (index > CURVE_SEGMENTS) {
        from = index - CURVE_SEGMENTS;
        to = CURVE_SEGMENTS;
      }
    }

    this.mesh.geometry.setDrawRange(from, to);
  };

  return Curve;
}();
var Curves = /*#__PURE__*/function () {
  function Curves(data) {
    var group = this.group = new THREE$1.Group();
    var items = [];
    var fromPoint = data.find(function (x) {
      return x.italy;
    });
    var toPoints = data.filter(function (x) {
      return !x.italy;
    });
    toPoints.forEach(function (p) {
      items.push({
        coords: [fromPoint.latitude, fromPoint.longitude, p.latitude, p.longitude],
        color: p.color
      });
    });
    this.items = items;
    var curves = this.curves = items.map(function (item, index) {
      return new Curve(item.coords, item.color);
    });
    curves.forEach(function (x) {
      return group.add(x.mesh);
    });
    this.i = 0;
  }

  var _proto2 = Curves.prototype;

  _proto2.onRender = function onRender() {
    var i = Math.floor(this.i++ / 5);
    var t = this.curves.length;
    this.curves.forEach(function (x, c) {
      return x.onRender(i, c, t);
    });
  };

  return Curves;
}();
function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num;
}
function coordinateToPosition(lat, lng, radius) {
  var phi = (90 - lat) * DEGREE_TO_RADIAN;
  var theta = (lng + 180) * DEGREE_TO_RADIAN;
  return new THREE$1.Vector3(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
}
function getSplineFromCoords(coords) {
  var startLat = coords[0];
  var startLng = coords[1];
  var endLat = coords[2];
  var endLng = coords[3]; // spline vertices

  var start = coordinateToPosition(startLat, startLng, GLOBE_RADIUS);
  var end = coordinateToPosition(endLat, endLng, GLOBE_RADIUS);
  var altitude = clamp(start.distanceTo(end) * .75, CURVE_MIN_ALTITUDE, CURVE_MAX_ALTITUDE);
  var interpolate = geoInterpolate([startLng, startLat], [endLng, endLat]);
  var midCoord1 = interpolate(0.25);
  var midCoord2 = interpolate(0.75);
  var mid1 = coordinateToPosition(midCoord1[1], midCoord1[0], GLOBE_RADIUS + altitude);
  var mid2 = coordinateToPosition(midCoord2[1], midCoord2[0], GLOBE_RADIUS + altitude);
  return {
    start: start,
    end: end,
    spline: new THREE$1.CubicBezierCurve3(start, mid1, mid2, end)
  };
}var DragService = /*#__PURE__*/function () {
  function DragService(target, downCallback, moveCallback, upCallback) {
    this.target = target || document;

    this.downCallback = downCallback || function (e) {
      console.log('DragListener.downCallback not setted', e);
    };

    this.moveCallback = moveCallback || function (e) {
      console.log('DragListener.moveCallback not setted', e);
    };

    this.upCallback = upCallback || function (e) {
      console.log('DragListener.upCallback not setted', e);
    };

    this.dragging = false;
    this.init();
  }

  var _proto = DragService.prototype;

  _proto.init = function init() {
    this.event = {
      position: {
        x: 0,
        y: 0
      },
      distance: {
        x: 0,
        y: 0
      },
      strength: {
        x: 0,
        y: 0
      },
      speed: {
        x: 0,
        y: 0
      },
      target: this.target
    };
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchMove = this.onTouchMove.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.target.addEventListener('mousedown', this.onMouseDown, false);
    this.target.addEventListener('touchstart', this.onTouchStart, false);
  };

  _proto.onDown = function onDown(x, y) {
    this.down = {
      x: x,
      y: y
    };
    this.position = {
      x: x,
      y: y
    };
    this.strength = {
      x: 0,
      y: 0
    };
    this.distance = this.distance || {
      x: 0,
      y: 0
    };
    this.speed = {
      x: 0,
      y: 0
    };
    this.downCallback(this);
  };

  _proto.onDrag = function onDrag(x, y) {
    this.dragging = true;
    var down = this.down;
    var position = this.position;
    var strength = this.strength;
    var speed = this.speed;
    var target = this.target;
    var distance = this.distance;
    distance.x = x - down.x;
    distance.y = y - down.y;
    strength.x = distance.x / window.innerWidth * 2;
    strength.y = distance.y / window.innerHeight * 2; // speed.x += (strength.x - this.strength.x) * 0.1;
    // speed.y += (strength.y - this.strength.y) * 0.1;

    var sx = (x - position.x) / window.innerWidth * 2;
    var sy = (y - position.y) / window.innerHeight * 2;
    speed.x = speed.x * 0.5 + sx;
    speed.y = speed.y * 0.5 + sy;
    position.x = x;
    position.y = y;
    this.strength = strength;
    var event = this.event;
    event.position.x = x;
    event.position.y = y;
    event.distance.x = distance.x;
    event.distance.y = distance.y;
    event.strength.x = strength.x;
    event.strength.y = strength.y;
    event.speed.x = speed.x;
    event.speed.y = speed.y;
    this.moveCallback(event);
  };

  _proto.onUp = function onUp(x, y) {
    this.dragging = false;
    this.upCallback(this);
  };

  _proto.onMouseDown = function onMouseDown(e) {
    this.target.removeEventListener('touchstart', this.onTouchStart);
    this.onDown(e.clientX, e.clientY);
    this.addMouseListeners();
  };

  _proto.onMouseMove = function onMouseMove(e) {
    this.onDrag(e.clientX, e.clientY);
  };

  _proto.onMouseUp = function onMouseUp(e) {
    this.removeMouseListeners();
    this.onDrag(e.clientX, e.clientY);
    this.onUp();
  };

  _proto.onTouchStart = function onTouchStart(e) {
    this.target.removeEventListener('mousedown', this.onMouseDown);

    if (e.touches.length > 0) {
      e.preventDefault();
      this.onDown(e.touches[0].pageX, e.touches[0].pageY);
      this.addTouchListeners();
    }
  };

  _proto.onTouchMove = function onTouchMove(e) {
    if (e.touches.length > 0) {
      e.preventDefault();
      this.onDrag(e.touches[0].pageX, e.touches[0].pageY);
    }
  };

  _proto.onTouchEnd = function onTouchEnd(e) {
    this.removeTouchListeners();
    this.onDrag(this.position.x, this.position.y);
    this.onUp();
  };

  _proto.addMouseListeners = function addMouseListeners() {
    document.addEventListener('mousemove', this.onMouseMove, false);
    document.addEventListener('mouseup', this.onMouseUp, false);
  };

  _proto.addTouchListeners = function addTouchListeners() {
    document.addEventListener('touchend', this.onTouchEnd, false);
    document.addEventListener('touchmove', this.onTouchMove, false);
  };

  _proto.removeMouseListeners = function removeMouseListeners() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  };

  _proto.removeTouchListeners = function removeTouchListeners() {
    document.removeEventListener('touchend', this.onTouchEnd);
    document.removeEventListener('touchmove', this.onTouchMove);
  };

  return DragService;
}();var Points = /*#__PURE__*/function () {
  function Points(items) {
    this.items = items;
    var canvas = Points.getParticleCanvas();
    var texture = new THREE.CanvasTexture(canvas);
    var geometry = new THREE.BufferGeometry();
    var material = new THREE.PointsMaterial({
      size: PARTICLE_SIZE,
      map: texture,
      vertexColors: THREE.VertexColors,
      // blending: THREE.AdditiveBlending,
      depthTest: false,
      transparent: true
    });

    material.onBeforeCompile = function (shader) {
      shader.vertexShader = "\n\t\t\tattribute float customsize;\n  varying float vVisible;\n  " + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("gl_PointSize = size;", "\n    vec3 vNormal = normalMatrix * normal;\n    vVisible = step( 0., dot( -normalize(mvPosition.xyz), normalize(vNormal) ) );\n\n    gl_PointSize = customsize;\n    "); // console.log(shader.vertexShader);

      shader.fragmentShader = "\n    varying float vVisible;\n" + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace("#include <clipping_planes_fragment>", "\n    if ( floor(vVisible + 0.1) == 0.0 ) discard;\n    #include <clipping_planes_fragment>\n"); // console.log(shader.fragmentShader);
    };

    var vertices = new Float32Array(items.length * 3);
    var normals = new Float32Array(items.length * 3);
    var colors = new Float32Array(items.length * 3);
    var sizes = new Float32Array(items.length);
    var normal = new THREE.Vector3();
    var points = items.map(function (x) {
      return Points.getLatLonToVector(x.latitude, x.longitude, PARTICLE_RADIUS);
    }).forEach(function (point, i) {
      var item = items[i];
      vertices[i * 3] = point.x;
      vertices[i * 3 + 1] = point.y;
      vertices[i * 3 + 2] = point.z;
      normal.copy(point).normalize();
      normals[i * 3] = normal.x;
      normals[i * 3 + 1] = normal.y;
      normals[i * 3 + 2] = normal.z;
      colors[i * 3] = item.color.r;
      colors[i * 3 + 1] = item.color.g;
      colors[i * 3 + 2] = item.color.b;
      sizes[i] = PARTICLE_SIZE;
    });
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('customsize', new THREE.Float32BufferAttribute(sizes, 1));
    var group = this.group = new THREE.Points(geometry, material);
  }

  Points.getParticleCanvas = function getParticleCanvas() {
    var canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    var ctx = canvas.getContext('2d');
    var gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.9, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.91, 'rgba(255,255,255,0)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
  };

  Points.getLatLonToVector = function getLatLonToVector(lat, lon, radius) {
    var phi = (90 - lat) * (Math.PI / 180);
    var theta = (lon + 180) * (Math.PI / 180);
    var x = -(radius * Math.sin(phi) * Math.cos(theta));
    var z = radius * Math.sin(phi) * Math.sin(theta);
    var y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  };

  return Points;
}();var Tooltip = function Tooltip(item, removeCallback) {
  var div = document.createElement('div');
  div.innerHTML = "\n\t\t<div class=\"card--address\">\n\t\t\t<div class=\"card__content\">\n\t\t\t\t<div class=\"card__country\">" + item.country + "</div>\n\t\t\t\t<div class=\"card__city\">Sueca</div>\n\t\t\t\t<div class=\"card__name\">" + item.title + "</div>\n\t\t\t\t<div class=\"card__address\">" + item.address + "</div>\n\t\t\t\t<a class=\"card__phone\" href=\"tel:0034961702100\">Ph. +34 96 1702100</a>\n\t\t\t\t<a class=\"card__email\" href=\"mailto:www.sipcaminagra.es\">www.sipcaminagra.es</a>\n\t\t\t</div>\n\t\t\t<button class=\"card__close\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\"><path d=\"M23.954 21.03l-9.184-9.095 9.092-9.174-2.832-2.807-9.09 9.179-9.176-9.088-2.81 2.81 9.186 9.105-9.095 9.184 2.81 2.81 9.112-9.192 9.18 9.1z\"/></svg></button>\n\t\t</div>";
  console.log(div.firstElementChild, item);
  this.element = div.firstElementChild;
  this.element.querySelector('.card__close').addEventListener('click', function () {
    if (typeof removeCallback === 'function') {
      removeCallback();
    }
  });
};THREE.Euler.prototype.add = function (euler) {
  this.set(this.x + euler.x, this.y + euler.y, this.z + euler.z, this.order);
  return this;
};

var Modes = {
  Interactive: 'interactive',
  Curves: 'curves'
};
var Globe = /*#__PURE__*/function () {
  Globe.init = function init() {
    return Array.prototype.slice.call(document.querySelectorAll('.group--globe')).map(function (x) {
      return new Globe(x);
    });
  };

  function Globe(element) {
    _defineProperty(this, "point", {
      pow: 1
    });

    _defineProperty(this, "pointIndex_", -1);

    this.element = element;
    this.load();
  }

  var _proto = Globe.prototype;

  _proto.load = function load() {
    var _this = this;

    var src = this.element.getAttribute('data-src');
    fetch(src).then(function (response) {
      return response.json();
    }).then(function (data) {
      data = data.map(function (x) {
        x.latitude = x.position.lat;
        x.longitude = x.position.lng;
        x.color = x.type === 'company' ? new THREE.Color("#00833e") : new THREE.Color("#283583");
        return x;
      });
      var italy = data.find(function (x) {
        return x.italy;
      });
      var foreign = data.filter(function (x) {
        return !x.italy;
      });
      _this.data = [italy].concat(foreign);

      _this.loadTexture();
    });
  };

  _proto.loadTexture = function loadTexture() {
    var _this2 = this;

    var src = this.element.getAttribute('data-texture');
    var loader = new THREE.TextureLoader();
    loader.crossOrigin = '';
    loader.load(src, function (texture) {
      // texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      // texture.repeat.set(2, 2);
      _this2.globeTexture = texture;

      _this2.initScene();
    });
  };

  _proto.initScene = function initScene() {
    var element = this.element;
    var mode = this.mode = element.getAttribute('data-mode') === Modes.Interactive ? Modes.Interactive : Modes.Curves;
    this.mouse = {
      x: 0,
      y: 0
    };
    this.parallax = {
      x: 0,
      y: 0
    };
    var renderer = this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    renderer.shadowMap.enabled = true;
    renderer.setSize(window.innerWidth, window.innerHeight);
    element.appendChild(renderer.domElement);
    var scene = this.scene = new THREE.Scene(); // scene.fog = new THREE.FogExp2(0x000000, 0.1); // new THREE.Fog(0x000000, 0, 10);

    var camera = this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 100);
    camera.position.set(0, 1.0, 2.0);
    camera.up = new THREE.Vector3(0, 0, -1);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    var ambient = this.ambient = new THREE.AmbientLight(0x999696);
    scene.add(ambient);
    var directional1 = this.directional1 = new THREE.DirectionalLight(0xfffbfb, 0.5);
    directional1.position.set(0, 1.5, 1);
    scene.add(directional1); // const directional2 = this.directional2 = new THREE.DirectionalLight(0xfffbfb, 0.2);
    // directional2.position.set(0, -2, -1);
    // scene.add(directional2);

    var particleRef = new THREE.Vector3(0.0, 0.0, 1.0);
    var globeRotation = this.globeRotation = new THREE.Euler(0.0, Math.PI * 1.2, 0.0, 'XYZ');
    var globeDragRotation = this.globeDragRotation = new THREE.Euler(0, 0, 0, 'XYZ');
    var globeStartDragRotation = this.globeStartDragRotation = new THREE.Euler(0, 0, 0, 'XYZ');
    var globeSpeedRotation = this.globeSpeedRotation = new THREE.Euler(0, 0, 0, 'XYZ');
    var globeGroup = this.globeGroup = new THREE.Group();
    globeGroup.rotation.set(globeRotation.x, globeRotation.y, globeRotation.z);
    scene.add(globeGroup);
    var globe = this.globe = this.getGlobe(this.globeTexture);
    globeGroup.add(globe);
    var points = this.points = new Points(this.data);
    globeGroup.add(points.group);

    if (mode === Modes.Curves) {
      var curves = this.curves = new Curves(this.data);
      globeGroup.add(curves.group);
    }

    var raycaster = this.raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = PARTICLE_THRESHOLD;
    var pointer = this.pointer = new THREE.Vector2();
    this.onResize = this.onResize.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    window.addEventListener('resize', this.onResize, false);
    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp); // document.addEventListener('mousemove', onMouseMove, false);

    var dragService = this.dragService = new DragService(element, function (down) {
      globeStartDragRotation.copy(globeDragRotation);
    }, function (move) {
      globeDragRotation.copy(globeStartDragRotation).add(new THREE.Euler(Math.PI * move.strength.y * 0.5, Math.PI * move.strength.x, 0, 'XYZ'));
      globeSpeedRotation.set(0, 0, 0, 'XYZ');
    }, function (up) {
      globeSpeedRotation.set(Math.PI * up.speed.y * 0.5, Math.PI * up.speed.x, 0, 'XYZ');
    });
    this.onPlay();
    this.onResize();
    this.element.classList.add('init');
  };

  _proto.getGlobe = function getGlobe(texture) {
    var geometry = new THREE.SphereGeometry(GLOBE_RADIUS, 48, 48);
    var material = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 1,
      metalness: 0.0,
      map: texture
    });
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
  };

  _proto.addShadow = function addShadow(parent) {
    var geometry = new THREE.PlaneGeometry(100, 100);
    geometry.rotateX(-Math.PI / 4);
    var material = new THREE.ShadowMaterial();
    material.opacity = 0.2;
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -0.6;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  _proto.onResize = function onResize() {
    var element = this.element;
    var renderer = this.renderer;
    var camera = this.camera;
    var size = {
      width: 0,
      height: 0,
      aspect: 0
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
      camera.zoom = window.innerWidth < 768 ? 1.3 : 1;
      camera.updateProjectionMatrix();
    }
  };

  _proto.onPointerMove = function onPointerMove(event) {
    var rect = this.element.getBoundingClientRect();
    var x = event.clientX - rect.x;
    var y = event.clientY - rect.y;
    var w = rect.width;
    var h = rect.height;
    this.pointer.x = x / w * 2 - 1;
    this.pointer.y = -(y / h) * 2 + 1;
  };

  _proto.onPointerUp = function onPointerUp(event) {
    var rect = this.element.getBoundingClientRect();
    var x = event.clientX - rect.x;
    var y = event.clientY - rect.y;
    var w = rect.width;
    var h = rect.height;
    this.pointer.x = x / w * 2 - 1;
    this.pointer.y = -(y / h) * 2 + 1;
    this.pointerUp = true;
  };

  _proto.onMouseMove = function onMouseMove(e) {
    var w2 = window.innerWidth / 2;
    var h2 = window.innerHeight / 2;
    this.mouse = {
      x: (e.clientX - w2) / w2,
      y: (e.clientY - h2) / h2
    }; // console.log('onMouseMove', mouse);
  };

  _proto.doParallax = function doParallax() {
    // parallax
    this.parallax.x += (this.mouse.x - this.parallax.x) / 8;
    this.parallax.y += (this.mouse.y - this.parallax.y) / 8; //

    this.directional1.position.set(this.parallax.x * 0.3, 2 + this.parallax.y * 0.3, 0.5);
    this.directional2.position.set(this.parallax.x * 0.3, -2 + this.parallax.y * 0.3, 0);
  };

  _proto.onRender = function onRender(delta) {
    if (!this.tooltip) {
      if (!this.dragService.dragging) {
        this.globeRotation.x += this.globeSpeedRotation.x;
        this.globeRotation.y += this.globeSpeedRotation.y;
        this.globeSpeedRotation.x += (0.0000 - this.globeSpeedRotation.x) / 50;
        this.globeSpeedRotation.y += (0.0000 - this.globeSpeedRotation.y) / 50;
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

    this.renderer.render(this.scene, this.camera); // doParallax();
  };

  _proto.onPlay = function onPlay() {
    var _this3 = this;

    var clock = new THREE.Clock();

    var loop = function loop(time) {
      var delta = clock.getDelta();

      _this3.onRender(delta);

      window.requestAnimationFrame(loop);
    };

    loop();
  };

  _proto.onCheckIntersections = function onCheckIntersections() {
    if (this.mode === Modes.Interactive) {
      var points = this.points.group;
      var geometry = points.geometry;
      var attributes = geometry.attributes;
      var raycaster = this.raycaster;
      var pointer = this.pointer;
      var camera = this.camera;
      raycaster.setFromCamera(pointer, camera);
      var intersections = raycaster.intersectObject(points);
      var intersection = intersections.length > 0 ? intersections[0] : null;
      this.pointIndex = intersection ? intersection.index : -1;
    }
  };

  _proto.onPointSelected = function onPointSelected(index) {
    var _this4 = this;

    if (index !== -1) {
      var item = this.data[index];
      var tooltip = this.tooltip = new Tooltip(item, function () {
        _this4.element.removeChild(tooltip.element);

        _this4.tooltip = null;
      });
      this.element.appendChild(tooltip.element);
      console.log('onPointSelected', index, this.tooltip);

      if (typeof window['onPointSelected'] === 'function') {
        window.onPointSelected(item, index);
      }
    }
  };

  _createClass(Globe, [{
    key: "pointIndex",
    set: function set(pointIndex) {
      if (this.pointIndex_ !== pointIndex) {
        this.pointIndex_ = pointIndex;
        var points = this.points.group;
        var geometry = points.geometry;
        var attributes = geometry.attributes;
        /*
        for (let i = 0, t = attributes.customsize.array.length; i < t; i++) {
        	attributes.customsize.array[i] = PARTICLE_SIZE * (i == pointIndex ? 3 : 1);
        }
        attributes.customsize.needsUpdate = true;
        */

        gsap.set(this.element, {
          cursor: pointIndex !== -1 ? 'pointer' : 'auto'
        });
        var o = this.point;
        o.pow = 0;
        gsap.to(o, {
          pow: 1,
          duration: 0.6,
          ease: Power3.easeOut,
          overwrite: 'all',
          onUpdate: function onUpdate() {
            for (var i = 0, t = attributes.customsize.array.length; i < t; i++) {
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
  }]);

  return Globe;
}();var globes = Globe.init();})));