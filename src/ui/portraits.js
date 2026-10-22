import * as THREE from 'three';
import { makeFlower } from '../scene/flowers.js';
import { disposeScene } from '../scene/clay.js';
import { mergeClay } from '../scene/optimize.js';

/** Lazy, cached portraits: the welcome screen never renders the full catalog. */
export function createPortraitCache() {
  let renderer = null, unavailable = false;
  const cache = new Map();
  const camera = new THREE.PerspectiveCamera(32, 200 / 240, 0.1, 20);
  camera.position.set(1.6, 1.6, 3.0); camera.lookAt(0, 0.78, 0);

  function fallback(flower) {
    const petals = Array.from({ length: 5 }, (_, i) => `<ellipse cx="60" cy="48" rx="11" ry="21" fill="${flower.color}" transform="rotate(${i * 72} 60 65)"/>`).join('');
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160"><path d="M60 120V65M60 108Q31 94 42 85Q61 88 60 108" fill="#9bb184" stroke="#8ca376" stroke-width="4"/>${petals}<circle cx="60" cy="65" r="9" fill="${flower.center}"/></svg>`)}`;
  }

  return {
    get(flower) {
      if (cache.has(flower.id)) return cache.get(flower.id);
      let scene = null, url;
      try {
        if (unavailable) throw new Error('Portrait context unavailable');
        if (!renderer) {
          renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
          renderer.setSize(200, 240); renderer.setPixelRatio(1);
          renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.35;
          renderer.domElement.addEventListener('webglcontextlost', () => { unavailable = true; });
        }
        scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight('#fff4e1', '#a4b598', 3));
        const light = new THREE.DirectionalLight('#fff2db', 3); light.position.set(-3, 5, 4); scene.add(light);
        const bloom=makeFlower(flower,{height:1.1});bloom.position.y=0.15;scene.add(bloom);
        mergeClay(scene); renderer.render(scene, camera);
        url = renderer.domElement.toDataURL('image/png');
      } catch {
        unavailable = true; url = fallback(flower);
      } finally {
        // Preserve clay materials shared with the live shop renderer.
        if (scene) disposeScene(scene, { disposeMaterials: false });
      }
      cache.set(flower.id, url); return url;
    },
    dispose() { renderer?.dispose(); renderer?.forceContextLoss(); renderer = null; cache.clear(); },
  };
}
