import { test, expect } from '@playwright/test';

const welcome = 'ยินดีต้อนรับ ร้านเปิดแล้วค่าา';

async function ready(page) {
  await page.goto('./');
  await expect(page.getByRole('button', { name: welcome, exact: true })).toBeEnabled();
  await expect(page.locator('#error')).toBeHidden();
}

async function waitForPortraits(page) {
  await expect(page.locator('#flower-list')).toHaveAttribute('aria-busy', 'false');
  await expect.poll(() => page.locator('.flower-item img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
}

test('welcome → Flora → sideways tour → 50-flower selection → detail → return', async ({ page }, testInfo) => {
  const errors = [], external = [], failed = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (!request.url().startsWith('data:') && new URL(request.url()).origin !== 'http://127.0.0.1:4173') external.push(request.url()); });
  page.on('response', response => { if (response.status() >= 400) failed.push(response.url()); });
  await ready(page);
  const open = page.getByRole('button', { name: welcome, exact: true });
  await expect(open).toHaveText(welcome);
  await expect(open.locator('svg')).toHaveCount(0);
  await expect(page.locator('#flower-browser')).toBeHidden();
  await expect(page.locator('.flower-item')).toHaveCount(0);
  await expect(page.locator('#scene-caption, .footer, .intro-note')).toHaveCount(0);
  const button = await open.boundingBox(), viewport = page.viewportSize();
  expect(Math.abs(button.x + button.width / 2 - viewport.width / 2)).toBeLessThan(2);
  expect(Math.abs(button.y + button.height / 2 - viewport.height / 2)).toBeLessThan(2);
  await page.screenshot({ path: testInfo.outputPath('welcome.png'), fullPage: true });
  await page.evaluate(() => {
    window.journeyStages = [];
    new MutationObserver(() => window.journeyStages.push({ phase: document.body.dataset.view, libraryHidden: document.querySelector('#flower-browser').hidden })).observe(document.body, { attributes: true, attributeFilter: ['data-view'] });
  });
  await open.click();
  await expect(page.locator('body')).toHaveAttribute('data-view', 'introducing');
  await expect(page.locator('#greeting')).toBeVisible();
  await expect(page.locator('#greeting-name')).toContainText('ฟลอร่า');
  await expect(page.locator('#greeting-text')).toContainText('ฉันชื่อฟลอร่า');
  await expect(page.locator('#flower-browser')).toBeHidden();
  await expect(page.locator('.flower-item')).toHaveCount(0);
  await page.locator('#scene canvas').click({ position: { x: testInfo.project.name === 'desktop' ? 1000 : 20, y: 300 } });
  await expect(page.locator('#flower-dialog')).not.toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('flora-introduction.png'), fullPage: true });
  await page.getByRole('button', { name: 'ไปชมดอกไม้กันค่ะ' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-view', 'browsing');
  await expect(page.locator('#greeting')).toBeHidden();
  await expect(page.locator('#flower-browser')).toBeVisible();
  await expect(page.locator('#flower-dialog')).not.toBeVisible();
  await waitForPortraits(page);
  await page.screenshot({ path: testInfo.outputPath('flower-selection.png'), fullPage: true });
  if (testInfo.project.name === 'desktop') {
    await page.locator('#scene canvas').click({ position: { x: 320, y: 300 } });
    await expect(page.locator('#flower-dialog')).toHaveAttribute('data-flower-id', 'hydrangea');
    await expect(page.locator('#flower-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
  }
  const stages = await page.evaluate(() => window.journeyStages);
  expect(stages.map(s => s.phase)).toEqual(expect.arrayContaining(['entering', 'introducing', 'moving-to-flowers', 'browsing']));
  expect(stages.filter(s => s.phase !== 'browsing').every(s => s.libraryHidden)).toBe(true);

  await page.locator('.flower-item').first().click();
  await expect(page.locator('#flower-dialog')).toBeVisible();
  await expect(page.locator('#detail-name')).toHaveText('ทิวลิป');
  await expect(page.locator('#detail-description')).not.toBeEmpty();
  await expect(page.locator('#detail-meaning')).not.toBeEmpty();
  await expect(page.locator('#flower-portrait img')).toBeVisible();
  await page.getByRole('button', { name: 'ปิดรายละเอียดดอกไม้' }).click();

  const ids = [];
  while (true) {
    await waitForPortraits(page);
    ids.push(...await page.locator('.flower-item').evaluateAll(items => items.map(item => item.dataset.flowerId)));
    if (await page.locator('#next-page').isDisabled()) break;
    await page.locator('#next-page').click();
  }
  expect(ids).toHaveLength(50);
  expect(new Set(ids).size).toBe(50);
  await page.locator('.flower-item').last().click();
  await expect(page.locator('#flower-dialog')).toHaveAttribute('data-flower-id', 'mock-orange');
  await expect(page.locator('#detail-name')).toHaveText('แก้ว');
  await page.keyboard.press('Escape');
  await expect(page.locator('#catalog-page')).toHaveText('5 / 5');
  await page.getByRole('button', { name: 'กลับไปหน้าร้าน' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-view', 'outside');
  await expect(page.locator('#flower-browser')).toBeHidden();
  await expect(open).toBeEnabled();
  expect(errors).toEqual([]); expect(external).toEqual([]); expect(failed).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('reduced motion preserves the introduction; search, keyboard details and replay work', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  await expect(page.locator('#motion-button')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: welcome, exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-view', 'introducing');
  await page.getByRole('button', { name: 'วิธีเล่น', exact: true }).click();
  await expect(page.locator('#help-dialog')).toContainText('ฟลอร่า');
  await page.keyboard.press('Escape');
  await expect(page.locator('#flower-browser')).toBeHidden();
  await expect(page.locator('body')).toHaveAttribute('data-view', 'introducing');
  await page.getByRole('button', { name: 'กลับไปหน้าร้าน' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-view', 'outside');
  await page.getByRole('button', { name: welcome, exact: true }).click();
  await expect(page.locator('#greeting')).toBeVisible();
  await page.getByRole('button', { name: 'ไปชมดอกไม้กันค่ะ' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-view', 'browsing');
  await page.getByRole('searchbox', { name: 'ค้นหาดอกไม้' }).fill('ORCHID');
  await expect(page.locator('.flower-item')).toHaveCount(1);
  const orchid = page.getByRole('button', { name: 'สำรวจกล้วยไม้ Orchid' });
  await orchid.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#detail-name')).toHaveText('กล้วยไม้');
  await page.keyboard.press('Escape');
  await expect(orchid).toBeFocused();
  await page.getByRole('searchbox', { name: 'ค้นหาดอกไม้' }).fill('not-a-flower');
  await expect(page.locator('#catalog-empty')).toBeVisible();
  await expect(page.locator('.flower-item')).toHaveCount(0);
  await expect(page.locator('#next-page')).toBeDisabled();
  await page.getByRole('searchbox', { name: 'ค้นหาดอกไม้' }).fill('');
  await expect(page.locator('.flower-item')).toHaveCount(10);
  await page.setViewportSize({ width: 700, height: 600 });
  await expect(page.locator('body')).toHaveAttribute('data-view', 'browsing');
  await expect(page.locator('#flower-browser')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('missing WebGL shows a helpful fallback', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (type.startsWith('webgl')) return null;
      return getContext.call(this, type, ...args);
    };
  });
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'เปิดสวนสามมิติไม่ได้' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'ลองอีกครั้ง' })).toBeVisible();
});

test('portrait fallback keeps selection and details usable with one WebGL context', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    let sceneCanvas = null;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (type.startsWith('webgl')) {
        if (sceneCanvas && sceneCanvas !== this) return null;
        sceneCanvas = this;
      }
      return getContext.call(this, type, ...args);
    };
  });
  await ready(page);
  await page.getByRole('button', { name: welcome, exact: true }).click();
  await page.getByRole('button', { name: 'ไปชมดอกไม้กันค่ะ' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-view', 'browsing');
  await waitForPortraits(page);
  await expect(page.locator('.flower-item img').first()).toHaveAttribute('src', /^data:image\/svg\+xml,/);
  await page.locator('.flower-item').first().click();
  await expect(page.locator('#detail-name')).toHaveText('ทิวลิป');
  await expect(page.locator('#flower-portrait img')).toHaveAttribute('src', /^data:image\/svg\+xml,/);
});
