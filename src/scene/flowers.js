import * as THREE from 'three';
import { ball, clay, mesh, cylinder, stem } from './clay.js';

const petalGeometry = new THREE.SphereGeometry(1, 10, 8);

function petals(parent, count, color, radius, length, width, y = 0, offset = 0) {
  for (let i = 0; i < count; i++) {
    const angle = i / count * Math.PI * 2 + offset;
    const petal = mesh(petalGeometry, clay(color), parent,
      [Math.sin(angle) * radius, y, Math.cos(angle) * radius], [width, 0.065, length]);
    petal.rotation.y = angle;
    petal.rotation.x = -0.12;
  }
}

/** Same procedural factory for the world and flower portraits. Add forms here. */
export function makeFlower(flower, { height = 0.95, variation = 0 } = {}) {
  const group = new THREE.Group();
  const lean = Math.sin(variation * 2.4) * 0.1;
  stem(group, [0, 0, 0], [lean, height, 0], 0.026);
  for (let i = 0; i < 2; i++) {
    const side = i % 2 ? -1 : 1;
    const leaf = ball(group, '#8da47b', [side * 0.11, height * (0.3 + i * 0.19), 0], [0.07, 0.22, 0.035]);
    leaf.rotation.z = -side * 0.65;
  }
  const head = new THREE.Group(); head.position.set(lean, height, 0); group.add(head);
  const { form, color, center } = flower;
  if (form === 'tulip') {
    ball(head, color, [0, 0.09, 0], [0.19, 0.23, 0.19]);
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      const p = ball(head, i % 2 ? color : '#f3bdc4', [Math.sin(a) * 0.12, 0.15, Math.cos(a) * 0.12], [0.105, 0.22, 0.085]);
      p.rotation.y = a;
    }
  } else if (form === 'rose' || form === 'peony') {
    for (let layer = 0; layer < 3; layer++) {
      const radius = 0.18 - layer * 0.055;
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * Math.PI * 2 + layer * 0.6;
        const p = ball(head, layer === 2 ? center : color,
          [Math.sin(a) * radius, 0.05 + layer * 0.07, Math.cos(a) * radius], [0.13 - layer * 0.02, 0.13, 0.075]);
        p.rotation.set(0.3, a, 0.12);
      }
    }
    ball(head, center, [0, 0.18, 0], [0.07, 0.1, 0.07]);
  } else if (form === 'lavender') {
    stem(head, [0, -0.07, 0], [0, 0.65, 0], 0.015);
    for (let i = 0; i < 12; i++) {
      const a = i * 2.4, y = i * 0.05;
      ball(head, i % 3 ? color : center, [Math.sin(a) * (0.09 - i * 0.004), y, Math.cos(a) * 0.07], [0.07, 0.085, 0.06]);
    }
  } else if (form === 'hydrangea') {
    for (let i = 0; i < 18; i++) {
      const a = i * 2.39996, r = 0.24 * Math.sqrt(i / 18);
      const floret = new THREE.Group(); floret.position.set(Math.cos(a) * r, Math.sqrt(Math.max(0, 0.075 - r * r)), Math.sin(a) * r); head.add(floret);
      petals(floret, 4, i % 3 ? color : '#c4cde5', 0.045, 0.065, 0.045);
      ball(floret, center, [0, 0.03, 0], [0.025, 0.025, 0.025]);
    }
  } else {
    const sunflower = form === 'sunflower';
    petals(head, sunflower ? 13 : form === 'cosmos' ? 8 : 12, color, sunflower ? 0.2 : 0.16, sunflower ? 0.16 : 0.15, form === 'cosmos' ? 0.1 : 0.065);
    if (sunflower) petals(head, 13, '#f5d57b', 0.17, 0.14, 0.055, -0.025, 0.2);
    ball(head, center, [0, 0.04, 0], [sunflower ? 0.15 : 0.09, 0.07, sunflower ? 0.15 : 0.09]);
    head.rotation.x = 0.45;
  }
  group.userData.flowerId = flower.id;
  return group;
}

export function makeFlowerPot(parent, flower, position, { scale = 1, count = 5, potColor = '#e7c2b0' } = {}) {
  const group = new THREE.Group(); group.position.set(...position); group.scale.setScalar(scale); parent.add(group);
  cylinder(group, potColor, [0, 0.25, 0], 0.34, 0.25, 0.5);
  cylinder(group, '#79634e', [0, 0.49, 0], 0.3, 0.3, 0.025);
  cylinder(group, potColor, [0, 0.48, 0], 0.36, 0.36, 0.09);
  for (let i = 0; i < count; i++) {
    const a = i * 2.39996, r = i === 0 ? 0 : 0.18;
    const bloom = makeFlower(flower, { height: 0.75 + Math.sin(i * 1.9) * 0.12, variation: i });
    bloom.position.set(Math.cos(a) * r, 0.5, Math.sin(a) * r); group.add(bloom);
  }
  group.userData.flowerId = flower.id;
  return group;
}
