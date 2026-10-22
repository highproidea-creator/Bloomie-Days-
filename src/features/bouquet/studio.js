import "./studio.css";
import {
  createBouquetDraft,
  bouquetTypes,
  MAX_TYPES,
  MAX_STEMS,
  MAX_PER_TYPE,
  createMagicPayload,
} from "../keepsakes/model.js";
import { flowerById } from "../../data/flowers.js";
import { createBouquetStore } from "./store.js";
import { createBouquetStorage } from "./storage.js";
import { createBouquetScene } from "./scene.js";
import {
  bouquetStyles,
  paperShapes,
  paperMaterials,
  paperColors,
  ribbonStyles,
  ribbonColors,
  decorations,
} from "./options.js";

const $ = (s) => document.querySelector(s);
export function createStudio({ onCatalogChange = () => {} } = {}) {
  const root = $("#bouquet-studio");
  root.innerHTML = `
    <header class="studio-top"><div><div class="eyebrow">MADE BY YOU, WITH LOVE</div><div class="studio-heading-row"><button class="studio-back" id="studio-back">กลับร้าน</button><h1>Bouquet <em>design studio</em></h1></div><p id="studio-counts"></p></div><div class="studio-actions"><button id="bouquet-undo" aria-label="Undo ย้อนกลับ">Undo</button><button id="bouquet-redo" aria-label="Redo ทำซ้ำ">Redo</button><button id="bouquet-reset" title="คืนทรงและการตกแต่งเริ่มต้น ดอกไม้ยังอยู่">คืนค่า</button><button id="bouquet-new">เริ่มช่อใหม่</button><button id="bouquet-finish" class="primary-button">จัดช่อเสร็จแล้ว ♡</button></div></header>
    <div id="studio-status" class="studio-status" role="status" aria-live="polite"></div>
    <div class="studio-workspace"><aside id="studio-library" class="studio-library"></aside><section class="bouquet-stage" aria-label="พื้นที่จัดช่อสามมิติ"><div id="bouquet-canvas"></div><div id="bouquet-empty" class="bouquet-empty"><span>✿</span><h2>เริ่มด้วยดอกไม้ที่คุณชอบ</h2><p>เลือก “+ เพิ่ม” จากคลังดอกไม้<br>ช่อเล็ก ๆ สำหรับคนพิเศษ เริ่มได้จากดอกเดียว</p></div><div class="stage-toolbar"><button id="rotate-left" aria-label="หมุนช่อไปซ้าย">หมุนซ้าย</button><button id="fit-bouquet">พอดีจอ</button><button id="rotate-right" aria-label="หมุนช่อไปขวา">หมุนขวา</button></div><p class="stage-hint">แตะดอกไม้แล้วลากจัดตำแหน่ง · ลากพื้นที่ว่างเพื่อหมุนชม</p></section>
    <aside class="studio-controls"><div class="control-tabs"><button data-control="selection" aria-pressed="true">ดอกไม้ในช่อ</button><button data-control="design" aria-pressed="false">ทรงและตกแต่ง</button></div>
    <section id="studio-selection"><div class="selection-intro"><h2>ค่อย ๆ จัดให้เป็นคุณ</h2><p>สูงสุด 15 ชนิด · ชนิดละ 12 ก้าน · รวม 60 ก้าน</p><p id="selection-limit" hidden>ครบ 15 ชนิดแล้วค่ะ ยังเพิ่มก้านของชนิดเดิมได้ หรือลบชนิดหนึ่งก่อนเลือกใหม่</p></div>
      <fieldset id="stem-position"><legend>จัดก้านที่เลือก</legend><label>เลือกก้าน<select id="active-stem" aria-label="ก้านดอกไม้ที่กำลังจัด"></select></label><div class="position-fields"><label>ซ้าย / ขวา X<input id="stem-x" type="number" min="-2.4" max="2.4" step="0.1"></label><label>ความสูง Y<input id="stem-y" type="number" min="1.6" max="4.2" step="0.1"></label><label>หน้า / หลัง Z<input id="stem-z" type="number" min="-1.1" max="1.1" step="0.1"></label></div><div class="nudge-buttons"><button data-axis="0" data-delta="-.12" aria-label="ย้ายก้านไปซ้าย">ซ้าย</button><button data-axis="0" data-delta=".12" aria-label="ย้ายก้านไปขวา">ขวา</button><button data-axis="1" data-delta=".12" aria-label="เพิ่มความสูงก้าน">สูงขึ้น</button><button data-axis="1" data-delta="-.12" aria-label="ลดความสูงก้าน">ต่ำลง</button><button data-axis="2" data-delta=".12" aria-label="นำก้านมาด้านหน้า">ด้านหน้า</button><button data-axis="2" data-delta="-.12" aria-label="นำก้านไปด้านหลัง">ด้านหลัง</button><button id="mirror-stem">สะท้อนซ้าย–ขวา</button><button id="arrange-bouquet">จัดสมดุลใหม่</button></div></fieldset>
      <div id="selected-flowers" aria-label="ชนิดดอกไม้ที่เลือก"></div><p id="selected-empty">ยังไม่มีดอกไม้ ลองเลือกดอกแรกจากคลังนะคะ</p></section>
    <section id="studio-design" hidden><label class="option-label">รูปแบบช่อ<select id="bouquet-style"></select></label><fieldset><legend>กระดาษห่อ</legend><label class="option-label">รูปทรง<select id="paper-shape"></select></label><label class="option-label">วัสดุ<select id="paper-material"></select></label><div id="paper-colors" class="color-swatches" aria-label="สีกระดาษ"></div></fieldset><fieldset><legend>ริบบิ้น</legend><label class="option-label">รูปแบบ<select id="ribbon-style"></select></label><div id="ribbon-colors" class="color-swatches" aria-label="สีริบบิ้น"></div></fieldset><fieldset id="decorations"><legend>ของตกแต่งเล็ก ๆ</legend></fieldset></section></aside></div>
    <nav class="studio-mobile-tabs" aria-label="เครื่องมือสตูดิโอ"><button data-panel="flowers" aria-pressed="true">คลังดอกไม้</button><button data-panel="selection" aria-pressed="false">ดอกไม้ที่เลือก</button><button data-panel="design" aria-pressed="false">ตกแต่งช่อ</button></nav>
    <section id="finished-bouquet" class="finished-bouquet" hidden><div class="eyebrow">A LITTLE BOUQUET, A LOT OF LOVE</div><h2 tabindex="-1">ช่อดอกไม้สำหรับคนพิเศษของคุณ ♡</h2><p id="finished-summary"></p><p>บันทึกช่อสมบูรณ์ไว้ในเครื่องแล้ว</p><button id="edit-bouquet" class="primary-button">กลับไปแก้ช่อ</button></section>`;
  $("#studio-library").append($("#flower-browser"));
  $("#studio-back").addEventListener("click", () => $("#back-button").click());
  root.dataset.panel = "flowers";
  root.dataset.mode = "editing";
  const dialog = document.createElement("dialog");
  dialog.id = "new-bouquet-dialog";
  dialog.className = "help-dialog";
  dialog.setAttribute("aria-labelledby", "new-bouquet-title");
  dialog.innerHTML =
    '<h2 id="new-bouquet-title">เริ่มช่อใหม่ไหมคะ?</h2><p>ช่อปัจจุบันจะถูกเก็บเป็นช่อก่อนหน้าในเครื่องก่อนเริ่มใหม่ ช่อที่เสร็จแล้วจะยังอยู่ และใช้ Undo กลับมาได้ในหน้านี้</p><div class="confirm-actions"><button id="restore-previous-bouquet">สลับกับช่อก่อนหน้า</button><button id="cancel-new-bouquet">แก้ช่อนี้ต่อ</button><button id="confirm-new-bouquet" class="primary-button">เก็บช่อเดิมแล้วเริ่มใหม่</button></div>';
  document.body.append(dialog);
  let nativeStorage;
  try {
    nativeStorage = window.localStorage;
  } catch {
    nativeStorage = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    };
  }
  const persistence = createBouquetStorage(nativeStorage),
    loaded = persistence.load();
  let scene = null,
    activeId = loaded.draft.stems[0]?.id || null,
    reduced = false;
  const store = createBouquetStore(loaded.draft, (draft, meta) => {
    if (meta.persist) {
      const saved = persistence.save(draft);
      const message =
        draft.stems.length >= MAX_STEMS
          ? "ครบ 60 ก้านแล้วค่ะ ลดจำนวนก่อนเพิ่มนะคะ"
          : bouquetTypes(draft).length >= MAX_TYPES
            ? "ครบ 15 ชนิดแล้วค่ะ ยังเพิ่มก้านของชนิดเดิมได้ หรือลบชนิดหนึ่งก่อนนะคะ"
            : "บันทึกในเครื่องแล้ว ♡";
      status(
        saved
          ? message
          : "ยังบันทึกไม่ได้ค่ะ พื้นที่จัดเก็บอาจเต็มหรือถูกปิดไว้ โปรดเปิดหน้านี้ค้างไว้ก่อน",
        !saved,
      );
    }
    sync(draft, meta);
    onCatalogChange();
  });
  function status(text, error = false) {
    $("#studio-status").textContent = text;
    $("#studio-status").dataset.error = String(error);
  }
  function addReason(id) {
    const draft = store.draft,
      count = draft.stems.filter((s) => s.flowerId === id).length;
    if (count >= MAX_PER_TYPE) return "ชนิดนี้ครบ 12 ก้านแล้วค่ะ";
    if (draft.stems.length >= MAX_STEMS)
      return "ครบ 60 ก้านแล้วค่ะ ลดจำนวนก่อนเพิ่มนะคะ";
    if (!count && bouquetTypes(draft).length >= MAX_TYPES)
      return "ครบ 15 ชนิดแล้วค่ะ ยังเพิ่มก้านของชนิดเดิมได้";
    return "";
  }
  function act(action) {
    const previous = activeId;
    if (action.type === "add") activeId = `stem-${store.draft.nextId}`;
    try {
      store.dispatch(action);
    } catch (error) {
      activeId = previous;
      status(error.message, true);
    }
  }
  function choose(id) {
    activeId = id;
    syncPosition(store.draft);
    scene?.select(id);
  }
  function syncPosition(draft) {
    const stem = draft.stems.find((s) => s.id === activeId);
    $("#stem-position").disabled = !stem;
    $("#active-stem").replaceChildren(
      ...draft.stems.map(
        (s, i) =>
          new Option(
            `${i + 1}. ${flowerById.get(s.flowerId).name}`,
            s.id,
            false,
            s.id === activeId,
          ),
      ),
    );
    for (const [i, axis] of ["x", "y", "z"].entries())
      $("#stem-" + axis).value = stem ? stem.position[i] : "";
  }
  function sync(draft, meta = {}) {
    if (!draft.stems.some((s) => s.id === activeId))
      activeId = draft.stems[0]?.id || null;
    const types = bouquetTypes(draft);
    $("#studio-counts").textContent =
      `${types.length} / 15 ชนิด · ${draft.stems.length} / 60 ก้าน`;
    $("#bouquet-empty").hidden = draft.stems.length > 0;
    $("#selected-empty").hidden = draft.stems.length > 0;
    $("#bouquet-finish").disabled = !draft.stems.length;
    $("#bouquet-finish").title = draft.stems.length
      ? "ชมช่อที่จัดเสร็จ"
      : "เลือกดอกไม้อย่างน้อย 1 ชนิดก่อนนะคะ";
    $("#bouquet-undo").disabled = !store.canUndo;
    $("#bouquet-redo").disabled = !store.canRedo;
    $("#selection-limit").hidden = types.length < 15;
    syncPosition(draft);
    scene?.setDocument(draft, { preview: meta.persist === false });
    scene?.select(activeId);
    if (meta.persist === false) return;
    $("#selected-flowers").replaceChildren();
    for (const { flower, stems } of types) {
      const row = document.createElement("article");
      row.className = "selected-flower";
      row.dataset.flowerId = flower.id;
      const label = document.createElement("button");
      label.className = "selected-name";
      label.textContent = flower.name;
      label.title = "เลือกก้านแรกของชนิดนี้";
      label.addEventListener("click", () => choose(stems[0].id));
      const controls = document.createElement("div");
      controls.className = "quantity-control";
      for (const [text, aria, action] of [
        [
          "−",
          `ลดจำนวน${flower.name}`,
          { type: "decrease", flowerId: flower.id },
        ],
        ["+", `เพิ่มจำนวน${flower.name}`, { type: "add", flowerId: flower.id }],
        ["ลบ", `ลบชนิด${flower.name}`, { type: "remove", flowerId: flower.id }],
      ]) {
        const b = document.createElement("button");
        b.textContent = text;
        b.setAttribute("aria-label", aria);
        if (text === "+") {
          b.disabled = !!addReason(flower.id);
          b.title = addReason(flower.id);
        }
        b.addEventListener("click", () => act(action));
        controls.append(b);
        if (text === "−") {
          const amount = document.createElement("span");
          amount.textContent = `${stems.length} ก้าน`;
          amount.className = "type-quantity";
          controls.append(amount);
        }
      }
      const swatches = document.createElement("div");
      swatches.className = "color-swatches flower-colors";
      for (const color of flower.colors) {
        const b = document.createElement("button");
        b.style.setProperty("--swatch", color.value);
        b.setAttribute("aria-label", `${flower.name} สี${color.label}`);
        b.title = color.label;
        b.setAttribute("aria-pressed", String(stems[0].color === color.value));
        b.addEventListener("click", () =>
          act({ type: "color", flowerId: flower.id, color: color.value }),
        );
        swatches.append(b);
      }
      row.append(label, controls, swatches);
      $("#selected-flowers").append(row);
    }
    $("#bouquet-style").value = draft.style;
    $("#paper-shape").value = draft.wrapping.shape;
    $("#paper-material").value = draft.wrapping.material;
    $("#ribbon-style").value = draft.ribbon.style;
    for (const b of $("#paper-colors").children)
      b.setAttribute(
        "aria-pressed",
        String(b.dataset.color === draft.wrapping.color),
      );
    for (const b of $("#ribbon-colors").children)
      b.setAttribute(
        "aria-pressed",
        String(b.dataset.color === draft.ribbon.color),
      );
    for (const [id] of decorations)
      $("#decorate-" + id).checked = draft.decorations[id];
  }
  function selectOptions(id, options, action) {
    const element = $(id);
    for (const [value, label, english] of options)
      element.add(new Option(english ? `${label} · ${english}` : label, value));
    element.addEventListener("change", () =>
      act({ ...action, value: element.value }),
    );
  }
  selectOptions("#bouquet-style", bouquetStyles, { type: "style" });
  selectOptions("#paper-shape", paperShapes, {
    type: "wrapping",
    key: "shape",
  });
  selectOptions("#paper-material", paperMaterials, {
    type: "wrapping",
    key: "material",
  });
  selectOptions("#ribbon-style", ribbonStyles, {
    type: "ribbon",
    key: "style",
  });
  function swatches(id, colors, type) {
    for (const [value, label] of colors) {
      const b = document.createElement("button");
      b.dataset.color = value;
      b.style.setProperty("--swatch", value);
      b.setAttribute(
        "aria-label",
        `${type === "wrapping" ? "กระดาษ" : "ริบบิ้น"}สี${label}`,
      );
      b.title = label;
      b.addEventListener("click", () => act({ type, key: "color", value }));
      $(id).append(b);
    }
  }
  swatches("#paper-colors", paperColors, "wrapping");
  swatches("#ribbon-colors", ribbonColors, "ribbon");
  for (const [id, label] of decorations) {
    const l = document.createElement("label");
    l.className = "decoration-toggle";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = "decorate-" + id;
    input.addEventListener("change", () =>
      act({ type: "decoration", key: id, value: input.checked }),
    );
    l.append(input, document.createTextNode(label));
    $("#decorations").append(l);
  }
  $("#active-stem").addEventListener("change", (e) => choose(e.target.value));
  function move(axis, delta) {
    const stem = store.draft.stems.find((s) => s.id === activeId);
    if (!stem) return;
    const position = stem.position.slice();
    position[axis] += delta;
    act({ type: "move", id: activeId, position });
  }
  for (const b of root.querySelectorAll("[data-axis]"))
    b.addEventListener("click", () =>
      move(Number(b.dataset.axis), Number(b.dataset.delta)),
    );
  for (const [i, axis] of ["x", "y", "z"].entries())
    $("#stem-" + axis).addEventListener("change", (e) => {
      const stem = store.draft.stems.find((s) => s.id === activeId);
      if (!stem) return;
      const position = stem.position.slice();
      position[i] = Number(e.target.value);
      act({ type: "move", id: activeId, position });
    });
  $("#mirror-stem").addEventListener("click", () => {
    const s = store.draft.stems.find((s) => s.id === activeId);
    if (s)
      act({
        type: "move",
        id: activeId,
        position: [-s.position[0], s.position[1], s.position[2]],
      });
  });
  $("#arrange-bouquet").addEventListener("click", () =>
    act({ type: "arrange" }),
  );
  $("#bouquet-undo").addEventListener("click", () => store.undo());
  $("#bouquet-redo").addEventListener("click", () => store.redo());
  $("#bouquet-reset").addEventListener("click", () => act({ type: "reset" }));
  $("#bouquet-new").addEventListener("click", () => {
    $("#restore-previous-bouquet").disabled = !persistence.previous();
    dialog.showModal();
  });
  $("#restore-previous-bouquet").addEventListener("click", () => {
    const previous = persistence.previous();
    if (!previous || !persistence.archive(store.draft)) {
      status("ยังเรียกช่อก่อนหน้าไม่ได้ค่ะ ช่อปัจจุบันยังอยู่", true);
      return;
    }
    store.replace(previous);
    root.dataset.mode = "editing";
    $("#finished-bouquet").hidden = true;
    scene?.setEditable(true);
    dialog.close();
    scene?.fit();
  });
  $("#cancel-new-bouquet").addEventListener("click", () => dialog.close());
  $("#confirm-new-bouquet").addEventListener("click", () => {
    if (!persistence.archive(store.draft)) {
      status("ยังเก็บช่อก่อนหน้าไม่ได้ค่ะ จึงยังไม่ลบช่อนี้ให้", true);
      dialog.close();
      return;
    }
    store.replace(createBouquetDraft());
    root.dataset.mode = "editing";
    $("#finished-bouquet").hidden = true;
    scene?.setEditable(true);
    dialog.close();
    scene?.fit();
  });
  $("#bouquet-finish").addEventListener("click", () => {
    try {
      const payload = createMagicPayload(store.draft);
      if (!persistence.finish(payload)) {
        status(
          "ยังบันทึกช่อสมบูรณ์ไม่ได้ โปรดตรวจพื้นที่จัดเก็บก่อนนะคะ",
          true,
        );
        return;
      }
      root.dataset.mode = "finished";
      $("#finished-bouquet").hidden = false;
      $("#finished-summary").textContent =
        `${bouquetTypes(payload.bouquet).length} ชนิด · ${payload.bouquet.stems.length} ก้าน ที่คุณจัดด้วยใจ`;
      scene?.setEditable(false);
      window.dispatchEvent(
        new CustomEvent("bloomie:bouquet-ready", { detail: payload }),
      );
      $("#finished-bouquet h2").focus({ preventScroll: true });
      requestAnimationFrame(() => scene?.fit());
    } catch (error) {
      status(error.message, true);
    }
  });
  $("#edit-bouquet").addEventListener("click", () => {
    root.dataset.mode = "editing";
    $("#finished-bouquet").hidden = true;
    scene?.setEditable(true);
    scene?.select(activeId);
    requestAnimationFrame(() => scene?.fit());
  });
  function controlTab(tab) {
    $("#studio-selection").hidden = tab !== "selection";
    $("#studio-design").hidden = tab !== "design";
    for (const b of root.querySelectorAll("[data-control]"))
      b.setAttribute("aria-pressed", String(b.dataset.control === tab));
  }
  for (const b of root.querySelectorAll("[data-control]"))
    b.addEventListener("click", () => controlTab(b.dataset.control));
  for (const b of root.querySelectorAll("[data-panel]"))
    b.addEventListener("click", () => {
      root.dataset.panel = b.dataset.panel;
      for (const other of root.querySelectorAll("[data-panel]"))
        other.setAttribute("aria-pressed", String(other === b));
      if (b.dataset.panel !== "flowers") controlTab(b.dataset.panel);
    });
  $("#rotate-left").addEventListener("click", () => scene?.rotate(-1));
  $("#rotate-right").addEventListener("click", () => scene?.rotate(1));
  $("#fit-bouquet").addEventListener("click", () => scene?.fit());
  return {
    get draft() {
      return store.draft;
    },
    addReason,
    add(id) {
      act({ type: "add", flowerId: id });
    },
    enter() {
      root.hidden = false;
      root.dataset.mode = "editing";
      $("#finished-bouquet").hidden = true;
      if (!scene) {
        scene = createBouquetScene($("#bouquet-canvas"), {
          onSelect: choose,
          onDragStart: () => store.beginGesture(),
          onMove: (id, p) => store.move(id, p),
          onDragEnd: () => store.endGesture(),
          onDragCancel: () => store.cancelGesture(),
          onError: (message) => status(message, true),
        });
        scene.setReducedMotion(reduced);
      }
      sync(store.draft);
      onCatalogChange();
      status(
        loaded.error ||
          (store.draft.stems.length
            ? "เปิดช่อที่บันทึกไว้แล้วค่ะ แก้ต่อได้เลย"
            : "เลือกดอกแรก แล้วค่อย ๆ จัดช่อในแบบของคุณ"),
        !!loaded.error,
      );
    },
    leave() {
      scene?.dispose();
      scene = null;
      root.hidden = true;
      if (dialog.open) dialog.close();
    },
    setReducedMotion(value) {
      reduced = value;
      scene?.setReducedMotion(value);
    },
    dispose() {
      scene?.dispose();
      dialog.remove();
    },
  };
}
