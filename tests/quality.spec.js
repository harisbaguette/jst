import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test('고해상도 화면의 실제 버퍼, 원형 비교와 모델 왕복 전환', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await mkdir('output/verification', { recursive: true });
  await page.goto('/?model=original');
  await expect(page.locator('#status')).toHaveText('동작 재생 가능');
  await page.locator('#face-view').click();
  await expect(page.locator('#rest')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.jst.character.currentAnimationName)).toBeNull();
  await expect(page.locator('#pause')).toBeDisabled();
  await expect.poll(() => page.locator('canvas').evaluate(c => c.width / c.clientWidth)).toBe(2);
  await expect.poll(() => page.locator('canvas').evaluate(c => c.height / c.clientHeight)).toBe(2);
  await page.screenshot({ path: 'output/verification/face-original.png', scale: 'css' });
  for (const id of ['face-reference', 'original', 'face-reference']) {
    await page.locator('#model-select').selectOption(id);
    await expect(page.locator('#model-select')).toBeEnabled({ timeout: 30_000 });
    await expect(page.locator('#status')).toHaveText('동작 재생 가능');
    await expect(page.locator('#rest')).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => window.jst.character.splat.numSplats)).toBe(48000);
    await expect(page.locator('#download-model')).toHaveAttribute('href', id === 'original' ? '/characters/seoah.vsplat' : '/characters/seoah-face-reference.vsplat');
  }
  await page.screenshot({ path: 'output/verification/face-experiment.png', scale: 'css' });
  for (const name of ['idle', 'walk', 'run']) {
    await page.locator(`[data-motion="${name}"]`).click();
    await expect(page.locator('#pause')).toBeEnabled();
    expect(await page.evaluate(() => window.jst.character.currentAnimationName)).toBe(name);
    const time = await page.evaluate(() => window.jst.character.animationTime);
    await expect.poll(() => page.evaluate(() => window.jst.character.animationTime)).not.toBe(time);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.locator('canvas').evaluate(c => c.width / c.clientWidth)).toBe(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  const bounds = await page.locator('.transport').boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  await page.locator('#rest').click();
  await page.screenshot({ path: 'output/verification/face-mobile.png', scale: 'css', fullPage: true });
  await page.locator('#body-view').click();
  await expect(page.locator('#body-view')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.jst.controls.distance)).toBe(3.8);
  expect(errors).toEqual([]);
  await page.close();
});

test('동작 한 개가 없어도 모델과 나머지 동작은 남는다', async ({ page }) => {
  await page.route('**/motions/walk.glb', route => route.fulfill({ status: 404, body: 'Missing' }));
  await page.goto('/?model=original');
  await expect(page.locator('#status')).toHaveText('동작 재생 가능', { timeout: 30_000 });
  await expect(page.locator('#motion-warning')).toContainText('걷기');
  await expect(page.locator('[data-motion="walk"]')).toHaveCount(0);
  await page.locator('[data-motion="run"]').click();
  expect(await page.evaluate(() => window.jst.character.currentAnimationName)).toBe('run');
  await page.locator('#face-view').click();
  await expect(page.locator('#rest')).toHaveAttribute('aria-pressed', 'true');
});

test('모델 로드 실패 후 다시 불러오기로 3D 복구', async ({ page }) => {
  await page.route('**/characters/seoah.vsplat', route => route.fulfill({ status: 404, body: 'Missing' }));
  await page.goto('/?model=original');
  await expect(page.locator('#status')).toHaveText('불러오기 실패', { timeout: 30_000 });
  expect(await page.evaluate(() => window.jst)).toBeUndefined();
  await expect(page.locator('#download-model')).toBeHidden();
  await page.unroute('**/characters/seoah.vsplat');
  await page.locator('#retry').click();
  await expect(page.locator('#status')).toHaveText('동작 재생 가능', { timeout: 30_000 });
  expect(await page.evaluate(() => window.jst.character.splat.numSplats)).toBe(48000);
});
