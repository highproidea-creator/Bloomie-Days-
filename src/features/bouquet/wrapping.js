import * as THREE from "three";
import { mergeClay } from "../../scene/optimize.js";

export function paperGeometry(shape, radius, phase = 0) {
  const positions = [],
    uv = [],
    indices = [],
    segments = 64,
    rings = 5;
  const open = shape === "fan" || shape === "minimal",
    span = open ? Math.PI * 1.65 : Math.PI * 2;
  for (let j = 0; j <= rings; j++)
    for (let i = 0; i <= segments; i++) {
      const t = j / rings,
        a = (open ? 0.55 : 0) + (i / segments) * span + phase;
      const wave =
        shape === "romantic" ? Math.sin(a * 9) * 0.11 : Math.sin(a * 6) * 0.025;
      let r = THREE.MathUtils.lerp(0.16, radius, t) + wave * t * t;
      if (shape === "fan") r *= 1 + Math.abs(Math.sin(a)) * 0.22 * t;
      if (shape === "cone") r *= 0.83;
      const top =
        shape === "fan"
          ? 0.87 - Math.cos(a) * 0.24
          : shape === "minimal"
            ? 0.8
            : 0.98;
      const y =
        THREE.MathUtils.lerp(-0.67, top, t) +
        (shape === "romantic" ? Math.cos(a * 9) * 0.09 * t * t : 0);
      positions.push(Math.sin(a) * r, y, Math.cos(a) * r);
      uv.push((i / segments) * 3, (j / rings) * 3);
      if (j < rings && i < segments) {
        const k = j * (segments + 1) + i;
        indices.push(
          k,
          k + 1,
          k + segments + 1,
          k + 1,
          k + segments + 2,
          k + segments + 1,
        );
      }
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
function texture(kind) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const c = canvas.getContext("2d");
  c.fillStyle = "#ffffff";
  c.fillRect(0, 0, 64, 64);
  if (kind === "patterned") {
    c.fillStyle = "#ddd6d0";
    for (let x = 8; x < 64; x += 16)
      for (let y = 8; y < 64; y += 16) {
        c.beginPath();
        c.arc(x, y, 1.5, 0, Math.PI * 2);
        c.fill();
      }
  } else {
    c.fillStyle = "#e4d7c7";
    for (let i = 0; i < 160; i++) {
      const x = (i * 37) % 64,
        y = (i * 19) % 64;
      c.fillRect(x, y, 1, 1);
    }
  }
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}
function heartGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.15);
  s.bezierCurveTo(-0.4, 0.05, -0.24, 0.34, 0, 0.17);
  s.bezierCurveTo(0.24, 0.34, 0.4, 0.05, 0, -0.15);
  return new THREE.ExtrudeGeometry(s, {
    depth: 0.055,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.025,
    bevelThickness: 0.025,
  });
}
function ribbonLoop(side) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(side * 0.36, 0.29, -0.025),
    new THREE.Vector3(side * 0.62, 0.2, 0),
    new THREE.Vector3(side * 0.43, 0.035, 0.055),
    new THREE.Vector3(0.02 * side, 0, 0.03),
  ]);
  const p = [],
    uv = [],
    ix = [],
    segments = 30;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments,
      v = curve.getPoint(t),
      normal = curve.getTangent(t);
    const width = 0.065 + Math.sin(t * Math.PI) * 0.025;
    normal.set(-normal.y, normal.x, 0).normalize();
    for (const s of [-1, 1]) {
      p.push(v.x + normal.x * width * s, v.y + normal.y * width * s, v.z);
      uv.push(t, (s + 1) / 2);
    }
    if (i < segments) {
      const k = i * 2;
      ix.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(ix);
  g.computeVertexNormals();
  return g;
}
export function createWrapping(draft) {
  const root = new THREE.Group();
  root.name = "bouquet-wrapping";
  const radius = 0.63 + Math.sqrt(draft.stems.length) * 0.075;
  const mat = new THREE.MeshStandardMaterial({
    color: draft.wrapping.color,
    roughness: 1,
    side: THREE.DoubleSide,
    transparent: draft.wrapping.material === "sheer",
    opacity: draft.wrapping.material === "sheer" ? 0.58 : 1,
    depthWrite: draft.wrapping.material !== "sheer",
  });
  if (["patterned", "kraft"].includes(draft.wrapping.material))
    mat.map = texture(draft.wrapping.material);
  const sphere = new THREE.SphereGeometry(1, 12, 10);
  function put(geometry, material, position = [0, 0, 0], scale = [1, 1, 1]) {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(...position);
    m.scale.set(...scale);
    m.castShadow = true;
    m.receiveShadow = true;
    root.add(m);
    return m;
  }
  const layers =
    draft.wrapping.shape === "layered"
      ? 3
      : draft.wrapping.shape === "romantic"
        ? 2
        : 1;
  for (let i = 0; i < layers; i++) {
    const paper = put(
      paperGeometry(draft.wrapping.shape, radius + i * 0.075, i * 0.3),
      i % 2 ? mat.clone() : mat,
      [0, -i * 0.055, 0],
    );
    if (i % 2) paper.material.color.lerp(new THREE.Color("#fff8ed"), 0.25);
  }
  const ribbonMat = new THREE.MeshStandardMaterial({
    color: draft.ribbon.color,
    roughness: draft.ribbon.style === "satin" ? 0.55 : 0.8,
    side: THREE.DoubleSide,
    transparent: draft.ribbon.style === "organza",
    opacity: draft.ribbon.style === "organza" ? 0.68 : 1,
  });
  // The tie follows the outside layer, so even a layered wrapper cannot hide it.
  const outerRadius = radius + (layers - 1) * 0.075;
  const bandRadius =
    (0.16 + (outerRadius - 0.16) * ((0.77 + (layers - 1) * 0.055) / 1.65)) *
    (draft.wrapping.shape === "cone" ? 0.83 : 1);
  const bowFront = bandRadius + 0.045;
  const band = put(
    new THREE.TorusGeometry(bandRadius, 0.035, 8, 32),
    ribbonMat,
    [0, 0.1, 0],
  );
  band.rotation.x = Math.PI / 2;
  const bowScale =
    draft.ribbon.style === "large"
      ? 1.3
      : draft.ribbon.style === "small"
        ? 0.7
        : 1;
  for (const side of [-1, 1]) {
    put(
      ribbonLoop(side),
      ribbonMat,
      [0, 0.1, bowFront],
      [bowScale, bowScale, bowScale],
    );
    const tail = put(
      new THREE.PlaneGeometry(
        0.13,
        draft.ribbon.style === "long-tail" ? 0.92 : 0.48,
        1,
        6,
      ),
      ribbonMat,
      [
        side * 0.18,
        draft.ribbon.style === "long-tail" ? -0.36 : -0.17,
        bowFront + 0.05,
      ],
    );
    tail.rotation.set(-0.12, side * 0.1, side * 0.25);
    if (draft.ribbon.style === "double")
      put(
        ribbonLoop(side),
        ribbonMat,
        [0, 0.12, bowFront - 0.025],
        [1.25, 1.3, 1],
      );
  }
  put(sphere, ribbonMat, [0, 0.13, bowFront + 0.035], [0.12, 0.09, 0.065]);
  const ivory = new THREE.MeshStandardMaterial({
    color: "#fff6e5",
    roughness: 0.55,
  });
  if (draft.decorations.pearls)
    for (let i = 0; i < 14; i++) {
      const a = (i * Math.PI * 2) / 14;
      put(
        sphere,
        ivory,
        [
          Math.sin(a) * (bandRadius + 0.03),
          0.11 + Math.cos(a) * 0.045,
          Math.cos(a) * (bandRadius + 0.03),
        ],
        [0.035, 0.035, 0.035],
      );
    }
  if (draft.decorations.lace)
    for (let i = 0; i < 40; i++) {
      const a = (i * Math.PI * 2) / 40;
      const loop = put(new THREE.TorusGeometry(0.045, 0.012, 5, 10), ivory, [
        Math.sin(a) * radius,
        0.98,
        Math.cos(a) * radius,
      ]);
      loop.rotation.y = a;
    }
  if (draft.decorations.mesh) {
    const net = new THREE.LineSegments(
      new THREE.WireframeGeometry(paperGeometry("round", radius + 0.04)),
      new THREE.LineBasicMaterial({
        color: "#f9ecdb",
        transparent: true,
        opacity: 0.5,
      }),
    );
    root.add(net);
  }
  if (draft.decorations.foliage) {
    const green = new THREE.MeshStandardMaterial({
      color: "#9aaf87",
      roughness: 1,
    });
    for (const side of [-1, 1])
      for (let i = 0; i < 3; i++) {
        const leaf = put(
          sphere,
          green,
          [side * (0.65 + i * 0.12), 1.45 + i * 0.23, -0.38],
          [0.11, 0.3, 0.045],
        );
        leaf.rotation.z = -side * 0.55;
      }
  }
  if (draft.decorations.heart)
    put(
      heartGeometry(),
      new THREE.MeshStandardMaterial({ color: "#d99baa", roughness: 0.8 }),
      [0.36, -0.12, bowFront + 0.06],
      [0.6, 0.6, 0.6],
    );
  const originals = new Set();
  root.traverse((o) => {
    if (o.isMesh && !o.material.transparent) originals.add(o.geometry);
  });
  mergeClay(root);
  originals.forEach((g) => g.dispose());
  if (!root.children.some((o) => o.geometry === sphere)) sphere.dispose();
  return root;
}
export function disposeWrapping(root) {
  const geometries = new Set(),
    materials = new Set(),
    maps = new Set();
  root.traverse((o) => {
    if (o.geometry) geometries.add(o.geometry);
    if (o.material) {
      materials.add(o.material);
      if (o.material.map) maps.add(o.material.map);
    }
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  maps.forEach((m) => m.dispose());
  root.removeFromParent();
}
