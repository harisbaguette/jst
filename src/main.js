import './style.css';
import sourceImage from '../assets/characters/seoah-front.png';

const $ = (id) => document.getElementById(id);
$('source-image').src = sourceImage;
$('source-link').href = sourceImage;
let scene, character, controls;
let paused = false;
let loading = false;
const initialView = { distance: 3.8, pitch: 8, yaw: 0, target: { x: 0, y: .85, z: 0 } };

function notice(title, message, retry = false) {
  $('notice').hidden = false;
  $('notice-title').textContent = title;
  $('notice-body').textContent = message;
  $('retry').hidden = !retry;
}

function applySpeed() {
  if (character) character.playbackSpeed = paused ? 0 : Number($('speed').value);
}

async function load() {
  if (loading) return;
  loading = true;
  try {
    const response = await fetch('/character.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('캐릭터 정보를 읽지 못했습니다.');
    const manifest = await response.json();
    if (!manifest.model) {
      $('status').textContent = '3D 생성 전';
      notice('원본 이미지가 준비됐습니다', manifest.message || 'PINOC에서 캐릭터 생성이 끝나면 이 화면에서 확인할 수 있습니다.');
      return;
    }
    $('status').textContent = '3D 캐릭터 불러오는 중';
    notice('캐릭터를 불러오고 있습니다', '처음 열 때 모델을 읽는 데 잠시 시간이 걸릴 수 있습니다.');
    const { Scene, Character, Animation, OrbitControls, SkyDome, Grid } = await import('@viggle/splat-engine');
    controls?.detach();
    scene?.destroy();
    scene = await Scene.create($('canvas'), { fov: 40 });
    controls = new OrbitControls({ ...initialView, distanceRange: [1, 9] });
    controls.attach({ canvas: $('canvas'), cameraEntity: scene.cameraEntity });
    scene.app.on('update', () => controls.update());
    SkyDome.create(scene, { topColor: '#eeede8', bottomColor: '#e3e6dc' });
    Grid.create(scene, { color: '#a9b19f', showAxes: false, strength: .24, fadeStart: 1, fadeEnd: 8 });
    scene.start();
    character = await Character.load(scene, manifest.model);
    character.setPosition(0, 0, 0);
    const motions = manifest.motions || [];
    $('motions').replaceChildren();
    for (const motion of motions) {
      await Animation.loadGlb(scene, motion.url, motion.name);
      const button = document.createElement('button');
      button.textContent = motion.label;
      button.dataset.motion = motion.name;
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        const started = character.crossfadeTo(motion.name, { duration: .25, loop: true, rootMotion: false });
        if (!started) return;
        for (const other of $('motions').children) other.setAttribute('aria-pressed', String(other === button));
        $('view-label').textContent = motion.label;
        applySpeed();
      });
      $('motions').append(button);
    }
    $('motions').firstElementChild?.click();
    $('pause').disabled = motions.length === 0;
    $('speed').disabled = motions.length === 0;
    $('reset').disabled = false;
    $('download-model').href = manifest.model;
    $('download-model').hidden = false;
    $('notice').hidden = true;
    $('status').textContent = motions.length ? '동작 재생 가능' : '3D 캐릭터 준비 완료';
    window.jst = { scene, character, controls };
  } catch (error) {
    console.error(error);
    controls?.detach();
    scene?.destroy();
    scene = null;
    character = null;
    $('pause').disabled = true;
    $('speed').disabled = true;
    $('reset').disabled = true;
    $('motions').replaceChildren();
    $('status').textContent = '불러오기 실패';
    notice('캐릭터를 불러오지 못했습니다', '모델 파일과 브라우저의 3D 가속 지원을 확인해 주세요.', true);
  } finally {
    loading = false;
  }
}

$('pause').addEventListener('click', () => {
  paused = !paused;
  $('pause').textContent = paused ? '재생' : '일시정지';
  applySpeed();
});
$('speed').addEventListener('change', applySpeed);
$('reset').addEventListener('click', () => {
  controls.yaw = initialView.yaw;
  controls.pitch = initialView.pitch;
  controls.distance = initialView.distance;
  controls.target.set(initialView.target.x, initialView.target.y, initialView.target.z);
});
$('retry').addEventListener('click', load);
window.addEventListener('pagehide', () => { controls?.detach(); scene?.destroy(); });
load();
