import { test, expect } from '@playwright/test';

test('shop opens, every flower can be explored, and the player returns outside', async ({ page }, testInfo) => {
  const errors = [], remote = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4173') && !request.url().startsWith('data:')) remote.push(request.url()); });
  await page.goto('./');
  const open = page.getByRole('button', { name: 'Welcome / Open' });
  await expect(open).toBeEnabled();
  await expect(page.locator('#scene canvas')).toBeVisible();
  await expect(page.locator('#error')).toBeHidden();
  await expect(page.locator('.flower-item')).toHaveCount(8);
  await page.screenshot({ path: testInfo.outputPath('storefront.png'), fullPage: true });
  const ids = ['tulip', 'daisy', 'rose', 'lavender', 'sunflower', 'hydrangea', 'cosmos', 'peony'];
  for (const id of ids) {
    const item = page.locator(`.flower-item[data-flower-id="${id}"]`);
    await item.scrollIntoViewIfNeeded(); await item.click();
    await expect(page.locator('#flower-dialog')).toBeVisible();
    await expect(page.locator('#flower-dialog')).toHaveAttribute('data-flower-id', id);
    await expect(page.locator('#detail-name')).not.toBeEmpty();
    await expect(page.locator('#detail-meaning')).not.toBeEmpty();
    await expect(page.locator('#flower-portrait img')).toBeVisible();
    await page.getByRole('button', { name: 'ปิดรายละเอียดดอกไม้' }).click();
  }
  await open.click();
  await expect(page.locator('body')).toHaveAttribute('data-view', 'inside');
  await expect(page.getByRole('status').filter({ hasText: 'ยินดีต้อนรับนะคะ' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('inside.png'), fullPage: true });
  if (testInfo.project.name === 'desktop') {
    // This point is the physical sunflower on the top shelf, outside the HTML panel.
    await page.locator('#scene canvas').click({ position: { x: 1037, y: 315 } });
    await expect(page.locator('#flower-dialog')).toBeVisible();
    await expect(page.locator('#flower-dialog')).toHaveAttribute('data-flower-id', 'sunflower');
    await page.getByRole('button', { name: 'ปิดรายละเอียดดอกไม้' }).click();
  }
  await page.getByRole('button', { name: 'กลับไปหน้าร้าน' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-view', 'outside');
  await expect(open).toBeEnabled();
  await page.getByRole('button', { name: 'ลดการเคลื่อนไหว', exact: true }).click();
  await open.click();
  await expect(page.locator('body')).toHaveAttribute('data-view', 'inside');
  expect(errors).toEqual([]);
  expect(remote).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('system reduced motion, keyboard dialog dismissal, and help work', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Welcome / Open' })).toBeEnabled();
  await expect(page.locator('#motion-button')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'วิธีเล่น', exact: true }).click();
  await expect(page.locator('#help-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#help-dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Welcome / Open' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-view', 'inside');
  await page.getByRole('button', { name: 'ปิดคำทักทาย' }).click();
  await expect(page.locator('#greeting')).toBeHidden();
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
