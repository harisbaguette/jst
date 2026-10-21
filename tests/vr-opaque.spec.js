import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

test('단발 흰 상의 모델의 원본·동작·3면·얼굴·모바일을 확인한다', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await mkdir('output/vr-opaque-3d', { recursive: true });
  await page.goto('/');
  await expect(page.locator('#status')).toHaveText('동작 재생 가능', { timeout: 90_000 });
  await expect(page.locator('#model-select')).toHaveValue('vr-opaque');
  await expect(page.locator('#source-image')).toHaveAttribute('src', /13-outfit-front/);
  await expect(page.locator('#download-model')).toHaveAttribute('href', '/characters/vr-woman-opaque.vsplat');
  expect(await page.evaluate(() => window.jst.character.splat.numSplats)).toBe(48000);

  for (const name of ['idle', 'walk', 'run']) {
    await page.locator(`[data-motion="${name}"]`).click();
    expect(await page.evaluate(() => window.jst.character.currentAnimationName)).toBe(name);
    const before = await page.evaluate(() => window.jst.character.animationTime);
    await expect.poll(() => page.evaluate(() => window.jst.character.animationTime)).not.toBe(before);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `output/vr-opaque-3d/motion-${name}.png` });
  }
  await page.locator('#rest').click();
  for (const [name, yaw] of [['front', 0], ['side', 90], ['back', 180]]) {
    await page.evaluate(value => { window.jst.controls.yaw = value; }, yaw);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `output/vr-opaque-3d/model-${name}.png` });
  }
  await page.locator('#face-view').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'output/vr-opaque-3d/face-comparison.png' });
  for (const id of ['illustration', 'vr-opaque']) {
    await page.locator('#model-select').selectOption(id);
    await expect(page.locator('#model-select')).toBeEnabled({ timeout: 45_000 });
    await expect(page.locator('#status')).toHaveText('동작 재생 가능');
    expect(await page.evaluate(() => window.jst.modelId)).toBe(id);
    await expect(page.locator('#source-image')).toHaveAttribute('src', id === 'vr-opaque' ? /13-outfit-front/ : /seoah-illustration-front/);
  }
  await page.locator('#body-view').click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.locator('[data-motion="walk"]').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'output/vr-opaque-3d/mobile.png', fullPage: true });
  expect(errors).toEqual([]);
  await writeFile('output/vr-opaque-3d/viewer-verification.json', JSON.stringify({
    modelId: 'vr-opaque', splats: 48000, motions: ['idle', 'walk', 'run'],
    restViews: ['front', 'side', 'back'], faceComparison: true, modelSwitch: true,
    mobileWidth: 390, horizontalOverflow: false, pageErrors: errors, result: 'pass',
  }, null, 2) + '\n');
});
