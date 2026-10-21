import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test('실제 캐릭터와 동작 재생, 정지, 카메라 조작', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#status')).toHaveText('동작 재생 가능', { timeout: 90_000 });
  const splats = await page.evaluate(() => window.jst.character.splat.numSplats);
  expect(splats).toBeGreaterThan(1000);
  await mkdir('output/verification', { recursive: true });

  for (const motion of ['idle', 'walk', 'run']) {
    await page.locator(`[data-motion="${motion}"]`).click();
    await expect.poll(() => page.evaluate(() => window.jst.character.currentAnimationName)).toBe(motion);
    const before = await page.evaluate(() => window.jst.character.animationTime);
    await expect.poll(() => page.evaluate(() => window.jst.character.animationTime)).not.toBe(before);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `output/verification/${motion}.png` });
  }

  await page.locator('#pause').click();
  await expect(page.locator('#pause')).toHaveText('재생');
  await page.waitForTimeout(400);
  const pausedTime = await page.evaluate(() => window.jst.character.animationTime);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.jst.character.animationTime)).toBe(pausedTime);
  await page.locator('#speed').selectOption('0.5');
  await page.locator('#pause').click();
  expect(await page.evaluate(() => window.jst.character.playbackSpeed)).toBe(.5);

  const beforeYaw = await page.evaluate(() => window.jst.controls.yaw);
  await page.mouse.move(900, 400);
  await page.mouse.down();
  await page.mouse.move(1100, 420, { steps: 10 });
  await page.mouse.up();
  expect(await page.evaluate(() => window.jst.controls.yaw)).not.toBe(beforeYaw);
  await page.locator('#reset').click();
  expect(await page.evaluate(() => window.jst.controls.yaw)).toBe(0);
  await page.locator('[data-motion="idle"]').click();
  await page.screenshot({ path: 'output/verification/desktop.png' });
  expect(errors).toEqual([]);
});

test('모바일 폭에서 조작부와 캐릭터 표시', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('#status')).toHaveText('동작 재생 가능', { timeout: 90_000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const controls = await page.locator('.transport').boundingBox();
  expect(controls.x).toBeGreaterThanOrEqual(0);
  expect(controls.x + controls.width).toBeLessThanOrEqual(390);
  await page.locator('[data-motion="walk"]').click();
  await expect(page.locator('[data-motion="walk"]')).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'output/verification/mobile.png', fullPage: true });
});
