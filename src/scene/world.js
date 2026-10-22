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
  const { door, roof, cat } = buildShop(scene);
  const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
  const poses = {
    outside: { position: new THREE.Vector3(), target: new THREE.Vector3(0, 1.8, 0.35), fov: 34, offset: new THREE.Vector2() },
    introducing: { position: new THREE.Vector3(0.35, 2.8, 3.2), target: new THREE.Vector3(0.35, 1.3, -0.65), fov: 58, offset: new THREE.Vector2() },
    browsing: { position: new THREE.Vector3(1.05, 3.0, 1.7), target: new THREE.Vector3(2.24, 1.55, -1.28), fov: 55, offset: new THREE.Vector2() },
  };
  const look = poses.outside.target.clone(), offset = new THREE.Vector2();
  let reduced = reducedMotion, transition = null, phase = 'outside', elapsed = 0, lastTime = null, frame = null, disposed = false, paused = false;
  let pointerStart = null;

  function project() {
    const width = container.clientWidth, height = container.clientHeight;
    camera.setViewOffset(width, height, width * offset.x, height * offset.y, width, height);
    camera.updateProjectionMatrix(); camera.lookAt(look);
  }
  function applyPose(name) {
    const pose = poses[name]; camera.position.copy(pose.position); look.copy(pose.target);
    camera.fov = pose.fov; offset.copy(pose.offset); project();
  }
  function resize() {
    const width = container.clientWidth, height = container.clientHeight;
    renderer.setSize(width, height); camera.aspect = width / height;
    const mobile = width < 760;
    poses.outside.position.set(mobile ? 19 : 14, mobile ? 13 : 10.2, mobile ? 27 : 20);
    poses.outside.fov = mobile ? 45 : 34;
    poses.introducing.fov = mobile ? 66 : 58;
    poses.browsing.offset.set(mobile ? 0 : 0.22, mobile ? 0.20 : 0);
    if (!transition) applyPose(phase); else project();
    draw();
  }

  function travel(kind) {
    const destination = { entering: 'introducing', 'moving-to-flowers': 'browsing', leaving: 'outside' }[kind];
    phase = kind;
    transition = { kind, destination, startedAt: performance.now(), duration: kind === 'moving-to-flowers' ? 2400 : 3000,
      from: camera.position.clone(), fromTarget: look.clone(), fromFov: camera.fov, fromOffset: offset.clone(), to: poses[destination] };
    renderer.shadowMap.needsUpdate = true;
    startLoop();
  }
  function updateTransition() {
    const t = transition;
    const progress = reduced ? 1 : Math.min((performance.now() - t.startedAt) / t.duration, 1);
    // Door opens first. The camera travels through its actual doorway.
    if (t.kind === 'entering') door.rotation.y = Math.min(progress / 0.3, 1) * -Math.PI * 0.57;
    else if (t.kind === 'leaving') door.rotation.y = (1 - Math.max(0, (progress - 0.7) / 0.3)) * -Math.PI * 0.57;
    let p = t.kind === 'entering' ? Math.max(0, (progress - 0.12) / 0.88) : progress;
    p = p * p * (3 - 2 * p);
    camera.fov = THREE.MathUtils.lerp(t.fromFov, t.to.fov, p);
    offset.lerpVectors(t.fromOffset, t.to.offset, p);
    // A waypoint in front of the door avoids clipping through the side wall.
    const mid = new THREE.Vector3(0.1, 3.25, 6.9);
    if (t.kind === 'moving-to-flowers') camera.position.lerpVectors(t.from, t.to.position, p);
    else {
      const start = t.kind === 'entering' ? t.from : t.to.position;
      const end = t.kind === 'entering' ? t.to.position : t.from;
      const path = new THREE.CatmullRomCurve3([start, mid, end]);
      camera.position.copy(path.getPoint(t.kind === 'entering' ? p : 1 - p));
    }
    look.lerpVectors(t.fromTarget, t.to.target, p); project();
    roof.visible = t.kind === 'entering' ? progress < 0.65 : t.kind === 'leaving' && progress > 0.35;
    if (progress === 1) {
      phase = t.destination; roof.visible = phase === 'outside';
      applyPose(phase); door.rotation.y = phase === 'outside' ? 0 : -Math.PI * 0.57;
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
    cat.update(elapsed, reduced, phase === 'introducing'); draw();
    if ((!reduced && !paused && phase === 'introducing') || transition) frame = requestAnimationFrame(animate);
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
  function up(e) { if (pointerStart && Math.hypot(e.clientX - pointerStart.x, e.clientY - pointerStart.y) < 8 && phase === 'browsing' && !transition) { const id = hit(e); if (id) onFlower(id); } pointerStart = null; }
  function move(e) { if (e.pointerType !== 'touch') renderer.domElement.style.cursor = phase === 'browsing' && !transition && hit(e) ? 'pointer' : 'default'; }
  const observer = new ResizeObserver(resize); observer.observe(container);
  renderer.domElement.addEventListener('pointerdown', down); renderer.domElement.addEventListener('pointerup', up); renderer.domElement.addEventListener('pointermove', move);
  document.addEventListener('visibilitychange', visibility);
  resize(); startLoop();
  return {
    enter: () => travel('entering'), browse: () => travel('moving-to-flowers'), leave: () => travel('leaving'),
    setReducedMotion(value) { reduced = value; cat.update(elapsed, reduced, phase === 'introducing'); draw(); startLoop(); },
    setPaused(value) { paused = value; if (!value) startLoop(); },
    get phase() { return phase; },
    renderer, scene, camera,
    dispose() {
      disposed = true; if (frame !== null) cancelAnimationFrame(frame); observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      renderer.domElement.removeEventListener('pointerdown', down); renderer.domElement.removeEventListener('pointerup', up); renderer.domElement.removeEventListener('pointermove', move);
      disposeScene(scene); renderer.dispose(); renderer.domElement.remove();
    },
  };
}
