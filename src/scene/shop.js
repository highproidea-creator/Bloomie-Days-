import * as THREE from 'three';
import { ball, box, clay, cylinder, label, mesh, stem } from './clay.js';
import { makeFlowerPot } from './flowers.js';
import { makeCat } from './cat.js';
import { flowers } from '../data/flowers.js';
import { mergeClay } from './optimize.js';

export function buildShop(scene) {
  const shop = new THREE.Group(); scene.add(shop);
  const cream = '#f7e8ca', pink = '#e9b9bd', sage = '#a8b69a', wood = '#c7a27e';
  const pickables = [];
  const plant = (parent, flower, position, options) => {
    const pot = makeFlowerPot(parent, flower, position, options); pickables.push(pot); return pot;
  };

  // A handmade display plinth, with a stepping-stone path and tiny garden.
  const ground = cylinder(shop, '#ced2ad', [0, -0.3, 0.4], 6.2, 6.0, 0.38);
  ground.scale.z = 0.79;
  const lower = cylinder(shop, '#e5d6bc', [0, -0.54, 0.4], 6.12, 5.95, 0.14); lower.scale.z = 0.79;
  for (let i = 0; i < 4; i++) {
    const stone = box(shop, '#f4e7cd', [0.06 + Math.sin(i) * 0.08, -0.055, 3.4 + i * 0.45], [0.9, 0.12, 0.34], 0.1);
    stone.rotation.y = Math.sin(i * 2) * 0.06;
  }
  box(shop, '#d8b6a0', [0, -0.04, -0.1], [7.3, 0.3, 6.35], 0.14);
  box(shop, '#f7e4cb', [0, 0.12, -0.1], [7.14, 0.12, 6.2]);
  // Light plank floor, visible through the open door.
  for (let i = 0; i < 17; i++) box(shop, i % 2 ? '#e4cbaa' : '#ebd6b7', [-3.25 + i * 0.405, 0.195, -0.1], [0.393, 0.025, 5.93], 0.005);
  box(shop, cream, [0, 2.28, -3.1], [7.1, 4.4, 0.24]);
  box(shop, cream, [-3.48, 2.28, -0.1], [0.24, 4.4, 6.2]);
  box(shop, cream, [3.48, 2.28, -0.1], [0.24, 4.4, 6.2]);
  // Interior wainscoting, scalloped border and wall details.
  box(shop, '#c3ccb0', [0, 0.77, -2.95], [6.8, 1.12, 0.07]);
  box(shop, '#a8b796', [0, 1.36, -2.87], [6.8, 0.09, 0.1]);
  for (let i = 0; i < 12; i++) box(shop, '#b1bf9f', [-3.15 + i * 0.57, 0.77, -2.89], [0.035, 1.07, 0.035]);

  // Front is a true opening: no invisible wall across the doorway.
  for (const side of [-1, 1]) {
    box(shop, cream, [side * 2.29, 0.7, 2.96], [2.38, 1.1, 0.25]);
    box(shop, cream, [side * 3.32, 2.34, 2.96], [0.31, 2.45, 0.25]);
    box(shop, cream, [side * 1.22, 2.34, 2.96], [0.3, 2.45, 0.25]);
    const frameColor = '#9cae98';
    box(shop, frameColor, [side * 2.27, 1.23, 3.12], [2.09, 0.12, 0.17]);
    box(shop, frameColor, [side * 2.27, 3.49, 3.12], [2.09, 0.12, 0.17]);
    for (const x of [side * 1.29, side * 3.25, side * 2.27]) box(shop, frameColor, [x, 2.34, 3.12], [0.085, 2.3, 0.14]);
    box(shop, frameColor, [side * 2.27, 2.42, 3.12], [2.0, 0.075, 0.14]);
    // Stylized frosted glazing is transparent enough to see the interior.
    mesh(new THREE.PlaneGeometry(1.9, 2.15), clay('#d8e5cd', { transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false }), shop, [side * 2.27, 2.34, 3.08]);
    box(shop, pink, [side * 2.28, 1.14, 3.3], [2.18, 0.18, 0.52]);
    // Window boxes with original tiny blossoms.
    for (let i = 0; i < 5; i++) {
      const pot = plant(shop, flowers[side === -1 ? 1 : 0], [side * 2.28 - 0.75 + i * 0.37, 1.2, 3.25], { scale: 0.45, count: 3, potColor: '#e6b1b5' });
      pot.rotation.y = i;
    }
  }
  box(shop, cream, [0, 3.97, 2.96], [7.13, 0.86, 0.25]);
  // Hinged door; the glass and sign move with it.
  const door = new THREE.Group(); door.position.set(-1.04, 0.21, 3.01); shop.add(door);
  box(door, '#dba4ad', [1.04, 1.54, 0], [2.05, 3.08, 0.17]);
  box(door, '#f3d0ce', [1.04, 1.97, 0.105], [1.58, 1.85, 0.055]);
  box(door, '#b8caba', [1.04, 1.98, 0.14], [1.35, 1.58, 0.035]);
  box(door, '#edc3c2', [1.04, 0.58, 0.1], [1.57, 0.65, 0.06]);
  box(door, '#dba4ad', [1.04, 2.02, 0.17], [0.065, 1.65, 0.065]);
  box(door, '#dba4ad', [1.04, 2.02, 0.17], [1.4, 0.065, 0.065]);
  ball(door, '#c39c53', [1.8, 1.43, 0.2], [0.065, 0.065, 0.07]);
  stem(door, [0.77, 2.54, 0.22], [0.5, 2.18, 0.22], 0.012, '#e9dbc0');
  stem(door, [0.77, 2.54, 0.22], [1.03, 2.18, 0.22], 0.012, '#e9dbc0');
  box(door, '#f6e9cd', [0.77, 2.13, 0.24], [0.8, 0.38, 0.07]);
  label(door, 'open', [0.77, 2.13, 0.282], 0.75, 0.32, { fontSize: 230, color: '#8b9a7e' });
  box(shop, '#d9baa0', [0, 0.12, 3.26], [2.45, 0.23, 0.55]);
  box(shop, '#e7cbb0', [0, 0.0, 3.6], [2.8, 0.13, 0.36]);
  const mat = box(shop, '#b1baa0', [0, 0.25, 2.65], [1.75, 0.03, 0.6]);
  mat.rotation.y = 0.02;

  // Roof is removed only in the close interior camera, then restored outside.
  const roof = new THREE.Group(); roof.position.y = 4.43; shop.add(roof);
  box(roof, '#d3aaa0', [0, 0.15, -0.1], [7.8, 0.26, 6.8], 0.11);
  for (let i = 0; i < 16; i++) {
    const x = -3.65 + i * 0.487;
    const tile = box(roof, i % 2 ? '#dcaeb0' : '#e9bec0', [x, 0.44, -0.1], [0.48, 0.4, 6.65], 0.18);
    tile.rotation.z = Math.sin(i * 0.8) * 0.005;
  }
  // Shop sign above the awning.
  box(roof, '#e8cfad', [0, 0.6, 3.38], [4.75, 0.83, 0.2], 0.13);
  label(roof, 'bloomie days', [0, 0.63, 3.49], 4.45, 0.58, { fontSize: 116, color: '#8a6657' });
  const awning = new THREE.Group(); awning.position.set(0, 3.64, 3.17); shop.add(awning);
  for (let i = 0; i < 15; i++) {
    const stripeColor = i % 2 ? '#faf0d8' : '#ddaab3';
    const stripe = box(awning, stripeColor, [-3.5 + i * 0.5, 0.05, 0.38], [0.5, 0.13, 1.05]); stripe.rotation.x = 0.23;
    box(awning, stripeColor, [-3.5 + i * 0.5, -0.12, 0.89], [0.5, 0.27, 0.11], 0.04);
    ball(awning, stripeColor, [-3.5 + i * 0.5, -0.25, 0.89], [0.25, 0.11, 0.06]);
  }

  // Cozy interior: counter, flower rack, botanical picture and pendant lights.
  box(shop, '#b3bf9e', [-1.48, 0.79, -0.25], [2.6, 1.15, 1.0]);
  for (let i = 0; i < 9; i++) box(shop, '#c5cfb3', [-2.62 + i * 0.285, 0.78, 0.28], [0.16, 1.0, 0.04]);
  box(shop, '#f4dfc0', [-1.48, 1.42, -0.25], [2.83, 0.17, 1.14], 0.08);
  label(shop, 'with love, Flora', [-1.48, 0.9, 0.315], 1.8, 0.35, { fontSize: 146, color: '#809374', background: '#c5cfb3' });
  plant(shop, flowers[1], [-2.35, 1.51, -0.22], { scale: 0.57, count: 3, potColor: '#f3d9c5' });
  box(shop, '#e9b9bc', [-0.75, 1.55, -0.3], [0.48, 0.12, 0.3]);
  const cat = makeCat(shop); cat.group.position.set(0.35, 0.22, -0.65);
  cat.group.rotation.y = 0.05;
  box(shop, '#d3b698', [0.2, 2.53, -2.88], [1.35, 1.48, 0.11]);
  label(shop, 'let love grow', [0.2, 2.53, -2.81], 1.14, 1.27, { fontSize: 108, color: '#a67981', background: '#f9edd8' });
  const shelf = new THREE.Group(); shelf.position.set(2.24, 0.22, -1.28); shop.add(shelf);
  for (const x of [-0.98, 0.98]) box(shelf, wood, [x, 1.22, 0], [0.09, 2.45, 0.92]);
  for (const y of [0.08, 1.16]) box(shelf, '#d4b592', [0, y, 0.04], [2.12, 0.12, 1.12]);
  flowers.slice(0, 8).forEach((flower, i) => {
    const row = Math.floor(i / 4), col = i % 4;
    const pot = plant(shelf, flower, [-0.77 + col * 0.52, 0.15 + row * 1.08, 0.06], { scale: 0.62, count: 3, potColor: row ? '#e5c1b4' : '#bac8b3' });
    pot.rotation.y = i * 0.45;
    label(shelf, flower.english, [-0.77 + col * 0.52, 0.13 + row * 1.08, 0.61], 0.48, 0.15, { fontSize: 160 });
  });
  label(shop, 'freshly picked', [2.2, 3.28, -2.95], 1.8, 0.39, { fontSize: 150, color: '#8c9b80' });
  for (const x of [-1.5, 1.7]) {
    stem(shop, [x, 4.45, -1.0], [x, 3.61, -1.0], 0.018, '#a88b68');
    mesh(new THREE.CylinderGeometry(0.13, 0.4, 0.3, 24, 1, true), clay('#dfb4a3', { side: THREE.DoubleSide }), shop, [x, 3.5, -1.0]);
    ball(shop, '#ffe5aa', [x, 3.4, -1.0], [0.13, 0.13, 0.13]);
  }

  // The exterior garden is intentionally asymmetric and a little imperfect.
  plant(shop, flowers[0], [-4.1, -0.04, 2.2], { scale: 1.0, count: 7, potColor: '#e2b9a8' });
  plant(shop, flowers[5], [4.0, -0.04, 2.3], { scale: 0.95, count: 5, potColor: '#ecd3b6' });
  plant(shop, flowers[4], [4.35, -0.04, 0.95], { scale: 0.72, count: 3, potColor: '#aebb9e' });
  plant(shop, flowers[3], [-4.25, -0.04, 0.9], { scale: 0.7, count: 7, potColor: '#aebb9e' });
  // A chalk A-board near the path.
  const sign = new THREE.Group(); sign.position.set(2.35, 0.75, 4.05); sign.rotation.y = -0.15; shop.add(sign);
  for (const x of [-0.43, 0.43]) {
    const leg = box(sign, wood, [x, -0.1, 0], [0.1, 1.55, 0.11]); leg.rotation.x = -0.18;
    const back = box(sign, wood, [x, -0.1, -0.47], [0.1, 1.55, 0.11]); back.rotation.x = 0.24;
  }
  box(sign, '#e4c8a7', [0, 0.15, 0.13], [1.07, 1.13, 0.12]);
  label(sign, 'hello, lovely', [0, 0.35, 0.2], 0.93, 0.4, { fontSize: 148, color: '#faf1dc', background: '#8c9e85' });
  label(sign, 'fresh flowers', [0, -0.05, 0.2], 0.93, 0.37, { fontSize: 140, color: '#f2dacb', background: '#8c9e85' });
  // A small bench on the left.
  box(shop, '#c9aa87', [-2.9, 0.45, 4.0], [1.8, 0.14, 0.52]);
  for (const x of [-3.5, -2.3]) box(shop, '#ae9475', [x, 0.18, 4.0], [0.11, 0.5, 0.4]);
  box(shop, '#d5b796', [-2.9, 0.83, 4.18], [1.8, 0.42, 0.1]);
  plant(shop, flowers[1], [-3.4, 0.53, 4.0], { scale: 0.38, count: 3 });

  // Puffy topiary trees made from individual clay lobes.
  for (const [x, z, size] of [[-4.4, -1.4, 1.0], [4.4, -2.0, 1.15]]) {
    cylinder(shop, '#b49b7a', [x, 0.9, z], 0.13, 0.18, 1.9);
    for (let i = 0; i < 13; i++) {
      const a = i * 2.39996, r = 0.66 * Math.sqrt(i / 13);
      ball(shop, i % 3 ? '#a7b88d' : '#bdc99c', [x + Math.cos(a) * r * size, 2.2 + Math.sin(i * 1.7) * 0.49 * size, z + Math.sin(a) * r * size], [0.65 * size, 0.75 * size, 0.6 * size]);
    }
    cylinder(shop, '#cbbb9c', [x, 0.07, z], 0.53, 0.43, 0.38);
  }
  for (let i = 0; i < 27; i++) {
    const a = i * 2.4, x = Math.cos(a) * (4.8 + Math.sin(i) * 0.6), z = 0.4 + Math.sin(a) * 3.7;
    if (Math.abs(x) < 1.5 && z > 2.8) continue;
    for (let leaf = 0; leaf < 3; leaf++) {
      const tuft = ball(shop, '#a0b17e', [x + leaf * 0.065, 0.05, z], [0.04, 0.16 + leaf * 0.025, 0.04]); tuft.rotation.z = (leaf - 1) * 0.4;
    }
    if (i % 3 === 0) {
      for (let p = 0; p < 5; p++) { const a = p * Math.PI * 2 / 5; ball(shop, '#f9ecd2', [x + Math.cos(a) * 0.07, 0.16, z + Math.sin(a) * 0.07], [0.06, 0.035, 0.06]); }
      ball(shop, '#e1bd69', [x, 0.19, z], [0.04, 0.03, 0.04]);
    }
  }
  mergeClay(shop, new Set([door, roof, cat.group]));
  mergeClay(roof);
  mergeClay(door);
  return { shop, door, roof, cat, pickables };
}
