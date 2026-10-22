import test from 'node:test';
import assert from 'node:assert/strict';
import { flowers, validateCatalog } from '../src/data/flowers.js';
import { createVisitState } from '../src/core/visit.js';
import { createBouquetDraft, createCardDraft } from '../src/features/keepsakes/model.js';
import { Group } from 'three';
import { makeCat } from '../src/scene/cat.js';
import { disposeScene } from '../src/scene/clay.js';
import { getCatalogPage } from '../src/core/catalog.js';
import { makeFlower } from '../src/scene/flowers.js';
import { Box3 } from 'three';

test('the catalog has at least 50 distinct, complete flower types', () => {
  assert.ok(flowers.length >= 50);
  assert.equal(new Set(flowers.map(f => f.english)).size, flowers.length);
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
  assert.equal(visit.finishIntro(), false);
  assert.equal(visit.enter(), true);
  assert.equal(visit.enter(), false);
  assert.equal(visit.leave(), false);
  visit.complete();
  assert.equal(visit.phase, 'introducing');
  assert.equal(visit.complete(), false, 'greeting waits for the player');
  assert.equal(visit.finishIntro(), true);
  assert.equal(visit.finishIntro(), false);
  assert.equal(visit.leave(), false, 'sideways camera move is locked');
  visit.complete();
  assert.equal(visit.phase, 'browsing');
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

test('Flora blinks, sways her tail and respects reduced motion', () => {
  const root = new Group(), cat = makeCat(root);
  const eye = root.getObjectByName('flora-eye-left'), tail = root.getObjectByName('flora-tail');
  cat.update(0, false, true); const initialTail = tail.rotation.y;
  assert.equal(eye.scale.y, 1);
  cat.update(4.65, false, true);
  assert.ok(eye.scale.y < 0.1, 'eyes close during the blink');
  assert.notEqual(tail.rotation.y, initialTail);
  cat.update(4.65, true, true);
  assert.equal(eye.scale.y, 1);
  assert.equal(tail.rotation.y, 0.3);
  assert.equal(root.getObjectByName('flora-wave').rotation.z, -0.6);
  disposeScene(root);
});

test('the player can leave during the introduction and start a fresh visit', () => {
  const visit = createVisitState(); visit.enter(); visit.complete();
  assert.equal(visit.leave(), true); visit.complete();
  assert.equal(visit.phase, 'outside'); assert.equal(visit.finishIntro(), false);
  visit.enter(); visit.complete(); assert.equal(visit.phase, 'introducing');
});

test('every flower is reachable through pagination without duplicates', () => {
  const first = getCatalogPage(flowers), all = [];
  for (let page = 0; page < first.pageCount; page++) all.push(...getCatalogPage(flowers, { page }).entries);
  assert.deepEqual(all.map(f => f.id), flowers.map(f => f.id));
  assert.equal(getCatalogPage(flowers, { page: -10 }).page, 0);
  assert.equal(getCatalogPage(flowers, { page: 999 }).page, first.pageCount - 1);
  assert.throws(() => getCatalogPage(flowers, { pageSize: 0 }), /positive/);
});

test('search supports Thai, case-insensitive English, empty queries and no matches', () => {
  assert.equal(getCatalogPage(flowers, { query: 'กล้วยไม้' }).entries[0].id, 'orchid');
  assert.equal(getCatalogPage(flowers, { query: '  ORCHID ' }).entries[0].id, 'orchid');
  assert.equal(getCatalogPage(flowers, { query: 'not-a-flower', page: 99 }).total, 0);
  assert.equal(getCatalogPage(flowers, { query: '' }).total, flowers.length);
});

test('all 50 catalog entries produce finite, nonempty 3D flower geometry', () => {
  for (const flower of flowers) {
    const model = makeFlower(flower), bounds = new Box3().setFromObject(model);
    assert.equal(model.userData.flowerId, flower.id);
    assert.equal(bounds.isEmpty(), false, flower.id);
    assert.ok([...bounds.min.toArray(), ...bounds.max.toArray()].every(Number.isFinite), flower.id);
    assert.ok(bounds.max.y > bounds.min.y, flower.id);
    disposeScene(model);
  }
});
