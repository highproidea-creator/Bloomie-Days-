import test from "node:test";
import assert from "node:assert/strict";
import { flowers, flowerById } from "../src/data/flowers.js";
import {
  createBouquetDraft,
  applyBouquetAction as apply,
  validateBouquet,
  createMagicPayload,
  bouquetTypes,
  clone,
} from "../src/features/keepsakes/model.js";
import { createBouquetStore } from "../src/features/bouquet/store.js";
import {
  createBouquetStorage,
  DRAFT_KEY,
  BACKUP_KEY,
  FINISHED_KEY,
} from "../src/features/bouquet/storage.js";
import { bouquetStyles, paperShapes } from "../src/features/bouquet/options.js";
import {
  paperGeometry,
  createWrapping,
  disposeWrapping,
} from "../src/features/bouquet/wrapping.js";
const add = (draft, id = flowers[0].id) =>
  apply(draft, { type: "add", flowerId: id });
const memory = () => {
  const values = new Map();
  return {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, v),
  };
};

test("15 means types; a sixteenth is blocked while existing types can grow", () => {
  let d = createBouquetDraft();
  for (const f of flowers.slice(0, 15)) d = add(d, f.id);
  assert.equal(bouquetTypes(d).length, 15);
  assert.throws(() => add(d, flowers[15].id), /15/);
  d = add(d);
  assert.equal(d.stems.length, 16);
  assert.equal(bouquetTypes(d).length, 15);
  d = apply(d, { type: "remove", flowerId: flowers[1].id });
  d = add(d, flowers[15].id);
  assert.equal(bouquetTypes(d).length, 15);
});
test("performance caps enforce 12 stems per type and 60 total without mutating rejected drafts", () => {
  let d = createBouquetDraft();
  for (const f of flowers.slice(0, 5))
    for (let i = 0; i < 12; i++) d = add(d, f.id);
  assert.equal(d.stems.length, 60);
  const before = JSON.stringify(d);
  assert.throws(() => add(d), /12/);
  assert.throws(() => add(d, flowers[5].id), /60/);
  assert.equal(JSON.stringify(d), before);
  d = apply(d, { type: "decrease", flowerId: flowers[0].id });
  assert.equal(d.stems.length, 59);
  assert.equal(add(d, flowers[5].id).stems.length, 60);
});
test("manual 3D placement and chosen colors survive count changes; all styles keep every stem", () => {
  let d = add(add(createBouquetDraft(), "rose"), "tulip");
  const id = d.stems[0].id;
  d = apply(d, { type: "move", id, position: [1.2, 3.4, -0.7] });
  d = apply(d, {
    type: "color",
    flowerId: "rose",
    color: flowerById.get("rose").colors[1].value,
  });
  d = add(d, "rose");
  assert.deepEqual(d.stems[0].position, [1.2, 3.4, -0.7]);
  assert.equal(d.stems[2].color, d.stems[0].color);
  const ids = d.stems.map((s) => s.id),
    arrangements = [];
  for (const [value] of bouquetStyles) {
    const arranged = apply(d, { type: "style", value });
    assert.deepEqual(
      arranged.stems.map((s) => s.id),
      ids,
    );
    assert.ok(validateBouquet(arranged));
    arrangements.push(JSON.stringify(arranged.stems.map((s) => s.position)));
  }
  assert.equal(new Set(arrangements).size, 6);
  const bounded = apply(d, { type: "move", id, position: [999, -99, -999] });
  assert.deepEqual(bounded.stems[0].position, [2.4, 1.6, -1.1]);
  assert.throws(
    () => apply(d, { type: "move", id, position: [NaN, 2, 0] }),
    /ตัวเลข/,
  );
});
test("a drag is one undo step; cancellation, redo and branching restore complete designs", () => {
  const events = [],
    store = createBouquetStore(createBouquetDraft(), (draft, meta) =>
      events.push(meta.persist),
    );
  store.dispatch({ type: "add", flowerId: "rose" });
  const original = store.draft;
  store.beginGesture();
  for (let i = 0; i < 10; i++) store.move("stem-1", [i / 10, 3, 0.2]);
  store.endGesture();
  const moved = store.draft;
  assert.equal(events.filter(Boolean).length, 2);
  store.undo();
  assert.deepEqual(store.draft, original);
  store.redo();
  assert.deepEqual(store.draft, moved);
  store.beginGesture();
  store.move("stem-1", [-2, 4, -1]);
  store.cancelGesture();
  assert.deepEqual(store.draft, moved);
  store.undo();
  store.dispatch({ type: "ribbon", key: "style", value: "double" });
  assert.equal(store.canRedo, false);
  const external = store.draft;
  external.stems.length = 0;
  assert.equal(store.draft.stems.length, 1);
});
test("reset restores arrangement and decorations while preserving flowers, counts and colors", () => {
  let d = add(add(createBouquetDraft(), "rose"), "iris");
  d = apply(d, { type: "style", value: "garden" });
  d = apply(d, { type: "decoration", key: "heart", value: true });
  d = apply(d, { type: "wrapping", key: "shape", value: "fan" });
  const reset = apply(d, { type: "reset" });
  assert.equal(reset.stems.length, 2);
  assert.deepEqual(
    reset.stems.map((s) => s.color),
    d.stems.map((s) => s.color),
  );
  assert.equal(reset.style, "round");
  assert.equal(reset.decorations.heart, false);
  assert.equal(reset.wrapping.shape, "round");
});
test("save, reload, archive and completion preserve the entire editable document", () => {
  const disk = memory(),
    storage = createBouquetStorage(disk);
  let d = add(createBouquetDraft(), "snowdrop");
  for (const action of [
    { type: "move", id: "stem-1", position: [0.5, 3, -0.2] },
    { type: "style", value: "minimal" },
    { type: "wrapping", key: "material", value: "sheer" },
    { type: "ribbon", key: "style", value: "long-tail" },
    { type: "decoration", key: "pearls", value: true },
  ])
    d = apply(d, action);
  assert.equal(storage.save(d), true);
  assert.deepEqual(createBouquetStorage(disk).load().draft, d);
  assert.equal(storage.archive(d), true);
  assert.deepEqual(JSON.parse(disk.getItem(BACKUP_KEY)), d);
  const payload = createMagicPayload(d);
  assert.equal(storage.finish(payload), true);
  assert.deepEqual(JSON.parse(disk.getItem(FINISHED_KEY)), payload);
  assert.deepEqual(payload.bouquet, d);
  payload.bouquet.stems.length = 0;
  assert.equal(d.stems.length, 1);
  assert.throws(() => createMagicPayload(createBouquetDraft()), /อย่างน้อย/);
});
test("corrupt saves are backed up; blocked storage never claims a successful save", () => {
  const disk = memory();
  disk.setItem(DRAFT_KEY, "broken file");
  const storage = createBouquetStorage(disk);
  assert.ok(storage.load().error);
  assert.equal(disk.getItem(DRAFT_KEY), "broken file");
  storage.save(createBouquetDraft());
  assert.equal(disk.getItem(BACKUP_KEY), "broken file");
  const blocked = createBouquetStorage({
    getItem() {
      throw new Error();
    },
    setItem() {
      throw new Error();
    },
  });
  assert.ok(blocked.load().error);
  assert.equal(blocked.save(createBouquetDraft()), false);
  assert.equal(blocked.archive(createBouquetDraft()), false);
  assert.equal(
    blocked.finish(createMagicPayload(add(createBouquetDraft()))),
    false,
  );
});
test("invalid saved positions, IDs, options and colors are rejected before rendering", () => {
  const d = add(createBouquetDraft());
  for (const mutate of [
    (v) => (v.stems[0].position = [Infinity, 2, 0]),
    (v) => (v.nextId = 1),
    (v) => (v.stems[0].color = "#000000"),
    (v) => (v.wrapping.shape = "invalid"),
    (v) => (v.decorations.heart = "yes"),
    (v) => v.stems.push(clone(v.stems[0])),
  ]) {
    const bad = clone(d);
    mutate(bad);
    assert.throws(() => validateBouquet(bad));
  }
});
test("six paper surfaces have finite vertices, normals and UVs with distinct silhouettes", () => {
  const forms = new Set();
  for (const [id] of paperShapes) {
    const g = paperGeometry(id, 0.9);
    assert.ok(g.getAttribute("normal"));
    assert.ok(g.getAttribute("uv"));
    assert.ok([...g.getAttribute("position").array].every(Number.isFinite));
    const d = createBouquetDraft();
    d.wrapping.shape = id;
    const model = createWrapping(d),
      vertices = [];
    model.traverse((o) => {
      if (o.isMesh) vertices.push(...o.geometry.getAttribute("position").array);
    });
    forms.add(JSON.stringify(vertices));
    disposeWrapping(model);
    g.dispose();
  }
  assert.equal(forms.size, 6);
});
test("the three required white bell, drooping and iris flowers have dedicated forms", () => {
  assert.equal(flowerById.get("lily-of-the-valley").form, "valley");
  assert.equal(flowerById.get("snowdrop").form, "snowdrop");
  assert.equal(flowerById.get("iris").form, "iris");
});
