import * as THREE from 'three';
import { buildShop } from './shop.js';
import { disposeScene } from './clay.js';

export function createWorld(container, { onFlower, onVisitComplete, reducedMotion = false }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'default' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  container.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const hemi = new THREE.HemisphereLight('#fff5e4', '#b6b99b', 2.3); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff1d4', 2.8); sun.position.set(-5, 12, 7); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -8; sun.shadow.camera.right = 8;
  sun.shadow.camera.top = 9; sun.shadow.camera.bottom = -7; sun.shadow.normalBias = 0.035; sun.shadow.bias = -0.0002; scene.add(sun);
  const fill = new THREE.DirectionalLight('#f8dce0', 1.1); fill.position.set(6, 5, -4); scene.add(fill);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ color: '#7a8061', opacity: 0.14 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.63; floor.receiveShadow = true; scene.add(floor);
  const { door, roof, cat, pickables } = buildShop(scene);
  const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
  const outside = new THREE.Vector3(), outsideTarget = new THREE.Vector3(0, 1.8, 0.35);
  const inside = new THREE.Vector3(0.03, 3.25, 2.53), insideTarget = new THREE.Vector3(0.2, 1.3, -0.6);
  let reduced = reducedMotion, transition = null, phase = 'outside', elapsed = 0, lastTime = null, frame = null, disposed = false, paused = false;
  let outsideFov = 34, insideFov = 72;
  let pointerStart = null;

  function resize() {
    const width = container.clientWidth, height = container.clientHeight;
    renderer.setSize(width, height); camera.aspect = width / height;
    const mobile = width < 760;
    outside.set(mobile ? 12.8 : 14.0, mobile ? 9.0 : 10.2, mobile ? 18.8 : 20.0);
    outsideFov = mobile ? 41 : 34; insideFov = mobile ? 88 : 72;
    camera.fov = phase === 'inside' ? insideFov : outsideFov;
    camera.setViewOffset(width, height, -width * (mobile ? 0 : 0.042), -height * (mobile ? 0.09 : 0.025), width, height);
    camera.updateProjectionMatrix();
    if (!transition) { camera.position.copy(phase === 'inside' ? inside : outside); camera.lookAt(phase === 'inside' ? insideTarget : outsideTarget); }
    draw();
  }

  function travel(entering) {
    phase = entering ? 'entering' : 'leaving';
    const target = entering ? inside : outside;
    transition = { entering, startedAt: performance.now(), from: camera.position.clone(), to: target.clone(), targetFrom: entering ? outsideTarget.clone() : insideTarget.clone(), targetTo: entering ? insideTarget.clone() : outsideTarget.clone() };
    renderer.shadowMap.needsUpdate = true;
    startLoop();
  }
  function updateTransition() {
    const t = transition;
    const progress = reduced ? 1 : Math.min((performance.now() - t.startedAt) / 3000, 1);
    // Door opens first. The camera travels through its actual doorway.
    const doorProgress = Math.min(progress / 0.3, 1);
    door.rotation.y = (t.entering ? doorProgress : 1 - Math.max(0, (progress - 0.7) / 0.3)) * -Math.PI * 0.57;
    let p = t.entering ? Math.max(0, (progress - 0.12) / 0.88) : progress;
    p = p * p * (3 - 2 * p);
    camera.fov = THREE.MathUtils.lerp(t.entering ? outsideFov : insideFov, t.entering ? insideFov : outsideFov, p);
    camera.updateProjectionMatrix();
    // A waypoint in front of the door avoids clipping through the side wall.
    const mid = new THREE.Vector3(0.1, 3.25, 6.9);
    const start = t.entering ? t.from : t.to;
    const end = t.entering ? t.to : t.from;
    const path = new THREE.CatmullRomCurve3([start, mid, end]);
    camera.position.copy(path.getPoint(t.entering ? p : 1 - p));
    camera.lookAt(new THREE.Vector3().lerpVectors(t.targetFrom, t.targetTo, p));
    roof.visible = t.entering ? progress < 0.65 : progress > 0.35;
    if (progress === 1) {
      phase = t.entering ? 'inside' : 'outside'; roof.visible = phase === 'outside';
      camera.position.copy(t.to); camera.lookAt(t.targetTo); door.rotation.y = t.entering ? -Math.PI * 0.57 : 0;
      transition = null; onVisitComplete(phase);
      renderer.shadowMap.needsUpdate = true;
    }
  }

  function draw() { if (!disposed) renderer.render(scene, camera); }
  function animate(now) {
    frame = null;
    if (disposed || document.hidden) { lastTime = null; return; }
    const dt = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, 0.15); lastTime = now; elapsed += dt;
    if (transition) updateTransition();
    cat.update(elapsed, reduced, phase === 'inside'); draw();
    if ((!reduced && !paused && phase === 'inside') || transition) frame = requestAnimationFrame(animate);
  }
  function startLoop() { if (frame === null && !document.hidden && !disposed) { lastTime = null; frame = requestAnimationFrame(animate); } }
  function visibility() { if (document.hidden && frame !== null) { cancelAnimationFrame(frame); frame = null; lastTime = null; } else startLoop(); }
  function hit(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(scene.children, true);
    // Respect walls and furniture: only the nearest visible surface is pickable.
    const first = hits.find(hit => {
      for (let object = hit.object; object; object = object.parent) if (!object.visible) return false;
      return !hit.object.material?.transparent;
    });
    let object = first?.object;
    while (object && !object.userData.flowerId) object = object.parent;
    return object?.userData.flowerId;
  }
  function down(e) { pointerStart = { x: e.clientX, y: e.clientY }; }
  function up(e) { if (pointerStart && Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y) < 8 && !transition) { const id = hit(e); if (id) onFlower(id); } pointerStart = null; }
  function move(e) { if (e.pointerType !== 'touch') renderer.domElement.style.cursor = !transition && hit(e) ? 'pointer' : 'default'; }
  const observer = new ResizeObserver(resize); observer.observe(container);
  renderer.domElement.addEventListener('pointerdown', down); renderer.domElement.addEventListener('pointerup', up); renderer.domElement.addEventListener('pointermove', move);
  document.addEventListener('visibilitychange', visibility);
  resize(); startLoop();
  return {
    enter: () => travel(true), leave: () => travel(false),
    setReducedMotion(value) { reduced = value; cat.update(elapsed, reduced, phase === 'inside'); draw(); startLoop(); },
    setPaused(value) { paused = value; if (!value) startLoop(); },
    get phase() { return phase; },
    renderer, scene, camera, pickables,
    dispose() {
      disposed = true; if (frame !== null) cancelAnimationFrame(frame); observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      renderer.domElement.removeEventListener('pointerdown', down); renderer.domElement.removeEventListener('pointerup', up); renderer.domElement.removeEventListener('pointermove', move);
      disposeScene(scene); renderer.dispose(); renderer.domElement.remove();
    },
  };
}
