import { Scene, Character, Animation, OrbitControls, SkyDome } from '@viggle/splat-engine';
import { bindRenderResolution } from '../src/render-resolution.js';

const params = new URLSearchParams(location.search);
const canvas = document.querySelector('canvas');
const ratio = Number(params.get('ratio')) || 1;
const scene = await Scene.create(canvas, { fov: 40, maxPixelRatio: ratio });
if (params.get('corrected') === 'true') bindRenderResolution(scene, canvas, ratio);
const controls = new OrbitControls({ distance: .95, pitch: 0, yaw: 0, target: { x: 0, y: 1.52, z: 0 } });
controls.attach({ canvas, cameraEntity: scene.cameraEntity });
scene.app.on('update', () => controls.update());
SkyDome.create(scene, { topColor: '#eeede8', bottomColor: '#e3e6dc' });
scene.start();
const file = params.get('tier') === 'full' ? 'seoah-full' : 'seoah';
const character = await Character.load(scene, `/characters/${file}.vsplat`);
character.setPosition(0, 0, 0);
if (params.get('pose') === 'idle') {
  await Animation.loadGlb(scene, '/motions/idle.glb', 'idle');
  character.playAnimation('idle', { loop: true, rootMotion: false });
  character.playbackSpeed = 0;
  character.animationTime = 0;
} else {
  // This asset's bind pose faces +X; the library idle faces +Z.
  character.setRotation(0, -90, 0);
}
window.probe = { scene, character, controls };
