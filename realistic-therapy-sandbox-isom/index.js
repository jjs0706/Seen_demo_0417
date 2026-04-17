// Realistic Sandplay Therapy Scene - Isometric View with Tilt-Shift Effect
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// ── Scene Setup ──
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf5f0eb);
scene.fog = new THREE.FogExp2(0xf5f0eb, 0.008);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
// Isometric-like angle
const camDist = 18;
const camAngle = Math.PI / 6;
const camRotation = Math.PI / 5;
camera.position.set(
  camDist * Math.cos(camAngle) * Math.sin(camRotation),
  camDist * Math.sin(camAngle) + 4,
  camDist * Math.cos(camAngle) * Math.cos(camRotation)
);
camera.lookAt(0, 0.5, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#f5f0eb';

// ── Tilt-Shift Shader ──
const TiltShiftShader = {
  uniforms: {
    tDiffuse: { value: null },
    focusY: { value: 0.5 },
    blurAmount: { value: 1.8 },
    resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float focusY;
    uniform float blurAmount;
    uniform vec2 resolution;
    varying vec2 vUv;
    void main() {
      float dist = abs(vUv.y - focusY);
      float blur = smoothstep(0.0, 0.4, dist) * blurAmount;
      vec4 color = vec4(0.0);
      float total = 0.0;
      float pixelSize = 1.0 / resolution.y;
      for(int i = -6; i <= 6; i++) {
        for(int j = -6; j <= 6; j++) {
          float w = exp(-float(i*i + j*j) / (2.0 * blur * blur + 0.001));
          vec2 offset = vec2(float(j), float(i)) * pixelSize * blur;
          color += texture2D(tDiffuse, vUv + offset) * w;
          total += w;
        }
      }
      // Subtle vignette
      float vig = 1.0 - 0.3 * length((vUv - 0.5) * 1.4);
      gl_FragColor = (color / total) * vig;
      // Warm color grading
      gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(0.95, 0.97, 1.02));
      gl_FragColor.rgb += vec3(0.01, 0.005, 0.0);
    }
  `
};

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const tiltShiftPass = new ShaderPass(TiltShiftShader);
composer.addPass(tiltShiftPass);

// ── Lighting ──
const ambientLight = new THREE.AmbientLight(0xfff5e6, 0.6);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xfff0d4, 2.2);
mainLight.position.set(8, 15, 10);
mainLight.castShadow = true;
mainLight.shadow.mapSize.set(2048, 2048);
mainLight.shadow.camera.left = -12;
mainLight.shadow.camera.right = 12;
mainLight.shadow.camera.top = 12;
mainLight.shadow.camera.bottom = -12;
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = 40;
mainLight.shadow.bias = -0.0005;
mainLight.shadow.normalBias = 0.02;
mainLight.shadow.radius = 4;
scene.add(mainLight);

const fillLight = new THREE.DirectionalLight(0xd4e5ff, 0.5);
fillLight.position.set(-6, 8, -4);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffeedd, 0.4);
rimLight.position.set(-3, 5, 10);
scene.add(rimLight);

// ── Materials ──
const woodMat = new THREE.MeshStandardMaterial({
  color: 0xc9a86c,
  roughness: 0.7,
  metalness: 0.0
});

const darkWoodMat = new THREE.MeshStandardMaterial({
  color: 0x8b6914,
  roughness: 0.75,
  metalness: 0.0
});

const innerWallMat = new THREE.MeshStandardMaterial({
  color: 0x87CEEB,
  roughness: 0.4,
  metalness: 0.0,
  side: THREE.DoubleSide
});

const sandMat = new THREE.MeshStandardMaterial({
  color: 0xf0e4c8,
  roughness: 0.95,
  metalness: 0.0
});

const roofMat = new THREE.MeshStandardMaterial({
  color: 0xa0522d,
  roughness: 0.8,
  metalness: 0.0
});

const leafMat = new THREE.MeshStandardMaterial({
  color: 0x4a7c3f,
  roughness: 0.85,
  metalness: 0.0
});

const leafMat2 = new THREE.MeshStandardMaterial({
  color: 0x5d9b4a,
  roughness: 0.85,
  metalness: 0.0
});

const trunkMat = new THREE.MeshStandardMaterial({
  color: 0x6b4226,
  roughness: 0.9,
  metalness: 0.0
});

const fenceMat = new THREE.MeshStandardMaterial({
  color: 0xbfa06a,
  roughness: 0.8,
  metalness: 0.0
});

const stoneMat = new THREE.MeshStandardMaterial({
  color: 0xb0a89a,
  roughness: 0.9,
  metalness: 0.0
});

const whiteMat = new THREE.MeshStandardMaterial({
  color: 0xfaf8f5,
  roughness: 0.6,
  metalness: 0.0
});

const doorMat = new THREE.MeshStandardMaterial({
  color: 0x654321,
  roughness: 0.75,
  metalness: 0.0
});

// ── Sand Tray (Wooden box) ──
const trayGroup = new THREE.Group();

// Bottom board
const bottomGeo = new THREE.BoxGeometry(10, 0.25, 7);
const bottom = new THREE.Mesh(bottomGeo, woodMat);
bottom.position.y = 0;
bottom.receiveShadow = true;
bottom.castShadow = true;
trayGroup.add(bottom);

// Inner bottom (blue)
const innerBottomGeo = new THREE.BoxGeometry(9.5, 0.02, 6.5);
const innerBottom = new THREE.Mesh(innerBottomGeo, innerWallMat);
innerBottom.position.y = 0.14;
trayGroup.add(innerBottom);

// Walls
function createWall(w, h, d, x, y, z, isInner) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, isInner ? innerWallMat : woodMat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

const wallH = 1.2;
const wallT = 0.25;
// Outer walls
trayGroup.add(createWall(10.5, wallH, wallT, 0, wallH / 2 + 0.12, 3.5 + wallT / 2, false));
trayGroup.add(createWall(10.5, wallH, wallT, 0, wallH / 2 + 0.12, -3.5 - wallT / 2, false));
trayGroup.add(createWall(wallT, wallH, 7 + wallT * 2, 5 + wallT / 2, wallH / 2 + 0.12, 0, false));
trayGroup.add(createWall(wallT, wallH, 7 + wallT * 2, -5 - wallT / 2, wallH / 2 + 0.12, 0, false));

// Inner wall panels (blue)
const innerT = 0.05;
trayGroup.add(createWall(9.5, wallH - 0.15, innerT, 0, wallH / 2 + 0.2, 3.45, true));
trayGroup.add(createWall(9.5, wallH - 0.15, innerT, 0, wallH / 2 + 0.2, -3.45, true));
trayGroup.add(createWall(innerT, wallH - 0.15, 6.9, 4.95, wallH / 2 + 0.2, 0, true));
trayGroup.add(createWall(innerT, wallH - 0.15, 6.9, -4.95, wallH / 2 + 0.2, 0, true));

// Corner trim
for (let sx of [-1, 1]) {
  for (let sz of [-1, 1]) {
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, wallH + 0.1, 0.35),
      darkWoodMat
    );
    trim.position.set(sx * 5.1, wallH / 2 + 0.12, sz * 3.6);
    trim.castShadow = true;
    trayGroup.add(trim);
  }
}

scene.add(trayGroup);

// ── Sand Surface (with displacement-like bumps) ──
const sandGeo = new THREE.PlaneGeometry(9.4, 6.4, 128, 128);
sandGeo.rotateX(-Math.PI / 2);
const posAttr = sandGeo.attributes.position;
for (let i = 0; i < posAttr.count; i++) {
  const x = posAttr.getX(i);
  const z = posAttr.getZ(i);
  let h = 0;
  h += Math.sin(x * 0.8 + 1.2) * Math.cos(z * 0.6 + 0.8) * 0.12;
  h += Math.sin(x * 1.8 + 3.0) * Math.cos(z * 2.2 + 1.5) * 0.06;
  h += Math.sin(x * 3.5 + 0.5) * Math.cos(z * 3.0 + 2.0) * 0.03;
  h += Math.sin(x * 6.0 + 2.0) * Math.cos(z * 5.5) * 0.015;
  // Finger trail path
  const pathDist = Math.abs(z - Math.sin(x * 0.5) * 0.8 - 0.3);
  if (pathDist < 0.4) h -= (0.4 - pathDist) * 0.15;
  posAttr.setY(i, h + 0.45);
}
sandGeo.computeVertexNormals();
const sand = new THREE.Mesh(sandGeo, sandMat);
sand.receiveShadow = true;
sand.castShadow = true;
scene.add(sand);

// Sand edge detail (small lip)
const sandEdge = new THREE.Mesh(
  new THREE.BoxGeometry(9.5, 0.15, 6.5),
  sandMat
);
sandEdge.position.y = 0.18;
scene.add(sandEdge);

// ── Miniature House ──
function createHouse(x, z, scale = 1, rotation = 0) {
  const house = new THREE.Group();
  // Walls
  const wallGeo = new THREE.BoxGeometry(0.8, 0.7, 0.7);
  const walls = new THREE.Mesh(wallGeo, whiteMat);
  walls.position.y = 0.35;
  walls.castShadow = true;
  walls.receiveShadow = true;
  house.add(walls);

  // Roof
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-0.55, 0);
  roofShape.lineTo(0, 0.4);
  roofShape.lineTo(0.55, 0);
  roofShape.closePath();
  const roofExtrudeSettings = { depth: 0.8, bevelEnabled: false };
  const roofGeo = new THREE.ExtrudeGeometry(roofShape, roofExtrudeSettings);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.rotation.y = Math.PI / 2;
  roof.position.set(0.4, 0.7, -0.275);
  roof.castShadow = true;
  house.add(roof);

  // Door
  const doorGeo = new THREE.BoxGeometry(0.18, 0.35, 0.02);
  const door = new THREE.Mesh(doorGeo, doorMat);
  door.position.set(0, 0.2, 0.36);
  house.add(door);

  // Windows
  const windowGeo = new THREE.BoxGeometry(0.12, 0.12, 0.02);
  const windowMat = new THREE.MeshStandardMaterial({ color: 0xcce5ff, roughness: 0.2, metalness: 0.1 });
  for (let wx of [-0.22, 0.22]) {
    const win = new THREE.Mesh(windowGeo, windowMat);
    win.position.set(wx, 0.45, 0.36);
    house.add(win);
  }

  // Chimney
  const chimney = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.3, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.85 })
  );
  chimney.position.set(0.2, 1.0, 0);
  chimney.castShadow = true;
  house.add(chimney);

  const sandY = getSandHeight(x, z);
  house.position.set(x, sandY, z);
  house.rotation.y = rotation;
  house.scale.setScalar(scale);
  return house;
}

function getSandHeight(x, z) {
  let h = 0;
  h += Math.sin(x * 0.8 + 1.2) * Math.cos(z * 0.6 + 0.8) * 0.12;
  h += Math.sin(x * 1.8 + 3.0) * Math.cos(z * 2.2 + 1.5) * 0.06;
  h += Math.sin(x * 3.5 + 0.5) * Math.cos(z * 3.0 + 2.0) * 0.03;
  return h + 0.45;
}

scene.add(createHouse(-1.5, -1.0, 1.0, 0.3));
scene.add(createHouse(2.5, 1.5, 0.7, -0.5));

// ── Trees ──
function createTree(x, z, s = 1, type = 0) {
  const tree = new THREE.Group();
  // Trunk
  const trunkH = 0.5 + Math.random() * 0.3;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04 * s, 0.06 * s, trunkH * s, 8),
    trunkMat
  );
  trunk.position.y = trunkH * s / 2;
  trunk.castShadow = true;
  tree.add(trunk);

  if (type === 0) {
    // Round leafy tree
    const foliageCount = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < foliageCount; i++) {
      const r = (0.2 + Math.random() * 0.15) * s;
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(r, 12, 10),
        Math.random() > 0.5 ? leafMat : leafMat2
      );
      sphere.position.set(
        (Math.random() - 0.5) * 0.15 * s,
        trunkH * s + (Math.random() - 0.3) * 0.2 * s,
        (Math.random() - 0.5) * 0.15 * s
      );
      sphere.castShadow = true;
      tree.add(sphere);
    }
  } else {
    // Conifer / pine
    const levels = 3;
    for (let i = 0; i < levels; i++) {
      const coneR = (0.25 - i * 0.06) * s;
      const coneH = 0.3 * s;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(coneR, coneH, 8),
        leafMat
      );
      cone.position.y = trunkH * s + i * 0.2 * s;
      cone.castShadow = true;
      tree.add(cone);
    }
  }

  const sandY = getSandHeight(x, z);
  tree.position.set(x, sandY, z);
  return tree;
}

// Place several trees
scene.add(createTree(-3.2, 1.5, 1.0, 0));
scene.add(createTree(-2.5, 2.2, 0.8, 1));
scene.add(createTree(1.0, -1.8, 1.1, 0));
scene.add(createTree(3.5, -0.5, 0.9, 1));
scene.add(createTree(-0.5, 2.5, 0.7, 0));
scene.add(createTree(3.8, 2.0, 0.75, 1));
scene.add(createTree(-3.8, -1.5, 0.85, 0));

// ── Wooden Fence ──
function createFence(startX, startZ, endX, endZ, segments = 5) {
  const fence = new THREE.Group();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const fx = startX + (endX - startX) * t;
    const fz = startZ + (endZ - startZ) * t;
    const sy = getSandHeight(fx, fz);
    // Post
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.45, 0.06),
      fenceMat
    );
    post.position.set(fx, sy + 0.22, fz);
    post.castShadow = true;
    fence.add(post);

    // Top cap
    const cap = new THREE.Mesh(
      new THREE.ConeGeometry(0.04, 0.08, 4),
      fenceMat
    );
    cap.position.set(fx, sy + 0.48, fz);
    cap.castShadow = true;
    fence.add(cap);

    // Rails
    if (i < segments) {
      const nextT = (i + 1) / segments;
      const nx = startX + (endX - startX) * nextT;
      const nz = startZ + (endZ - startZ) * nextT;
      const ny = getSandHeight(nx, nz);
      const mx = (fx + nx) / 2;
      const mz = (fz + nz) / 2;
      const my = (sy + ny) / 2;
      const dist = Math.sqrt((nx - fx) ** 2 + (nz - fz) ** 2);
      const angle = Math.atan2(nz - fz, nx - fx);

      for (let rh of [0.15, 0.32]) {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(dist, 0.03, 0.03),
          fenceMat
        );
        rail.position.set(mx, my + rh, mz);
        rail.rotation.y = -angle;
        rail.castShadow = true;
        fence.add(rail);
      }
    }
  }
  return fence;
}

scene.add(createFence(-3.0, 0.5, -0.5, 0.5, 6));
scene.add(createFence(1.5, -2.0, 3.5, -2.0, 4));

// ── Stepping Stones Path ──
function createStones() {
  const stones = new THREE.Group();
  const stonePositions = [
    [-0.3, 0.0], [0.3, -0.5], [0.9, -0.9], [1.5, -0.6], [2.0, -0.2]
  ];
  stonePositions.forEach(([sx, sz]) => {
    const sy = getSandHeight(sx, sz);
    const stone = new THREE.Mesh(
      new THREE.SphereGeometry(0.1 + Math.random() * 0.06, 8, 6),
      stoneMat
    );
    stone.scale.y = 0.4;
    stone.position.set(sx, sy + 0.03, sz);
    stone.rotation.y = Math.random() * Math.PI;
    stone.castShadow = true;
    stone.receiveShadow = true;
    stones.add(stone);
  });
  return stones;
}
scene.add(createStones());

// ── Small Pond / Water Area ──
const pondGeo = new THREE.CircleGeometry(0.6, 32);
const pondMat = new THREE.MeshStandardMaterial({
  color: 0x6fa8c7,
  roughness: 0.1,
  metalness: 0.3,
  transparent: true,
  opacity: 0.7
});
const pond = new THREE.Mesh(pondGeo, pondMat);
pond.rotation.x = -Math.PI / 2;
pond.position.set(2.8, getSandHeight(2.8, 0.5) + 0.01, 0.5);
scene.add(pond);

// Pond rim stones
for (let i = 0; i < 12; i++) {
  const angle = (i / 12) * Math.PI * 2;
  const rx = 2.8 + Math.cos(angle) * 0.55;
  const rz = 0.5 + Math.sin(angle) * 0.55;
  const rimStone = new THREE.Mesh(
    new THREE.SphereGeometry(0.06 + Math.random() * 0.03, 6, 5),
    stoneMat
  );
  rimStone.scale.y = 0.5;
  rimStone.position.set(rx, getSandHeight(rx, rz) + 0.04, rz);
  rimStone.castShadow = true;
  scene.add(rimStone);
}

// ── Small Bridge ──
function createBridge(x, z, rot = 0) {
  const bridge = new THREE.Group();
  const sy = getSandHeight(x, z);
  // Deck
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.04, 0.35),
    darkWoodMat
  );
  deck.position.y = 0.15;
  deck.castShadow = true;
  bridge.add(deck);

  // Planks
  for (let i = -3; i <= 3; i++) {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.02, 0.35),
      fenceMat
    );
    plank.position.set(i * 0.1, 0.18, 0);
    bridge.add(plank);
  }

  // Rails
  for (let side of [-1, 1]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.03, 0.03),
      darkWoodMat
    );
    rail.position.set(0, 0.3, side * 0.17);
    bridge.add(rail);

    for (let p = -1; p <= 1; p++) {
      const rPost = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.18, 0.03),
        darkWoodMat
      );
      rPost.position.set(p * 0.25, 0.23, side * 0.17);
      bridge.add(rPost);
    }
  }

  bridge.position.set(x, sy, z);
  bridge.rotation.y = rot;
  return bridge;
}
scene.add(createBridge(2.8, 0.5, 0.8));

// ── Miniature Figurine (person) ──
function createFigurine(x, z, color = 0xe8b89d, s = 1) {
  const fig = new THREE.Group();
  const sy = getSandHeight(x, z);
  // Body
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05 * s, 0.06 * s, 0.25 * s, 8),
    new THREE.MeshStandardMaterial({ color: 0x5577aa, roughness: 0.7 })
  );
  body.position.y = 0.2 * s;
  body.castShadow = true;
  fig.add(body);
  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.05 * s, 10, 8),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
  );
  head.position.y = 0.38 * s;
  head.castShadow = true;
  fig.add(head);
  fig.position.set(x, sy, z);
  return fig;
}
scene.add(createFigurine(-1.2, 0.0, 0xe8b89d, 1.0));
scene.add(createFigurine(0.8, 1.2, 0xd4a574, 0.85));

// ── Mushrooms ──
function createMushroom(x, z, s = 1) {
  const mush = new THREE.Group();
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015 * s, 0.02 * s, 0.08 * s, 6),
    whiteMat
  );
  stem.position.y = 0.04 * s;
  mush.add(stem);
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.04 * s, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xcc4444, roughness: 0.7 })
  );
  cap.position.y = 0.08 * s;
  cap.castShadow = true;
  mush.add(cap);
  const sy = getSandHeight(x, z);
  mush.position.set(x, sy, z);
  return mush;
}
scene.add(createMushroom(-2.8, 1.2, 1.0));
scene.add(createMushroom(-2.6, 1.4, 0.7));
scene.add(createMushroom(3.2, -1.5, 0.9));

// ── Flowers ──
function createFlower(x, z, color = 0xff6699) {
  const flower = new THREE.Group();
  const stemGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.15, 4);
  const stem = new THREE.Mesh(stemGeo, leafMat);
  stem.position.y = 0.075;
  flower.add(stem);
  const petalMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
  for (let i = 0; i < 5; i++) {
    const petal = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 6, 5),
      petalMat
    );
    const a = (i / 5) * Math.PI * 2;
    petal.position.set(Math.cos(a) * 0.03, 0.16, Math.sin(a) * 0.03);
    petal.scale.y = 0.5;
    flower.add(petal);
  }
  const center = new THREE.Mesh(
    new THREE.SphereGeometry(0.015, 6, 5),
    new THREE.MeshStandardMaterial({ color: 0xffdd00, roughness: 0.5 })
  );
  center.position.y = 0.16;
  flower.add(center);
  const sy = getSandHeight(x, z);
  flower.position.set(x, sy, z);
  return flower;
}

scene.add(createFlower(-3.5, 2.0, 0xff6699));
scene.add(createFlower(-3.3, 2.3, 0xffaa44));
scene.add(createFlower(1.3, 2.2, 0xff88cc));
scene.add(createFlower(1.6, 2.4, 0xaa66ff));
scene.add(createFlower(-1.0, -2.3, 0xff6699));

// ── Sand Ripple Marks (decals on sand) ──
function createSandPattern() {
  const patterns = new THREE.Group();
  // Spiral pattern
  const spiralPts = [];
  for (let t = 0; t < Math.PI * 4; t += 0.15) {
    const r = 0.15 + t * 0.08;
    spiralPts.push(new THREE.Vector3(
      3.5 + Math.cos(t) * r * 0.4,
      getSandHeight(3.5 + Math.cos(t) * r * 0.4, -1.5 + Math.sin(t) * r * 0.4) + 0.01,
      -1.5 + Math.sin(t) * r * 0.4
    ));
  }
  const spiralCurve = new THREE.CatmullRomCurve3(spiralPts);
  const spiralGeo = new THREE.TubeGeometry(spiralCurve, 60, 0.012, 4, false);
  const spiralMesh = new THREE.Mesh(spiralGeo, new THREE.MeshStandardMaterial({
    color: 0xe0d4b8, roughness: 1.0
  }));
  spiralMesh.receiveShadow = true;
  patterns.add(spiralMesh);
  return patterns;
}
scene.add(createSandPattern());

// ── Desk Surface beneath tray ──
const deskGeo = new THREE.BoxGeometry(16, 0.3, 12);
const deskMat = new THREE.MeshStandardMaterial({
  color: 0xdec8a0,
  roughness: 0.6,
  metalness: 0.0
});
const desk = new THREE.Mesh(deskGeo, deskMat);
desk.position.y = -0.28;
desk.receiveShadow = true;
scene.add(desk);

// ── Ambient Particles (dust motes) ──
const particleCount = 80;
const particleGeo = new THREE.BufferGeometry();
const particlePos = new Float32Array(particleCount * 3);
const particleSizes = new Float32Array(particleCount);
for (let i = 0; i < particleCount; i++) {
  particlePos[i * 3] = (Math.random() - 0.5) * 14;
  particlePos[i * 3 + 1] = Math.random() * 6 + 1;
  particlePos[i * 3 + 2] = (Math.random() - 0.5) * 10;
  particleSizes[i] = Math.random() * 0.04 + 0.01;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
particleGeo.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
const particleMat = new THREE.PointsMaterial({
  color: 0xffeedd,
  size: 0.03,
  transparent: true,
  opacity: 0.3,
  sizeAttenuation: true
});
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// ── Animation ──
let autoRotateAngle = 0;
const clock = new THREE.Clock();
let targetRotY = 0;
let currentRotY = 0;
let isDragging = false;
let lastMouseX = 0;

window.addEventListener('mousedown', (e) => { isDragging = true; lastMouseX = e.clientX; });
window.addEventListener('mouseup', () => { isDragging = false; });
window.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const dx = e.clientX - lastMouseX;
    targetRotY += dx * 0.003;
    lastMouseX = e.clientX;
  }
});
window.addEventListener('touchstart', (e) => { isDragging = true; lastMouseX = e.touches[0].clientX; });
window.addEventListener('touchend', () => { isDragging = false; });
window.addEventListener('touchmove', (e) => {
  if (isDragging && e.touches.length === 1) {
    const dx = e.touches[0].clientX - lastMouseX;
    targetRotY += dx * 0.003;
    lastMouseX = e.touches[0].clientX;
  }
});

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const time = clock.getElapsedTime();

  // Gentle auto-rotation if not dragging
  if (!isDragging) {
    targetRotY += dt * 0.05;
  }
  currentRotY += (targetRotY - currentRotY) * 0.05;

  const radius = camDist;
  camera.position.x = radius * Math.cos(camAngle) * Math.sin(camRotation + currentRotY);
  camera.position.z = radius * Math.cos(camAngle) * Math.cos(camRotation + currentRotY);
  camera.position.y = camDist * Math.sin(camAngle) + 4;
  camera.lookAt(0, 0.5, 0);

  // Animate particles
  const pPos = particles.geometry.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    pPos[i * 3 + 1] += Math.sin(time + i) * 0.001;
    pPos[i * 3] += Math.cos(time * 0.5 + i * 0.3) * 0.0005;
  }
  particles.geometry.attributes.position.needsUpdate = true;

  // Water shimmer
  pond.material.opacity = 0.6 + Math.sin(time * 2) * 0.1;

  composer.render();
}

animate();

// ── Resize ──
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  tiltShiftPass.uniforms.resolution.value.set(w, h);
});