import test from 'node:test';
import assert from 'node:assert/strict';
import { flowers, validateCatalog } from '../src/data/flowers.js';
import { createVisitState } from '../src/core/visit.js';
import { createBouquetDraft, createCardDraft } from '../src/features/keepsakes/model.js';
import { Group } from 'three';
import { makeCat } from '../src/scene/cat.js';
import { disposeScene } from '../src/scene/clay.js';

test('the V1 catalog has eight complete and distinct entries', () => {
  assert.equal(flowers.length, 8);
  assert.equal(validateCatalog(flowers), true);
});
test('catalog accepts 100 flowers without a fixed-size limit', () => {
  const expanded = Array.from({ length: 100 }, (_, i) => ({ ...flowers[i % flowers.length], id: `flower-${i}` }));
  assert.equal(validateCatalog(expanded), true);
});
test('invalid entries fail clearly before rendering', () => {
  assert.throws(() => validateCatalog([flowers[0], flowers[0]]), /Duplicate/);
  assert.throws(() => validateCatalog([{ ...flowers[0], form: 'unknown' }]), /Unknown flower form/);
  assert.throws(() => validateCatalog([{ ...flowers[0], color: 'red' }]), /Invalid color/);
  assert.throws(() => validateCatalog([{ ...flowers[0], name: '' }]), /Missing name/);
});
test('camera transitions lock repeated input and allow a full return visit', () => {
  const visit = createVisitState();
  assert.equal(visit.phase, 'outside');
  assert.equal(visit.leave(), false);
  assert.equal(visit.enter(), true);
  assert.equal(visit.enter(), false);
  assert.equal(visit.leave(), false);
  visit.complete();
  assert.equal(visit.phase, 'inside');
  assert.equal(visit.leave(), true);
  assert.equal(visit.leave(), false);
  visit.complete();
  assert.equal(visit.phase, 'outside');
  assert.equal(visit.complete(), false);
  assert.equal(visit.enter(), true);
});
test('future keepsake drafts are independent JSON-serializable objects', () => {
  const a = createBouquetDraft(), b = createBouquetDraft();
  a.stems.push({ flowerId: flowers[0].id, position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 });
  assert.equal(b.stems.length, 0);
  const card = createCardDraft(); card.message = 'ขอให้วันนี้ใจดีกับคุณ';
  assert.deepEqual(JSON.parse(JSON.stringify({ bouquet: a, card })), { bouquet: a, card });
});

test('Mali blinks, sways her tail and respects reduced motion', () => {
  const root = new Group(), cat = makeCat(root);
  const eye = root.getObjectByName('mali-eye-left'), tail = root.getObjectByName('mali-tail');
  cat.update(0, false, true); const initialTail = tail.rotation.y;
  assert.equal(eye.scale.y, 1);
  cat.update(4.65, false, true);
  assert.ok(eye.scale.y < 0.1, 'eyes close during the blink');
  assert.notEqual(tail.rotation.y, initialTail);
  cat.update(4.65, true, true);
  assert.equal(eye.scale.y, 1);
  assert.equal(tail.rotation.y, 0.3);
  assert.equal(root.getObjectByName('mali-wave').rotation.z, -0.6);
  disposeScene(root);
});
