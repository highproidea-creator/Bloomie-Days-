import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Merge stationary clay by material and flower ID; animated groups stay intact. */
export function mergeClay(root, skip = new Set()) {
  root.updateWorldMatrix(true, true);
  const inverse = root.matrixWorld.clone().invert();
  const buckets = new Map(), originals = [];
  function visit(object, flowerId = null) {
    if (skip.has(object)) return;
    flowerId = object.userData.flowerId || flowerId;
    if (object.isMesh && !Array.isArray(object.material) && !object.material.transparent) {
      const key = `${object.material.uuid}:${flowerId || ''}`;
      if (!buckets.has(key)) buckets.set(key, { material: object.material, flowerId, geometries: [] });
      let geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
      geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld));
      // The primitive factories all expose position, normal, and uv.
      for (const name of Object.keys(geometry.attributes)) if (!['position', 'normal', 'uv'].includes(name)) geometry.deleteAttribute(name);
      buckets.get(key).geometries.push(geometry); originals.push(object);
    }
    for (const child of object.children) visit(child, flowerId);
  }
  for (const child of root.children) visit(child);
  for (const bucket of buckets.values()) {
    const merged = mergeGeometries(bucket.geometries, false);
    bucket.geometries.forEach(geometry => geometry.dispose());
    if (!merged) throw new Error('Clay geometry could not be merged');
    const result = new THREE.Mesh(merged, bucket.material);
    result.castShadow = true; result.receiveShadow = true;
    if (bucket.flowerId) result.userData.flowerId = bucket.flowerId;
    root.add(result);
  }
  for (const original of originals) original.removeFromParent();
}
