import * as THREE from 'three';
import { ball, mesh, stem } from './clay.js';
import { mergeClay } from './optimize.js';

/** Original procedural Persian cat. No downloaded model, texture or character. */
export function makeCat(parent) {
  const cat = new THREE.Group(); parent.add(cat);
  const white = '#fff9f0', pink = '#e9b0bf';
  // A flared skirt, soft bodice and little paws.
  mesh(new THREE.CylinderGeometry(0.31, 0.61, 0.65, 32), pink, cat, [0, 0.55, 0]);
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    ball(cat, '#edbdca', [Math.sin(a) * 0.48, 0.4, Math.cos(a) * 0.48], [0.12, 0.27, 0.12]);
  }
  ball(cat, white, [0, 0.99, 0], [0.4, 0.52, 0.3]);
  ball(cat, pink, [0, 0.92, 0.04], [0.35, 0.28, 0.29]);
  ball(cat, white, [-0.27, 0.15, 0.21], [0.2, 0.12, 0.28]);
  ball(cat, white, [0.27, 0.15, 0.21], [0.2, 0.12, 0.28]);
  const leftArm = ball(cat, white, [-0.46, 1.0, 0.06], [0.16, 0.33, 0.17]); leftArm.rotation.z = -0.38;
  const rightArm = new THREE.Group(); rightArm.name = 'mali-wave'; rightArm.position.set(0.38, 1.14, 0.06); cat.add(rightArm);
  ball(rightArm, white, [0.14, 0.1, 0.05], [0.17, 0.31, 0.17]); rightArm.rotation.z = -0.6;
  const head = new THREE.Group(); head.name = 'mali-head'; head.position.y = 1.72; cat.add(head);
  ball(head, white, [0, 0, 0], [0.62, 0.55, 0.47]);
  // Cheek ruff and forehead fluff create the Persian silhouette.
  for (let i = 0; i < 13; i++) {
    const a = (i / 12) * Math.PI * 1.6 + 0.65;
    ball(head, white, [Math.cos(a) * 0.5, Math.sin(a) * 0.43, 0.04], [0.19, 0.19, 0.32]);
  }
  for (const side of [-1, 1]) {
    const ear = mesh(new THREE.ConeGeometry(0.24, 0.47, 3), white, head, [side * 0.42, 0.45, -0.015]);
    ear.rotation.set(0, side * 0.15, -side * 0.24);
    const inner = mesh(new THREE.ConeGeometry(0.125, 0.28, 3), '#efc3cb', head, [side * 0.42, 0.47, 0.16]);
    inner.rotation.set(0, side * 0.15, -side * 0.24);
  }
  ball(head, white, [-0.1, 0.48, 0.22], [0.19, 0.15, 0.21]);
  ball(head, white, [0.11, 0.49, 0.21], [0.15, 0.13, 0.19]);
  const eyes = [];
  for (const side of [-1, 1]) {
    const eye = new THREE.Group(); eye.name = side < 0 ? 'mali-eye-left' : 'mali-eye-right'; eye.position.set(side * 0.245, 0.055, 0.425); head.add(eye);
    ball(eye, '#675544', [0, 0, 0], [0.15, 0.18, 0.075]);
    ball(eye, '#96af98', [0, -0.01, 0.04], [0.107, 0.13, 0.052]);
    ball(eye, '#302f2c', [0, 0.003, 0.074], [0.074, 0.108, 0.025]);
    ball(eye, '#ffffff', [-0.035, 0.055, 0.095], [0.035, 0.042, 0.014]);
    ball(eye, '#ffffff', [0.035, -0.03, 0.098], [0.015, 0.018, 0.012]); eyes.push(eye);
    ball(head, '#edc3c4', [side * 0.4, -0.13, 0.397], [0.11, 0.055, 0.033]);
    ball(head, white, [side * 0.13, -0.17, 0.46], [0.17, 0.115, 0.1]);
    for (let w = 0; w < 2; w++) stem(head, [side * 0.27, -0.14 - w * 0.05, 0.48], [side * 0.52, -0.12 - w * 0.08, 0.49], 0.008, '#c6b7a8');
  }
  ball(head, '#cc8f9b', [0, -0.12, 0.56], [0.065, 0.045, 0.035]);
  stem(head, [0, -0.14, 0.56], [0, -0.21, 0.55], 0.009, '#ad7d7d');
  stem(head, [0, -0.21, 0.55], [-0.045, -0.23, 0.54], 0.009, '#ad7d7d');
  stem(head, [0, -0.21, 0.55], [0.045, -0.23, 0.54], 0.009, '#ad7d7d');
  // Pink neck bow and an asymmetrical ear bow.
  for (const side of [-1, 1]) {
    const bow = ball(cat, '#c9859b', [side * 0.1, 1.22, 0.31], [0.13, 0.085, 0.06]); bow.rotation.z = side * 0.3;
    const earBow = ball(head, pink, [0.5 + side * 0.1, 0.31, 0.34], [0.115, 0.075, 0.06]); earBow.rotation.z = side * 0.3;
  }
  ball(cat, '#e6a5b8', [0, 1.22, 0.35], [0.055, 0.055, 0.045]);
  const tail = new THREE.Group(); tail.name = 'mali-tail'; tail.position.set(0.25, 0.4, -0.18); cat.add(tail);
  for (let i = 0; i < 9; i++) ball(tail, white, [0.28 + i * 0.065, Math.sin(i / 8 * Math.PI) * 0.35, -i * 0.055], [0.17, 0.17, 0.17]);
  mergeClay(cat, new Set([head, tail, rightArm]));
  mergeClay(head, new Set(eyes));
  eyes.forEach(eye => mergeClay(eye));
  mergeClay(tail); mergeClay(rightArm);
  return {
    group: cat,
    update(time, reduced, welcoming) {
      const cycle = time % 4.8;
      const blink = !reduced && cycle > 4.5 ? 1 - Math.sin((cycle - 4.5) / 0.3 * Math.PI) * 0.94 : 1;
      for (const eye of eyes) eye.scale.y = blink;
      tail.rotation.y = reduced ? 0.3 : 0.3 + Math.sin(time * 1.6) * 0.4;
      head.rotation.z = reduced ? 0 : Math.sin(time * 0.65) * 0.025;
      rightArm.rotation.z = -0.6 + (!reduced && welcoming ? Math.sin(time * 5) * 0.21 : 0);
    },
  };
}
