import * as THREE from 'three';
import { makeFlowerPot } from '../scene/flowers.js';
import { disposeScene } from '../scene/clay.js';
import { mergeClay } from '../scene/optimize.js';

/** Render local 3D models once, then release the temporary GPU context. */
export function makePortraits(catalog) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(200, 240); renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.35;
  const camera = new THREE.PerspectiveCamera(32, 200 / 240, 0.1, 20);
  camera.position.set(1.6, 1.6, 3.0); camera.lookAt(0, 0.78, 0);
  const results = new Map();
  for (const flower of catalog) {
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#fff4e1', '#a4b598', 3));
    const light = new THREE.DirectionalLight('#fff2db', 3); light.position.set(-3, 5, 4); scene.add(light);
    makeFlowerPot(scene, flower, [0, 0, 0], { scale: flower.form === 'lavender' ? 0.85 : 1, count: 3, potColor: '#e3c2b1' });
    mergeClay(scene);
    renderer.render(scene, camera); results.set(flower.id, renderer.domElement.toDataURL('image/png'));
    disposeScene(scene);
  }
  renderer.dispose(); renderer.forceContextLoss();
  return results;
}
