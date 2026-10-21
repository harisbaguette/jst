import './style.css';
import sourceImage from '../assets/characters/seoah-front.png';
import { bindRenderResolution } from './render-resolution.js';

const $ = (id) => document.getElementById(id);
$('source-image').src = sourceImage;
$('source-link').href = sourceImage;
let scene, character, controls, releaseResolution;
let paused = false;
let loading = false;
let faceView = false;
let restPose = false;
const bodyCamera = { distance: 3.8, pitch: 8, yaw: 0, target: { x: 0, y: .85, z: 0 } };
const faceCamera = { distance: .95, pitch: 0, yaw: 0, target: { x: 0, y: 1.52, z: 0 } };

function notice(title, message, retry = false) {
  $('notice').hidden = false;
  $('notice-title').textContent = title;
  $('notice-body').textContent = message;
  $('retry').hidden = !retry;
}

function applySpeed() {
  if (character) character.playbackSpeed = paused ? 0 : Number($('speed').value);
  $('pause').textContent = paused ? '재생' : '일시정지';
}

function resetCamera() {
  if (!controls) return;
  const view = faceView ? faceCamera : bodyCamera;
  controls.yaw = view.yaw;
  controls.pitch = view.pitch;
  controls.distance = view.distance;
  controls.target.set(view.target.x, view.target.y, view.target.z);
}

function selectMotion(button) {
  for (const other of $('motions').children) other.setAttribute('aria-pressed', String(other === button));
  $('view-label').textContent = button.textContent;
}

function showRest() {
  if (!character) return;
  character.stop();
  character.setRotation(0, -90, 0); // This asset's bind pose faces +X.
  restPose = true;
  paused = false;
  applySpeed();
  $('pause').disabled = true;
  $('speed').disabled = true;
  selectMotion($('rest'));
}

function setFaceView(enabled) {
  faceView = enabled;
  document.body.classList.toggle('face-view', enabled);
  $('face-view').setAttribute('aria-pressed', String(enabled));
  $('body-view').setAttribute('aria-pressed', String(!enabled));
  $('source-caption').textContent = enabled ? '원본 사진 · 얼굴 확대' : '생성 원본';
  if (enabled) showRest();
  resetCamera();
}

function destroyScene() {
  releaseResolution?.();
  releaseResolution = null;
  controls?.detach();
  scene?.destroy();
  controls = scene = character = null;
  delete window.jst;
}

function disableControls(disabled) {
  for (const id of ['reset', 'body-view', 'face-view', 'model-select']) $(id).disabled = disabled;
  $('pause').disabled = disabled || restPose;
  $('speed').disabled = disabled || restPose;
}

async function load() {
  if (loading) return;
  loading = true;
  disableControls(true);
  $('motion-warning').hidden = true;
  $('download-model').hidden = true;
  $('motions').replaceChildren();
  destroyScene();
  // PlayCanvas caches context state per canvas. A destroyed context cannot
  // initialize another Scene on the same element (including retry paths).
  $('canvas').replaceWith($('canvas').cloneNode(false));
  paused = false;
  restPose = false;
  applySpeed();
  try {
    const response = await fetch('/character.json', { cache: 'no-store', signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error('캐릭터 정보를 읽지 못했습니다.');
    const manifest = await response.json();
    if (!manifest.model) throw new Error('모델 파일이 지정되지 않았습니다.');
    const selected = $('model-select').value;
    const models = manifest.models || [{ id: 'original', label: '현재 캐릭터', url: manifest.model }];
    $('model-select').replaceChildren(...models.map(model => new Option(model.label, model.id)));
    $('model-select').value = models.some(model => model.id === selected) ? selected : models[0].id;
    const model = models.find(model => model.id === $('model-select').value);
    $('model-options').hidden = models.length < 2;
    $('status').textContent = '3D 캐릭터 불러오는 중';
    notice('캐릭터를 불러오고 있습니다', '모델과 동작 파일을 읽고 있습니다.');
    const { Scene, Character, Animation, OrbitControls, SkyDome, Grid, setAssetFetch } = await import('@viggle/splat-engine');
    setAssetFetch((url, init = {}) => fetch(url, {
      ...init,
      signal: AbortSignal.any([init.signal, AbortSignal.timeout(45_000)].filter(Boolean)),
    }));
    scene = await Scene.create($('canvas'), { fov: 40, maxPixelRatio: 2 });
    releaseResolution = bindRenderResolution(scene, $('canvas'));
    controls = new OrbitControls({ ...bodyCamera, distanceRange: [.5, 9] });
    controls.attach({ canvas: $('canvas'), cameraEntity: scene.cameraEntity });
    scene.app.on('update', () => controls.update());
    SkyDome.create(scene, { topColor: '#eeede8', bottomColor: '#e3e6dc' });
    Grid.create(scene, { color: '#a9b19f', showAxes: false, strength: .24, fadeStart: 1, fadeEnd: 8 });
    scene.start();
    character = await Character.load(scene, model.url);
    character.setPosition(0, 0, 0);
    const rest = document.createElement('button');
    rest.id = 'rest';
    rest.textContent = '원형';
    rest.setAttribute('aria-pressed', 'false');
    rest.addEventListener('click', showRest);
    $('motions').append(rest);
    const failed = [];
    let firstMotion;
    for (const motion of manifest.motions || []) {
      try {
        await Animation.loadGlb(scene, motion.url, motion.name);
      } catch {
        failed.push(motion.label);
        continue; // A missing motion must not discard a usable character.
      }
      const button = document.createElement('button');
      button.textContent = motion.label;
      button.dataset.motion = motion.name;
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        character.setRotation(0, 0, 0);
        const started = character.crossfadeTo(motion.name, { duration: .25, loop: true, rootMotion: false });
        if (!started) return;
        restPose = false;
        $('pause').disabled = $('speed').disabled = false;
        selectMotion(button);
        applySpeed();
      });
      firstMotion ||= button;
      $('motions').append(button);
    }
    if (faceView || !firstMotion) showRest();
    else firstMotion.click();
    resetCamera();
    disableControls(false);
    $('download-model').href = model.url;
    $('download-model').hidden = false;
    $('notice').hidden = true;
    $('status').textContent = firstMotion ? '동작 재생 가능' : '3D 확인 가능 · 동작 없음';
    if (failed.length) {
      $('motion-warning').textContent = `${failed.join('·')} 동작을 불러오지 못했습니다. 다른 동작과 캐릭터는 볼 수 있습니다.`;
      $('motion-warning').hidden = false;
    }
    window.jst = { scene, character, controls };
  } catch (error) {
    console.error(error);
    destroyScene();
    disableControls(true);
    $('motions').replaceChildren();
    $('status').textContent = '불러오기 실패';
    notice('캐릭터를 불러오지 못했습니다', '모델 파일과 브라우저의 3D 가속 지원을 확인한 뒤 다시 불러오세요.', true);
  } finally {
    loading = false;
  }
}

$('pause').addEventListener('click', () => { paused = !paused; applySpeed(); });
$('speed').addEventListener('change', applySpeed);
$('reset').addEventListener('click', resetCamera);
$('face-view').addEventListener('click', () => setFaceView(true));
$('body-view').addEventListener('click', () => setFaceView(false));
$('model-select').addEventListener('change', load);
$('retry').addEventListener('click', load);
window.addEventListener('pagehide', destroyScene);
load();
