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
    const leaf = ball(group, '#8da47b', [side * 0.11, height * (0.3 + i * 0.19), 0], flower.leafShape === 'strap' ? [0.045,0.34,0.025] : flower.leafShape === 'slender' ? [0.035,0.2,0.02] : [0.07,0.22,0.035]);
    leaf.rotation.z = -side * 0.65;
  }
  const head = new THREE.Group(); head.name='flower-head'; head.position.set(lean, height, 0); group.add(head);
  const { form, color, center } = flower;
  const lightColor = `#${new THREE.Color(color).lerp(new THREE.Color('#ffffff'),0.2).getHexString()}`;
  if (form === 'tulip') {
    ball(head, color, [0, 0.09, 0], [0.19, 0.23, 0.19]);
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      const p = ball(head, i % 2 ? color : lightColor, [Math.sin(a) * 0.12, 0.15, Math.cos(a) * 0.12], [0.105, 0.22, 0.085]);
      p.rotation.y = a;
    }
  } else if (form === 'rose' || form === 'peony') {
    const count=flower.petalCount || (form==='peony'?9:7);
    for (let layer = 0; layer < (form==='peony'?4:3); layer++) {
      const radius = 0.18 - layer * 0.055;
      for (let i = 0; i < count; i++) {
        const a = i / count * Math.PI * 2 + layer * 0.6;
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
      petals(floret, 4, i % 3 ? color : lightColor, 0.045, 0.065, 0.045);
      ball(floret, center, [0, 0.03, 0], [0.025, 0.025, 0.025]);
    }
  } else if (form === 'lily') {
    petals(head, 6, color, 0.18, 0.23, 0.085, 0.01);
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      stem(head, [0, 0, 0], [Math.cos(a) * 0.09, 0.17, Math.sin(a) * 0.09], 0.009, center);
      ball(head, center, [Math.cos(a) * 0.09, 0.17, Math.sin(a) * 0.09], [0.025, 0.035, 0.025]);
    }
    head.rotation.x = 0.5;
  } else if (form === 'orchid') {
    petals(head, 3, color, 0.12, 0.19, 0.1);
    for (const side of [-1, 1]) {
      const wing = ball(head, color, [side * 0.18, 0.05, 0], [0.18, 0.05, 0.12]); wing.rotation.y = side * 0.5;
    }
    ball(head, center, [0, 0.09, 0.12], [0.09, 0.07, 0.12]);
    head.rotation.x = 0.8;
  } else if (form === 'valley') {
    stem(head,[0,-0.1,0],[0,0.5,0],0.015);
    for(let i=0;i<6;i++) {
      const y=i*0.09,side=i%2?-1:1;
      stem(head,[0,y+0.1,0],[side*0.12,y+0.07,0],0.011);
      const bell=new THREE.Group();bell.position.set(side*0.13,y,0.02);head.add(bell);
      const points=[new THREE.Vector2(0.025,0.09),new THREE.Vector2(0.065,0.07),new THREE.Vector2(0.08,0),new THREE.Vector2(0.095,-0.045)];
      mesh(new THREE.LatheGeometry(points,12),clay(color,{side:THREE.DoubleSide}),bell);
      for(let p=0;p<5;p++){const a=p*Math.PI*2/5;ball(bell,color,[Math.sin(a)*0.075,-0.043,Math.cos(a)*0.075],[0.035,0.025,0.035]);}
    }
  } else if (form === 'snowdrop') {
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,-0.1,0),new THREE.Vector3(0,0.28,0),new THREE.Vector3(0.17,0.36,0),new THREE.Vector3(0.23,0.2,0)]);
    mesh(new THREE.TubeGeometry(curve,12,0.016,6,false),'#8da47b',head);
    ball(head,center,[0.23,0.19,0],[0.07,0.07,0.06]);
    for(let i=0;i<3;i++){const a=i*Math.PI*2/3;const p=ball(head,color,[0.23+Math.sin(a)*0.075,0.025,Math.cos(a)*0.075],[0.055,0.18,0.04]);p.rotation.set(Math.sin(a)*0.16,a,Math.cos(a)*0.16);ball(head,center,[0.23+Math.sin(a)*0.035,-0.03,Math.cos(a)*0.035],[0.024,0.045,0.023]);}
  } else if (form === 'iris') {
    for(let i=0;i<3;i++) {
      const a=i*Math.PI*2/3;
      const upright=ball(head,color,[Math.sin(a)*0.09,0.17,Math.cos(a)*0.09],[0.105,0.24,0.055]);upright.rotation.set(0,a,0);
      const fall=ball(head,lightColor,[Math.sin(a+0.5)*0.2,-0.025,Math.cos(a+0.5)*0.2],[0.12,0.08,0.23]);fall.rotation.set(0.6,a+0.5,0);
      const beard=ball(head,center,[Math.sin(a+0.5)*0.18,0.045,Math.cos(a+0.5)*0.18],[0.035,0.035,0.12]);beard.rotation.y=a+0.5;
    }
  } else if (form === 'bell') {
    stem(head, [0, -0.05, 0], [0, 0.58, 0], 0.017);
    for (let i = 0; i < 5; i++) {
      const side = i % 2 ? -1 : 1, y = i * 0.105;
      stem(head, [0, y + 0.1, 0], [side * 0.12, y + 0.06, 0], 0.013);
      cylinder(head, color, [side * 0.12, y, 0], 0.055, 0.12, 0.14);
      ball(head, center, [side * 0.12, y - 0.065, 0], [0.055, 0.025, 0.055]);
    }
  } else if (form === 'star') {
    petals(head, 5, color, 0.13, 0.17, 0.1);
    ball(head, center, [0, 0.055, 0], [0.065, 0.055, 0.065]);
    head.rotation.x = 0.4;
  } else {
    const sunflower = form === 'sunflower';
    petals(head, flower.petalCount || (sunflower ? 13 : form === 'cosmos' ? 8 : 12), color, sunflower ? 0.2 : 0.16, sunflower ? 0.16 : 0.15, form === 'cosmos' ? 0.1 : 0.065);
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
