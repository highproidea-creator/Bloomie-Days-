import { test, expect } from "@playwright/test";
import { flowers } from "../../src/data/flowers.js";
import {
  createBouquetDraft,
  applyBouquetAction,
} from "../../src/features/keepsakes/model.js";
import {
  bouquetStyles,
  paperShapes,
  ribbonStyles,
} from "../../src/features/bouquet/options.js";
const welcome = "ยินดีต้อนรับ ร้านเปิดแล้วค่าา",
  greeting =
    "สวัสดีนะเมี้ยว~ ตามหาดอกไม้ให้คนพิเศษอยู่ใช่มั้ย? ตามมาเลยเมี้ยวว";
const key = "bloomie-days:bouquet:v2";
const mobile = (info) => info.project.name === "mobile";
async function ready(page) {
  await page.goto("./");
  await expect(page.locator("#open-button")).toBeEnabled();
  await expect(page.locator("#error")).toBeHidden();
}
async function enter(page) {
  await page.locator("#open-button").click();
  await expect(page.locator("#greeting")).toBeVisible();
  await page.locator("#continue-button").click();
  await expect(page.locator("body")).toHaveAttribute("data-view", "browsing");
  await expect(page.locator("#bouquet-canvas canvas")).toBeVisible();
}
async function panel(page, info, name) {
  if (mobile(info)) await page.locator(`[data-panel="${name}"]`).click();
  else if (name !== "flowers")
    await page.locator(`[data-control="${name}"]`).click();
}
async function read(page) {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
}
async function portraits(page) {
  await expect(page.locator("#flower-list")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await expect
    .poll(() =>
      page
        .locator(".flower-item img")
        .evaluateAll((imgs) =>
          imgs.every((i) => i.complete && i.naturalWidth > 0),
        ),
    )
    .toBe(true);
}
async function add(page, id) {
  await page
    .locator("#flower-search")
    .fill(flowers.find((f) => f.id === id).english);
  await page.locator(`.add-flower[data-flower-id="${id}"]`).click();
}
function seeded(count) {
  let d = createBouquetDraft();
  for (let i = 0; i < count; i++)
    d = applyBouquetAction(d, {
      type: "add",
      flowerId: flowers[i % flowers.length].id,
    });
  return d;
}
async function seed(page, d) {
  await page.addInitScript(
    ({ key, d }) => {
      if (!sessionStorage.getItem("seeded")) {
        localStorage.setItem(key, JSON.stringify(d));
        sessionStorage.setItem("seeded", "1");
      }
    },
    { key, d },
  );
}

test("storefront → exact Flora greeting → sideways camera → all 51 single-flower details", async ({
  page,
}, info) => {
  const errors = [],
    external = [],
    failed = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (
      !r.url().startsWith("data:") &&
      new URL(r.url()).origin !== "http://127.0.0.1:4173"
    )
      external.push(r.url());
  });
  page.on("response", (r) => {
    if (r.status() >= 400) failed.push(r.url());
  });
  await ready(page);
  await expect(page.locator("#open-button")).toHaveText(welcome);
  await expect(page.locator("#open-button svg")).toHaveCount(0);
  await expect(page.locator("#flower-browser")).toBeHidden();
  const button = await page.locator("#open-button").boundingBox(),
    vp = page.viewportSize();
  expect(Math.abs(button.x + button.width / 2 - vp.width / 2)).toBeLessThan(2);
  expect(Math.abs(button.y + button.height / 2 - vp.height / 2)).toBeLessThan(
    2,
  );
  await page.screenshot({ path: info.outputPath("welcome.png") });
  await page.evaluate(() => {
    window.stages = [];
    new MutationObserver(() =>
      window.stages.push({
        phase: document.body.dataset.view,
        hidden: document.querySelector("#flower-browser").hidden,
      }),
    ).observe(document.body, {
      attributes: true,
      attributeFilter: ["data-view"],
    });
  });
  await page.locator("#open-button").click();
  await expect(page.locator("body")).toHaveAttribute(
    "data-view",
    "introducing",
  );
  await expect(page.locator("#greeting-text")).toHaveText(greeting);
  await expect(page.locator("#greeting-name")).toContainText("ฟลอร่า");
  await expect(page.locator("#flower-browser")).toBeHidden();
  await expect(page.locator("#bouquet-studio")).toBeHidden();
  await page.screenshot({ path: info.outputPath("flora.png") });
  // Normal-motion introduction completes automatically, then the inviting gesture and camera finish before UI appears.
  await expect(page.locator("body")).toHaveAttribute("data-view", "browsing", {
    timeout: 30000,
  });
  await portraits(page);
  const stages = await page.evaluate(() => window.stages);
  expect(stages.map((s) => s.phase)).toEqual(
    expect.arrayContaining([
      "entering",
      "introducing",
      "moving-to-flowers",
      "browsing",
    ]),
  );
  expect(
    stages.filter((s) => s.phase !== "browsing").every((s) => s.hidden),
  ).toBe(true);
  await page.locator(".flower-item").first().click();
  await expect(page.locator("#detail-name")).toHaveText("ทิวลิป");
  await expect(page.locator("#detail-meaning")).not.toBeEmpty();
  await expect(page.locator("#detail-description")).not.toBeEmpty();
  await expect(page.locator("#flower-portrait img")).toBeVisible();
  await expect(page.locator("#studio-counts")).toContainText("0 / 15");
  await page.keyboard.press("Escape");
  const ids = [];
  while (true) {
    await portraits(page);
    ids.push(
      ...(await page
        .locator(".flower-item")
        .evaluateAll((items) => items.map((i) => i.dataset.flowerId))),
    );
    if (await page.locator("#next-page").isDisabled()) break;
    await page.locator("#next-page").click();
  }
  expect(ids).toHaveLength(51);
  expect(new Set(ids).size).toBe(51);
  for (const id of ["lily-of-the-valley", "snowdrop", "iris"]) {
    await page
      .locator("#flower-search")
      .fill(flowers.find((f) => f.id === id).english);
    await page.locator(".flower-item").click();
    await expect(page.locator("#flower-dialog")).toHaveAttribute(
      "data-flower-id",
      id,
    );
    await page.keyboard.press("Escape");
  }
  await page.locator("#studio-back").click();
  await expect(page.locator("body")).toHaveAttribute("data-view", "outside");
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
  expect(failed).toEqual([]);
});

test("drag with mouse/touch, edit counts and coordinates, undo/redo, reload and complete a real bouquet", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await ready(page);
  await enter(page);
  await expect(page.locator("#bouquet-finish")).toBeDisabled();
  await add(page, "rose");
  await expect(page.locator("#bouquet-canvas canvas")).toHaveAttribute(
    "data-stem-count",
    "1",
  );
  // Wait for actual rendered frames, then pick the interior of a visible flower.
  // Document counts update before the first requestAnimationFrame has positioned the meshes.
  await page.locator("#bouquet-canvas canvas").screenshot();
  const hit = await page
    .locator("#bouquet-canvas canvas")
    .evaluate((canvas) => {
      const r = canvas.getBoundingClientRect();
      let best = [];
      for (let y = r.top + 20; y < r.bottom - 20; y += 12) {
        const row = [];
        for (let x = r.left + 20; x < r.right - 20; x += 12) {
          canvas.dispatchEvent(
            new PointerEvent("pointermove", {
              clientX: x,
              clientY: y,
              pointerType: "mouse",
            }),
          );
          if (canvas.style.cursor === "grab") row.push({ x, y });
        }
        if (row.length > best.length) best = row;
      }
      return best[Math.floor(best.length / 2)] || null;
    });
  expect(hit).not.toBeNull();
  if (mobile(info)) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: hit.x, y: hit.y }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: hit.x + 30, y: hit.y - 15 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await cdp.detach();
  } else {
    await page.mouse.move(hit.x, hit.y);
    await page.mouse.down();
    await page.mouse.move(hit.x + 45, hit.y - 25, { steps: 5 });
    await page.mouse.up();
  }
  await expect.poll(async () => (await read(page)).stems[0].manual).toBe(true);
  const dragged = await read(page);
  await page.locator("#bouquet-undo").click();
  expect((await read(page)).stems[0].manual).toBe(false);
  await page.locator("#bouquet-redo").click();
  expect((await read(page)).stems[0].position).toEqual(
    dragged.stems[0].position,
  );
  await panel(page, info, "selection");
  await page.locator("#stem-x").fill("0.6");
  await page.locator("#stem-x").press("Tab");
  await page.locator("#stem-y").fill("3.1");
  await page.locator("#stem-y").press("Tab");
  await page.locator("#stem-z").fill("-0.4");
  await page.locator("#stem-z").press("Tab");
  await page
    .getByRole("button", { name: "เพิ่มจำนวนกุหลาบ", exact: true })
    .click();
  await expect(page.locator("#bouquet-canvas canvas")).toHaveAttribute(
    "data-stem-count",
    "2",
  );
  await page
    .getByRole("button", { name: "ลดจำนวนกุหลาบ", exact: true })
    .click();
  await expect(page.locator("#bouquet-canvas canvas")).toHaveAttribute(
    "data-stem-count",
    "1",
  );
  await page.locator(".flower-colors button").nth(1).click();
  await panel(page, info, "design");
  await page.locator("#bouquet-style").selectOption("garden");
  await panel(page, info, "selection");
  await page.locator("#stem-x").fill("0.6");
  await page.locator("#stem-x").press("Tab");
  await panel(page, info, "design");
  await page.locator("#paper-shape").selectOption("romantic");
  await page.locator("#paper-material").selectOption("patterned");
  await page.locator("#ribbon-style").selectOption("double");
  await page.locator("#paper-colors button").nth(4).click();
  await page.locator("#ribbon-colors button").nth(3).click();
  await page.locator("#decorate-heart").check();
  const saved = await read(page);
  await page.reload();
  await enter(page);
  expect(await read(page)).toEqual(saved);
  await page.evaluate(() =>
    window.addEventListener(
      "bloomie:bouquet-ready",
      (e) => (window.readyBouquet = e.detail),
    ),
  );
  await page.locator("#bouquet-finish").click();
  await expect(page.locator("#finished-bouquet")).toBeVisible();
  await expect(page.locator(".studio-library")).toBeHidden();
  const payload = await page.evaluate(() => window.readyBouquet);
  expect(payload.bouquet).toEqual(saved);
  expect(payload.event).toBe("bloomie:bouquet-ready");
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("bloomie-days:bouquet:finished")),
    ),
  ).toEqual(payload);
  await page.screenshot({ path: info.outputPath("finished.png") });
  await page.locator("#edit-bouquet").click();
  await page.locator("#bouquet-new").click();
  await page.locator("#cancel-new-bouquet").click();
  expect(await read(page)).toEqual(saved);
  await page.locator("#bouquet-new").click();
  await page.locator("#confirm-new-bouquet").click();
  await expect(page.locator("#bouquet-canvas canvas")).toHaveAttribute(
    "data-stem-count",
    "0",
  );
  await page.locator("#bouquet-undo").click();
  expect(await read(page)).toEqual(saved);
  await page.locator("#bouquet-new").click();
  await page.locator("#confirm-new-bouquet").click();
  await page.reload();
  await enter(page);
  await page.locator("#bouquet-new").click();
  await page.locator("#restore-previous-bouquet").click();
  expect(await read(page)).toEqual(saved);
  if (mobile(info)) {
    for (const viewport of [{ width: 393, height: 667 }, { width: 700, height: 393 }]) {
      await page.setViewportSize(viewport);
      await expect(page.locator("#studio-back")).toBeVisible();
      await expect.poll(async () => {
        const rect = await page.locator(".studio-mobile-tabs").boundingBox();
        return rect.y + rect.height;
      }).toBeLessThanOrEqual(viewport.height);
      const tabs = await page.locator(".studio-mobile-tabs").boundingBox();
      const stage = await page.locator(".bouquet-stage").boundingBox();
      expect(tabs.y + tabs.height).toBeLessThanOrEqual(viewport.height);
      expect(stage.height).toBeGreaterThan(150);
      expect(stage.y + stage.height).toBeLessThanOrEqual(tabs.y);
    }
  }
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("15-type limit, six layouts, six paper shapes, four materials and six bows change the rendered bouquet", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seed(page, seeded(14));
  const errors = [],
    consoleErrors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  await ready(page);
  await enter(page);
  await add(page, flowers[14].id);
  await expect(page.locator("#studio-counts")).toContainText("15 / 15");
  await page.locator("#flower-search").fill(flowers[15].english);
  await expect(page.locator(".add-flower")).toBeDisabled();
  await expect(page.locator("#studio-status")).toContainText("ครบ 15 ชนิด");
  await add(page, flowers[0].id);
  await expect(page.locator("#bouquet-canvas canvas")).toHaveAttribute(
    "data-stem-count",
    "16",
  );
  await panel(page, info, "design");
  const canvas = page.locator("#bouquet-canvas canvas");
  const images = [];
  for (const [id] of bouquetStyles) {
    await page.locator("#bouquet-style").selectOption(id);
    await expect.poll(async () => (await read(page)).style).toBe(id);
    images.push((await canvas.screenshot()).toString("base64"));
  }
  expect(new Set(images).size).toBe(6);
  const papers = [];
  for (const [id] of paperShapes) {
    await page.locator("#paper-shape").selectOption(id);
    await expect(canvas).toHaveAttribute("data-paper-shape", id);
    papers.push((await canvas.screenshot()).toString("base64"));
  }
  expect(new Set(papers).size).toBe(6);
  const materials = [];
  for (const id of ["matte", "sheer", "kraft", "patterned"]) {
    await page.locator("#paper-material").selectOption(id);
    materials.push((await canvas.screenshot()).toString("base64"));
  }
  expect(new Set(materials).size).toBe(4);
  const bows = [];
  for (const [id] of ribbonStyles) {
    await page.locator("#ribbon-style").selectOption(id);
    await expect(canvas).toHaveAttribute("data-ribbon-style", id);
    bows.push((await canvas.screenshot()).toString("base64"));
  }
  expect(new Set(bows).size).toBe(6);
  for (const id of ["pearls", "lace", "foliage", "mesh", "heart"])
    await page.locator("#decorate-" + id).check();
  await page.screenshot({ path: info.outputPath("studio-design.png") });
  const stage = await page.locator(".bouquet-stage").boundingBox(),
    library = await page
      .locator(mobile(info) ? ".studio-controls" : ".studio-library")
      .boundingBox();
  if (mobile(info)) {
    expect(library.y).toBeGreaterThanOrEqual(stage.y + stage.height);
    expect(stage.height).toBeGreaterThan(200);
  } else expect(library.x + library.width).toBeLessThanOrEqual(stage.x);
  await page.locator("#bouquet-reset").click();
  expect((await read(page)).stems).toHaveLength(16);
  expect((await read(page)).wrapping.shape).toBe("round");
  expect(errors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("keyboard search, reduced intro replay and portrait fallback keep the studio usable", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext,
      allowed = new Set();
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type.startsWith("webgl")) {
        if (!allowed.has(this) && allowed.size >= 2) return null;
        allowed.add(this);
      }
      return original.call(this, type, ...args);
    };
  });
  await ready(page);
  await page.locator("#open-button").click();
  await page.getByRole("button", { name: "วิธีเล่น", exact: true }).click();
  await expect(page.locator("#help-dialog")).toContainText("ฟลอร่า");
  await page.keyboard.press("Escape");
  await expect(page.locator("#flower-browser")).toBeHidden();
  await page.locator("#back-button").click();
  await expect(page.locator("body")).toHaveAttribute("data-view", "outside");
  await enter(page);
  await portraits(page);
  await expect(page.locator(".flower-item img").first()).toHaveAttribute(
    "src",
    /^data:image\/svg\+xml,/,
  );
  await page.locator("#flower-search").fill("ORCHID");
  await page.locator(".flower-item").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#detail-name")).toHaveText("กล้วยไม้");
  await page.keyboard.press("Escape");
  await expect(page.locator(".flower-item")).toBeFocused();
  await page.locator("#flower-search").fill("not-a-flower");
  await expect(page.locator("#catalog-empty")).toBeVisible();
  await page.locator("#flower-search").fill("");
  await expect(page.locator(".flower-item")).toHaveCount(10);
});

test("storage failures report honestly without losing the current design or completing it", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException("Full", "QuotaExceededError");
    };
  });
  await ready(page);
  await enter(page);
  await add(page, "rose");
  await expect(page.locator("#studio-status")).toContainText("ยังบันทึกไม่ได้");
  await page.locator("#bouquet-finish").click();
  await expect(page.locator("#finished-bouquet")).toBeHidden();
  await expect(page.locator("#studio-status")).toContainText(
    "ยังบันทึกช่อสมบูรณ์ไม่ได้",
  );
  await page.locator("#bouquet-new").click();
  await page.locator("#confirm-new-bouquet").click();
  await expect(page.locator("#bouquet-canvas canvas")).toHaveAttribute(
    "data-stem-count",
    "1",
  );
});

test("missing WebGL shows a helpful fallback", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.startsWith("webgl")
        ? null
        : original.call(this, type, ...args);
    };
  });
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "เปิดสวนสามมิติไม่ได้" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "ลองอีกครั้ง" })).toBeVisible();
});
