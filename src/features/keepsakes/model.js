import { flowerById } from "../../data/flowers.js";
import {
  bouquetStyles,
  paperShapes,
  paperColors,
  paperMaterials,
  ribbonStyles,
  ribbonColors,
  decorations,
} from "../bouquet/options.js";
import { arrangeStems, constrainPosition } from "../bouquet/layout.js";

export const KEEPSAKE_VERSION = 2;
export const MAX_TYPES = 15,
  MAX_STEMS = 60,
  MAX_PER_TYPE = 12;
export const clone = (value) => JSON.parse(JSON.stringify(value));
export function createBouquetDraft() {
  return {
    version: KEEPSAKE_VERSION,
    nextId: 1,
    stems: [],
    style: "round",
    wrapping: { shape: "round", color: "#edc6d0", material: "matte" },
    ribbon: { style: "satin", color: "#b87f96" },
    decorations: Object.fromEntries(decorations.map(([id]) => [id, false])),
  };
}
export function bouquetTypes(draft) {
  return [...new Set(draft.stems.map((s) => s.flowerId))].map((id) => ({
    flower: flowerById.get(id),
    stems: draft.stems.filter((s) => s.flowerId === id),
  }));
}
function allowed(options, key) {
  return options.some(([id]) => id === key);
}
export function validateBouquet(draft) {
  if (
    !draft ||
    draft.version !== KEEPSAKE_VERSION ||
    !Array.isArray(draft.stems)
  )
    throw new Error("รูปแบบไฟล์ช่อไม่รองรับ");
  if (!Number.isSafeInteger(draft.nextId) || draft.nextId < 1)
    throw new Error("รหัสก้านดอกไม้ไม่ถูกต้อง");
  if (
    draft.stems.length > MAX_STEMS ||
    new Set(draft.stems.map((s) => s.flowerId)).size > MAX_TYPES
  )
    throw new Error("ช่อใหญ่เกินขีดจำกัด");
  const ids = new Set();
  for (const s of draft.stems) {
    const f = flowerById.get(s.flowerId);
    if (
      !f ||
      !/^stem-\d+$/.test(s.id) ||
      ids.has(s.id) ||
      Number(s.id.slice(5)) >= draft.nextId
    )
      throw new Error("รหัสหรือชนิดดอกไม้ไม่ถูกต้อง");
    ids.add(s.id);
    if (!f.colors.some((c) => c.value === s.color))
      throw new Error("สีดอกไม้ไม่ถูกต้อง");
    if (
      !Array.isArray(s.position) ||
      s.position.length !== 3 ||
      !s.position.every(Number.isFinite) ||
      s.position.some((v, i) => v !== constrainPosition(s.position)[i])
    )
      throw new Error("ตำแหน่งก้านดอกไม้ไม่ถูกต้อง");
    if (
      !Array.isArray(s.rotation) ||
      s.rotation.length !== 3 ||
      !s.rotation.every((v) => Number.isFinite(v) && Math.abs(v) <= Math.PI) ||
      s.scale !== 1
    )
      throw new Error("การหมุนหรือขนาดไม่ถูกต้อง");
  }
  for (const type of bouquetTypes(draft))
    if (type.stems.length > MAX_PER_TYPE)
      throw new Error("จำนวนก้านต่อชนิดเกินขีดจำกัด");
  if (
    !allowed(bouquetStyles, draft.style) ||
    !allowed(paperShapes, draft.wrapping?.shape) ||
    !allowed(paperColors, draft.wrapping?.color) ||
    !allowed(paperMaterials, draft.wrapping?.material) ||
    !allowed(ribbonStyles, draft.ribbon?.style) ||
    !allowed(ribbonColors, draft.ribbon?.color)
  )
    throw new Error("รูปแบบการตกแต่งไม่ถูกต้อง");
  if (
    !draft.decorations ||
    decorations.some(([id]) => typeof draft.decorations[id] !== "boolean")
  )
    throw new Error("ของตกแต่งไม่ถูกต้อง");
  return true;
}
export function applyBouquetAction(source, action) {
  const draft = clone(source),
    { type } = action;
  if (type === "add") {
    const flower = flowerById.get(action.flowerId);
    if (!flower) throw new Error("ไม่พบดอกไม้นี้");
    const existing = draft.stems.filter((s) => s.flowerId === flower.id);
    if (!existing.length && bouquetTypes(draft).length >= MAX_TYPES)
      throw new Error(
        "เลือกครบ 15 ชนิดแล้วค่ะ ยังเพิ่มก้านของชนิดเดิมได้ หรือลบชนิดหนึ่งก่อนนะคะ",
      );
    if (existing.length >= MAX_PER_TYPE)
      throw new Error("ชนิดนี้ครบ 12 ก้านแล้วค่ะ");
    if (draft.stems.length >= MAX_STEMS)
      throw new Error("ช่อนี้ครบ 60 ก้านแล้วค่ะ ลดจำนวนก่อนเพิ่มนะคะ");
    draft.stems.push({
      id: `stem-${draft.nextId++}`,
      flowerId: flower.id,
      color: existing[0]?.color || flower.colors[0].value,
      position: [0, 2.65, 0],
      rotation: [0, 0, 0],
      scale: 1,
      manual: false,
    });
    draft.stems = arrangeStems(draft.stems, draft.style, true);
  } else if (type === "decrease") {
    const index = draft.stems.findLastIndex(
      (s) => s.flowerId === action.flowerId,
    );
    if (index >= 0) draft.stems.splice(index, 1);
    draft.stems = arrangeStems(draft.stems, draft.style, true);
  } else if (type === "remove") {
    draft.stems = draft.stems.filter((s) => s.flowerId !== action.flowerId);
    draft.stems = arrangeStems(draft.stems, draft.style, true);
  } else if (type === "color") {
    const flower = flowerById.get(action.flowerId);
    if (!flower?.colors.some((c) => c.value === action.color))
      throw new Error("ชนิดนี้ไม่มีสีที่เลือก");
    draft.stems.forEach((s) => {
      if (s.flowerId === action.flowerId) s.color = action.color;
    });
  } else if (type === "move") {
    const stem = draft.stems.find((s) => s.id === action.id);
    if (!stem) throw new Error("เลือกก้านดอกไม้ก่อนนะคะ");
    if (
      !Array.isArray(action.position) ||
      action.position.length !== 3 ||
      !action.position.every(Number.isFinite)
    )
      throw new Error("ตำแหน่งต้องเป็นตัวเลข");
    stem.position = constrainPosition(action.position);
    stem.manual = true;
  } else if (type === "style") {
    draft.style = action.value;
    draft.stems = arrangeStems(draft.stems, draft.style);
  } else if (type === "arrange")
    draft.stems = arrangeStems(draft.stems, draft.style);
  else if (type === "wrapping" || type === "ribbon")
    draft[type][action.key] = action.value;
  else if (type === "decoration") draft.decorations[action.key] = action.value;
  else if (type === "reset") {
    const defaults = createBouquetDraft();
    draft.style = defaults.style;
    draft.wrapping = defaults.wrapping;
    draft.ribbon = defaults.ribbon;
    draft.decorations = defaults.decorations;
    draft.stems = arrangeStems(draft.stems, draft.style);
  } else throw new Error("ไม่รู้จักคำสั่งนี้");
  validateBouquet(draft);
  return draft;
}
export function createMagicPayload(draft) {
  validateBouquet(draft);
  if (!draft.stems.length)
    throw new Error("เลือกดอกไม้อย่างน้อย 1 ชนิดก่อนนะคะ");
  return {
    event: "bloomie:bouquet-ready",
    version: KEEPSAKE_VERSION,
    completedAt: new Date().toISOString(),
    bouquet: clone(draft),
  };
}
// Retained future card contract; no unfinished card/video interface in V2.
export function createCardDraft() {
  return {
    version: KEEPSAKE_VERSION,
    recipient: "",
    message: "",
    sender: "",
    palette: "blush",
  };
}
export const exportCapabilities = Object.freeze({
  png: { planned: true, browserAPI: "HTMLCanvasElement.toBlob" },
  video: {
    planned: true,
    browserAPI: "HTMLCanvasElement.captureStream + MediaRecorder",
    requiresFeatureDetection: true,
  },
});
