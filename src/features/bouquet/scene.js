import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { makeFlower } from "../../scene/flowers.js";
import { flowerById } from "../../data/flowers.js";
import { mergeClay } from "../../scene/optimize.js";
import { createWrapping, disposeWrapping } from "./wrapping.js";

export function createBouquetScene(container, callbacks = {}) {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "default",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.3));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.domElement.setAttribute(
    "aria-label",
    "ช่อดอกไม้สามมิติ แตะดอกไม้เพื่อเลือกแล้วลากจัดตำแหน่ง",
  );
  container.append(renderer.domElement);
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100),
    bouquet = new THREE.Group();
  scene.add(bouquet);
  scene.add(new THREE.HemisphereLight("#fff7eb", "#c1c3aa", 2.8));
  const sun = new THREE.DirectionalLight("#fff0d5", 3.1);
  sun.position.set(-4, 7, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -5;
  sun.shadow.camera.right = 5;
  sun.shadow.camera.top = 6;
  sun.shadow.camera.bottom = -4;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  const fill = new THREE.DirectionalLight("#f8d9e2", 1.3);
  fill.position.set(4, 3, -3);
  scene.add(fill);
  const floorGeometry = new THREE.PlaneGeometry(200, 200),
    floorMaterial = new THREE.ShadowMaterial({
      color: "#827760",
      opacity: 0.13,
    });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.05;
  floor.receiveShadow = true;
  scene.add(floor);
  const cylinder = new THREE.CylinderGeometry(0.023, 0.026, 1, 7),
    leafGeometry = new THREE.SphereGeometry(1, 10, 8),
    green = new THREE.MeshStandardMaterial({ color: "#879e76", roughness: 1 });
  const selectionGeometry = new THREE.TorusGeometry(0.39, 0.014, 6, 40),
    selectionMaterial = new THREE.MeshBasicMaterial({
      color: "#bc7b94",
      transparent: true,
      opacity: 0.8,
      depthTest: false,
    });
  const selection = new THREE.Mesh(selectionGeometry, selectionMaterial);
  selection.renderOrder = 9;
  selection.visible = false;
  scene.add(selection);
  camera.position.set(0, 3.2, 8);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableDamping = false;
  controls.minPolarAngle = 0.75;
  controls.maxPolarAngle = 1.55;
  controls.minAzimuthAngle = -0.7;
  controls.maxAzimuthAngle = 0.7;
  controls.minDistance = 3;
  controls.maxDistance = 18;
  const prototypes = new Map(),
    models = new Map(),
    raycaster = new THREE.Raycaster(),
    pointer = new THREE.Vector2(),
    binding = new THREE.Vector3(0, 0.12, 0);
  let draft = null,
    wrapping = null,
    wrapKey = "",
    activeId = null,
    reduced = false,
    frame = null,
    dead = false,
    drag = null,
    animated = false,
    editable = true;

  function prototype(flower, color) {
    const key = `${flower.id}:${color}`;
    if (prototypes.has(key)) return prototypes.get(key);
    const full = makeFlower({ ...flower, color });
    const head = full.getObjectByName("flower-head");
    head.removeFromParent();
    head.position.set(0, 0, 0);
    mergeClay(head);
    prototypes.set(key, head);
    return head;
  }
  function build(stem) {
    const flower = flowerById.get(stem.flowerId),
      key = `${flower.id}:${stem.color}`,
      group = new THREE.Group();
    group.userData.stemId = stem.id;
    const head = prototype(flower, stem.color).clone(true);
    head.scale.setScalar(0.92);
    group.add(head);
    const stalk = new THREE.Mesh(cylinder, green);
    stalk.castShadow = true;
    group.add(stalk);
    const leaves = [-1, 1].map((side) => {
      const leaf = new THREE.Mesh(leafGeometry, green);
      leaf.scale.set(
        flower.leafShape === "strap" ? 0.045 : 0.075,
        flower.leafShape === "strap" ? 0.33 : 0.21,
        0.028,
      );
      leaf.rotation.z = side * 0.65;
      group.add(leaf);
      return leaf;
    });
    bouquet.add(group);
    return {
      group,
      head,
      stalk,
      leaves,
      key,
      position: new THREE.Vector3(...stem.position),
      from: new THREE.Vector3(...stem.position),
      target: new THREE.Vector3(...stem.position),
      start: performance.now(),
      fresh: true,
      rotation: stem.rotation,
    };
  }
  function applyModel(model, p) {
    model.position.lerpVectors(model.from, model.target, p);
    const reveal = model.fresh ? p : 1,
      tip = model.position
        .clone()
        .sub(binding)
        .multiplyScalar(0.05 + 0.95 * reveal)
        .add(binding);
    const vector = tip.clone().sub(binding);
    model.stalk.position.copy(binding).add(tip).multiplyScalar(0.5);
    model.stalk.scale.set(1, vector.length(), 1);
    model.stalk.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      vector.normalize(),
    );
    model.head.position.copy(tip);
    model.head.scale.setScalar(0.92 * (0.05 + 0.95 * reveal));
    model.head.rotation.z = model.rotation[2];
    model.leaves.forEach((leaf, i) => {
      leaf.position.lerpVectors(binding, tip, 0.39 + i * 0.19);
      leaf.position.x += (i ? 1 : -1) * 0.07;
    });
  }
  function fit() {
    if (!draft) return;
    const bounds = new THREE.Box3(
      new THREE.Vector3(-0.85, -1, -0.8),
      new THREE.Vector3(0.85, 1.1, 0.8),
    );
    for (const stem of draft.stems) {
      const p = new THREE.Vector3(...stem.position);
      bounds.expandByPoint(p.clone().addScalar(0.65));
      bounds.expandByPoint(p.clone().addScalar(-0.65));
    }
    const center = bounds.getCenter(new THREE.Vector3()),
      size = bounds.getSize(new THREE.Vector3());
    const distance =
      (Math.max(size.y, size.x / camera.aspect) /
        2 /
        Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) *
      1.18;
    const direction = camera.position.clone().sub(controls.target).normalize();
    if (!Number.isFinite(direction.x)) direction.set(0, 0.23, 1).normalize();
    controls.target.copy(center);
    camera.position
      .copy(center)
      .addScaledVector(direction, Math.max(4, distance));
    controls.update();
  }
  function render() {
    if (dead) return;
    selection.visible = !!activeId && models.has(activeId);
    if (selection.visible) {
      selection.position.copy(models.get(activeId).position);
      selection.quaternion.copy(camera.quaternion);
    }
    renderer.render(scene, camera);
  }
  function tick(now) {
    frame = null;
    if (dead || window.document.hidden) return;
    let moving = false;
    for (const model of models.values()) {
      const p = reduced ? 1 : Math.min((now - model.start) / 320, 1);
      applyModel(model, p * p * (3 - 2 * p));
      if (p < 1) moving = true;
      else model.fresh = false;
    }
    render();
    if (moving) frame = requestAnimationFrame(tick);
    else if (animated) {
      animated = false;
      renderer.shadowMap.needsUpdate = true;
      render();
    }
  }
  function request() {
    if (frame === null && !dead && !window.document.hidden)
      frame = requestAnimationFrame(tick);
  }
  function resize() {
    const w = container.clientWidth,
      h = container.clientHeight;
    if (w < 1 || h < 1) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    fit();
    request();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  function setDocument(value, { preview = false } = {}) {
    draft = value;
    const ids = new Set(value.stems.map((s) => s.id));
    for (const [id, model] of models)
      if (!ids.has(id)) {
        model.group.removeFromParent();
        models.delete(id);
      }
    for (const stem of value.stems) {
      let model = models.get(stem.id);
      const key = `${stem.flowerId}:${stem.color}`;
      if (model?.key !== key) {
        model?.group.removeFromParent();
        model = build(stem);
        models.set(stem.id, model);
      }
      model.from.copy(model.position);
      model.target.set(...stem.position);
      model.rotation = stem.rotation;
      model.start =
        preview || reduced ? performance.now() - 400 : performance.now();
    }
    const activeKeys = new Set([...models.values()].map((m) => m.key));
    for (const [key, proto] of prototypes)
      if (!activeKeys.has(key)) {
        proto.traverse((o) => o.geometry?.dispose());
        prototypes.delete(key);
      }
    const nextKey = JSON.stringify([
      value.wrapping,
      value.ribbon,
      value.decorations,
      value.stems.length,
    ]);
    if (nextKey !== wrapKey) {
      if (wrapping) disposeWrapping(wrapping);
      wrapping = createWrapping(value);
      bouquet.add(wrapping);
      wrapKey = nextKey;
    }
    renderer.domElement.dataset.stemCount = String(models.size);
    renderer.domElement.dataset.paperShape = value.wrapping.shape;
    renderer.domElement.dataset.ribbonStyle = value.ribbon.style;
    if (!preview) {
      renderer.shadowMap.needsUpdate = true;
      fit();
    }
    animated = !reduced;
    request();
  }
  function point(event) {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - r.left) / r.width) * 2 - 1,
      (-(event.clientY - r.top) / r.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
  }
  function hit(event) {
    point(event);
    const hits = raycaster.intersectObjects(bouquet.children, true);
    for (const h of hits) {
      if (h.object.material?.transparent) continue;
      let o = h.object;
      while (o && !o.userData.stemId) o = o.parent;
      return o?.userData.stemId;
    }
    return null;
  }
  function down(event) {
    if (!editable || event.button !== 0 || drag) return;
    const id = hit(event);
    if (!id) return;
    event.stopImmediatePropagation();
    event.preventDefault();
    activeId = id;
    callbacks.onSelect?.(id);
    controls.enabled = false;
    const position = models.get(id).target.clone(),
      plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -position.z),
      p = raycaster.ray.intersectPlane(plane, new THREE.Vector3());
    if (!p) {
      controls.enabled = true;
      return;
    }
    drag = { id, pointerId: event.pointerId, plane, offset: p.sub(position) };
    renderer.domElement.setPointerCapture(event.pointerId);
    callbacks.onDragStart?.();
    request();
  }
  function move(event) {
    if (!drag) {
      renderer.domElement.style.cursor = hit(event) ? "grab" : "default";
      return;
    }
    if (event.pointerId !== drag.pointerId) return;
    event.preventDefault();
    point(event);
    const p = raycaster.ray.intersectPlane(drag.plane, new THREE.Vector3());
    if (p) callbacks.onMove?.(drag.id, p.sub(drag.offset).toArray());
  }
  function end(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    try {
      renderer.domElement.releasePointerCapture(event.pointerId);
    } catch {}
    drag = null;
    controls.enabled = true;
    if (event.type === "pointercancel") callbacks.onDragCancel?.();
    else callbacks.onDragEnd?.();
    renderer.shadowMap.needsUpdate = true;
    request();
  }
  function visibility() {
    if (window.document.hidden && frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
    } else request();
  }
  controls.addEventListener("change", request);
  renderer.domElement.addEventListener("pointerdown", down, true);
  renderer.domElement.addEventListener("pointermove", move);
  renderer.domElement.addEventListener("pointerup", end);
  renderer.domElement.addEventListener("pointercancel", end);
  window.document.addEventListener("visibilitychange", visibility);
  renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    if (!dead)
      callbacks.onError?.(
        "กราฟิกหยุดชั่วคราว โปรดกลับหน้าร้านแล้วเข้าสตูดิโอใหม่ค่ะ",
      );
  });
  resize();
  return {
    setDocument,
    select(id) {
      activeId = id;
      renderer.domElement.dataset.activeStem = id || "";
      request();
    },
    setReducedMotion(value) {
      reduced = value;
      request();
    },
    setEditable(value) {
      editable = value;
      if (!value) activeId = null;
      request();
    },
    rotate(direction) {
      const offset = camera.position.clone().sub(controls.target);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), direction * 0.16);
      camera.position.copy(controls.target).add(offset);
      controls.update();
      request();
    },
    fit() {
      fit();
      request();
    },
    dispose() {
      dead = true;
      if (frame !== null) cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      sun.shadow.dispose();
      window.document.removeEventListener("visibilitychange", visibility);
      if (wrapping) disposeWrapping(wrapping);
      for (const proto of prototypes.values())
        proto.traverse((o) => o.geometry?.dispose());
      [cylinder, leafGeometry, selectionGeometry, floorGeometry].forEach((g) =>
        g.dispose(),
      );
      [green, selectionMaterial, floorMaterial].forEach((m) => m.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
