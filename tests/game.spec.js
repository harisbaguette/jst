import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const output='output/game';
const snapshot=page=>page.evaluate(()=>window.seoahGame.snapshot);
async function ready(page){await page.goto('/game.html');await expect(page.locator('#start')).toBeEnabled({timeout:90_000});}
async function holdUntil(page,key,predicate){await page.keyboard.down(key);try{await page.waitForFunction(predicate,null,{timeout:30_000});}finally{await page.keyboard.up(key);}}
async function shot(page,name){await page.waitForTimeout(350);await page.screenshot({path:`${output}/${name}.png`});}

test('1인칭 몸·실시간 거울·실제 이동으로 외출 완료, 저장·일시정지·재시작',async({page})=>{
  test.setTimeout(240_000);await mkdir(output,{recursive:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await ready(page);await shot(page,'01-start');await page.locator('#start').click();
  expect((await snapshot(page)).splats).toBe(48000);
  expect((await snapshot(page)).headHidden).toBeGreaterThan(10000);
  expect(await page.evaluate(()=>window.seoahGame.mirror.body.linkedArmature===window.seoahGame.character.armature)).toBe(true);
  await page.keyboard.press('KeyB');await expect.poll(async()=>(await snapshot(page)).step).toBe(1);await shot(page,'02-first-person-body');
  await page.keyboard.press('KeyB');
  await holdUntil(page,'KeyW',()=>window.seoahGame.snapshot.z< -1.25);
  await expect(page.locator('#interact-label')).toHaveText('거울 속 모습 확인');await shot(page,'03-live-mirror');
  await page.keyboard.press('KeyE');expect((await snapshot(page)).step).toBe(2);
  await page.keyboard.press('KeyR');await page.waitForFunction(()=>window.seoahGame.snapshot.turnTime<2.9&&window.seoahGame.snapshot.turnTime>0);await shot(page,'04-mirror-turn');
  await expect.poll(async()=>(await snapshot(page)).turnTime,{timeout:20000}).toBe(0);
  await holdUntil(page,'KeyA',()=>window.seoahGame.snapshot.x< -1.38);
  await holdUntil(page,'ArrowLeft',()=>window.seoahGame.snapshot.yaw>87);
  // The desk must stop walking; interaction is reachable from its edge.
  await page.keyboard.down('KeyW');await page.waitForTimeout(1500);await page.keyboard.up('KeyW');
  const atDesk=await snapshot(page);expect(atDesk.x).toBeGreaterThan(-1.61);expect(atDesk.x).toBeLessThan(-1.3);
  await expect(page.locator('#interact-label')).toHaveText('열쇠 챙기기');await shot(page,'05-keys');
  await page.keyboard.press('KeyE');expect((await snapshot(page)).step).toBe(3);expect(await page.evaluate(()=>window.seoahGame.room.keys.enabled)).toBe(false);
  await holdUntil(page,'ArrowRight',()=>window.seoahGame.snapshot.yaw<4);
  // Lose focus with a movement key held: resume must not keep walking.
  await page.keyboard.down('KeyS');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  expect((await snapshot(page)).paused).toBe(true);await page.keyboard.up('KeyS');const stopped=await snapshot(page);
  await page.waitForTimeout(250);expect((await snapshot(page)).z).toBe(stopped.z);
  await page.locator('#start').click();await page.waitForTimeout(350);expect((await snapshot(page)).z).toBe(stopped.z);
  await holdUntil(page,'KeyS',()=>window.seoahGame.snapshot.z>2.92);
  await holdUntil(page,'KeyD',()=>window.seoahGame.snapshot.x>1.42);
  await holdUntil(page,'ArrowRight',()=>window.seoahGame.snapshot.yaw< -174);
  await expect(page.locator('#interact-label')).toHaveText('현관문 열기');await shot(page,'06-door');
  await page.keyboard.press('KeyE');await expect(page.locator('#ending')).toBeVisible();expect((await snapshot(page)).step).toBe(4);await shot(page,'07-complete');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jst-seoah-afternoon-v1')));expect(saved.step).toBe(4);
  await page.reload();await expect(page.locator('#start')).toBeEnabled({timeout:90_000});expect((await snapshot(page)).step).toBe(4);
  await page.locator('#start').click();await expect(page.locator('#task-title')).toHaveText('나만의 속도로');
  await page.locator('#pause-button').click();await page.locator('#restart').click();expect((await snapshot(page)).step).toBe(0);expect((await snapshot(page)).z).toBe(.8);
  await page.keyboard.press('KeyB');await expect.poll(async()=>(await snapshot(page)).step).toBe(1);
  expect(errors).toEqual([]);
  await writeFile(`${output}/playthrough.json`,JSON.stringify({result:'pass',input:'keyboard and UI; no state teleport',splats:48000,sharedLiveArmature:true,checks:['body look','mirror','turn','desk collision','pick up keys','blur pause and input release','exit completion','reload saved completion','restart'],pageErrors:errors},null,2)+'\n');
});

test('잘못된 저장과 저장 거부에도 시작·진행·재시작이 가능하다',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('jst-seoah-afternoon-v1','{"version":1,"step":99}'));
  await ready(page);await expect(page.locator('#loading-status')).toContainText('새로 시작');expect((await snapshot(page)).step).toBe(0);
  await page.locator('#start').click();await page.keyboard.press('KeyB');await expect.poll(async()=>(await snapshot(page)).step).toBe(1);
  const browser=page.context().browser();await page.close();
  const context=await browser.newContext();const denied=await context.newPage();
  await denied.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError');}});});
  await ready(denied);await denied.locator('#start').click();await denied.keyboard.press('KeyB');await expect.poll(async()=>(await snapshot(denied)).step).toBe(1);
  await expect(denied.locator('#save-status')).toHaveText('이번 창에서만 진행');await denied.locator('#pause-button').click();await denied.locator('#restart').click();expect((await snapshot(denied)).step).toBe(0);await context.close();
});

test('모델 로드 실패 후 재시도하고 걷기 파일 실패도 복구한다',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/vr-woman-opaque.vsplat',r=>r.fulfill({status:503,body:'unavailable'}));await page.goto('/game.html');await expect(page.locator('#retry')).toBeVisible({timeout:60_000});
  await page.unroute('**/vr-woman-opaque.vsplat');await page.route('**/motions/walk.glb',r=>r.fulfill({status:404,body:'not found'}));await page.locator('#retry').click();await expect(page.locator('#start')).toBeEnabled({timeout:90_000});
  expect((await snapshot(page)).walkAvailable).toBe(false);await page.locator('#start').click();await holdUntil(page,'KeyW',()=>window.seoahGame.snapshot.z<0);expect((await snapshot(page)).z).toBeLessThan(0);expect(errors).toEqual([]);
});

test('작은 터치 화면에서 버튼 이동·취소와 시선 드래그를 사용할 수 있다',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
  await ready(page);await page.locator('#start').click();await expect(page.locator('#touch-controls')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
  const forward=page.locator('[data-move="KeyW"]'),bounds=await forward.boundingBox();await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.down();await page.waitForTimeout(700);await forward.dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();
  const stopped=await snapshot(page);expect(stopped.z).toBeLessThan(.8);await page.waitForTimeout(250);expect((await snapshot(page)).z).toBe(stopped.z);
  await page.locator('#look-button').click();await expect.poll(async()=>(await snapshot(page)).step).toBe(1);await shot(page,'08-mobile-body');
  await page.locator('#look-button').click();await page.mouse.move(180,420);await page.mouse.down();await page.mouse.move(300,430,{steps:5});await page.mouse.up();expect(Math.abs((await snapshot(page)).yaw)).toBeGreaterThan(10);await context.close();
});
