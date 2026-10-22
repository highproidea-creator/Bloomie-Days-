import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const materials = new Map();
const spheres = new THREE.SphereGeometry(1, 16, 12);
export function clay(color, extra = {}) {
  const key = `${color}:${JSON.stringify(extra)}`;
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.88, ...extra }));
  return materials.get(key);
}

export function mesh(geometry, material, parent, position = [0, 0, 0], scale = [1, 1, 1]) {
  const object = new THREE.Mesh(geometry, typeof material === 'string' ? clay(material) : material);
  object.position.set(...position);
  object.scale.set(...scale);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

export function ball(parent, color, position, scale) { return mesh(spheres, color, parent, position, scale); }
export function box(parent, color, position, size, radius = 0.06) {
  return mesh(new RoundedBoxGeometry(...size, 2, Math.min(radius, ...size.map(n => n / 3))), color, parent, position);
}
export function cylinder(parent, color, position, top, bottom, height) {
  return mesh(new THREE.CylinderGeometry(top, bottom, height, 20), color, parent, position);
}
export function stem(parent, start, end, radius = 0.035, color = '#82996d') {
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
  const result = mesh(new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 7), color, parent);
  result.position.copy(a).add(b).multiplyScalar(0.5);
  result.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
  return result;
}

export function label(parent, text, position, width, height, { color = '#745b4a', background = '#faf0d9', font = 'Georgia', fontSize = 90 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = Math.round(1024 * height / width);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${fontSize}px ${font}`;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width * 0.92);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  const plane = mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map: texture, roughness: 1 }), parent, position);
  return plane;
}

export function disposeScene(scene) {
  const geometries = new Set(), sceneMaterials = new Set(), textures = new Set();
  scene.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.material) for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      sceneMaterials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  geometries.forEach(g => g.dispose()); sceneMaterials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
  materials.clear();
}
