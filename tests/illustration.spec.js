import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test('일러스트 3D와 원본이 함께 바뀌고 회전·전신 동작이 재생된다', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await mkdir('output/illustration', { recursive: true });
  await page.goto('/');
  await expect(page.locator('#status')).toHaveText('동작 재생 가능', { timeout: 90_000 });
  await expect(page.locator('#model-select')).toHaveValue('illustration');
  await expect(page.locator('#model-select option:checked')).toHaveText('일러스트 · 3장');
  await expect(page.locator('#source-image')).toHaveAttribute('src', /seoah-illustration-front/);
  await expect(page.locator('#download-model')).toHaveAttribute('href', '/characters/seoah-illustration.vsplat');
  expect(await page.evaluate(() => window.jst.modelId)).toBe('illustration');
  expect(await page.evaluate(() => window.jst.character.splat.numSplats)).toBeGreaterThan(0);

  for (const motion of ['idle', 'walk', 'run']) {
    await page.locator(`[data-motion="${motion}"]`).click();
    const before = await page.evaluate(() => window.jst.character.animationTime);
    await expect.poll(() => page.evaluate(() => window.jst.character.animationTime)).not.toBe(before);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `output/illustration/${motion}.png` });
  }
  await page.locator('[data-motion="idle"]').click();
  await page.locator('#pause').click();
  for (const [name, yaw] of [['front', 0], ['side', 90], ['back', 180]]) {
    await page.evaluate(y => { window.jst.controls.yaw = y; }, yaw);
    await page.waitForTimeout(200);
    await page.screenshot({ path: `output/illustration/model-${name}.png` });
  }
  await page.locator('#face-view').click();
  await expect(page.locator('#rest')).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'output/illustration/face-comparison.png' });

  for (const id of ['original', 'illustration']) {
    await page.locator('#model-select').selectOption(id);
    await expect(page.locator('#model-select')).toBeEnabled({ timeout: 45_000 });
    await expect(page.locator('#status')).toHaveText('동작 재생 가능');
    expect(await page.evaluate(() => window.jst.modelId)).toBe(id);
    await expect(page.locator('#source-image')).toHaveAttribute('src', id === 'illustration' ? /seoah-illustration-front/ : /seoah-front/);
  }
  await page.locator('#body-view').click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.locator('[data-motion="walk"]').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'output/illustration/mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});
