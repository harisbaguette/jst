import './style.css';
import { Scene, Character, Animation, setAssetFetch } from '@viggle/splat-engine';
import { Vec3 } from 'playcanvas';
import { bindRenderResolution } from '../render-resolution.js';
import { buildRoom, TARGETS } from './room.js';
import { createMirror } from './mirror.js';
import { SPAWN, TASKS, loadSave, saveState, clearSave } from './state.js';

const $=id=>document.getElementById(id);
const canvas=$('world');
const keys=new Set();
const loaded=loadSave();
const state={...SPAWN,step:0,...loaded.state};
let scene,character,room,mirror,releaseResolution;
let ready=false,started=false,paused=true,ended=false,drag=null;
let turnTime=0,bodyLookTime=0,saveTime=0,toastTime=0,stepTime=0,currentMotion='idle';
let nearby=null,walkAvailable=false,audioContext=null;
let audioEnabled=true,sensitivity=.18;
const DEG=Math.PI/180;
const eye=new Vec3(),screenPoint=new Vec3(),targetPoint=new Vec3();
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

function toast(message){$('toast').textContent=message;$('toast').hidden=false;toastTime=3.5;}
function persist(){if(!ready)return;const ok=saveState(state);$('save-status').textContent=ok?'진행 저장됨':'이번 창에서만 진행';}
function tone(frequency=520,duration=.12,gain=.025){
  if(!audioEnabled)return;
  try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();void audioContext.resume().catch(()=>{});const oscillator=audioContext.createOscillator(),vol=audioContext.createGain();oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,audioContext.currentTime);vol.gain.setValueAtTime(gain,audioContext.currentTime);vol.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);oscillator.connect(vol);vol.connect(audioContext.destination);oscillator.start();oscillator.stop(audioContext.currentTime+duration);}catch{/* Audio is optional. */}
}
function footstep(){tone(90,.075,.018);}
function clearInput(){keys.clear();drag=null;}
function updateTask(){
  const [title,detail]=TASKS[state.step];$('chapter').textContent=state.step===4?'FREE EXPLORATION':`${String(state.step+1).padStart(2,'0')} / 04`;
  $('task-title').textContent=title;$('task-detail').textContent=detail;
  document.querySelectorAll('.steps i').forEach((el,i)=>el.classList.toggle('done',i<state.step));
  if(room)room.keys.enabled=state.step<3;
}
function progress(step){if(state.step>=step)return;state.step=step;updateTask();persist();tone(660,.15);}
function setPause(value){
  if(!ready||!started||ended)return;
  paused=value;clearInput();$('menu').hidden=!value;
  if(value){
    if(document.pointerLockElement)document.exitPointerLock();
    $('menu-title').textContent='잠시 쉬어가기';$('menu-description').textContent='서아의 오후는 여기서 기다리고 있어요.';
    $('start').textContent='계속하기';$('restart').hidden=false;persist();
  }else{canvas.focus({preventScroll:true});requestCapture();}
  character.playbackSpeed=value?0:1;
}
function requestCapture(){if($('capture-mouse').checked&&!document.pointerLockElement)canvas.requestPointerLock?.()?.catch?.(()=>toast('시선 고정 대신 화면을 드래그해 둘러볼 수 있어요.'));}
function begin(){
  if(!ready)return;started=true;paused=false;ended=false;$('menu').hidden=true;$('ending').hidden=true;
  for(const id of ['objective','crosshair','controls'])$(id).hidden=false;
  $('touch-controls').hidden=!matchMedia('(pointer:coarse)').matches;
  $('pause-button').disabled=false;character.playbackSpeed=1;clearInput();canvas.focus({preventScroll:true});requestCapture();tone(440,.08,.012);
  if(loaded.status==='unavailable'&&!loaded.state)toast('저장소를 사용할 수 없어 이번 창에서 진행합니다.');
}
function restart(){clearSave();Object.assign(state,SPAWN,{step:0});turnTime=bodyLookTime=saveTime=stepTime=0;currentMotion='idle';character.playAnimation('idle',{loop:true,rootMotion:false});updateTask();begin();persist();}
function finish(){progress(4);ended=true;paused=true;clearInput();character.playbackSpeed=0;$('ending').hidden=false;if(document.pointerLockElement)document.exitPointerLock();$('interaction').hidden=true;}
function toggleLook(){if(!started||paused)return;state.pitch=state.pitch< -50?-6:-104;}
function turn(){
  if(!started||paused)return;
  if(Math.hypot(state.x-TARGETS.mirror.x,state.z-TARGETS.mirror.z)>2.25){toast('전신 거울 가까이에서 R을 눌러보세요.');return;}
  turnTime=4;toast('거울에 비친 앞·옆·뒷모습을 확인해 보세요.');
}
function interact(){
  if(paused||!nearby)return;
  if(nearby==='mirror'){
    if(state.step===0){toggleLook();return;}
    if(state.step===1){progress(2);toast('같은 움직임이 거울에 비칩니다. 이제 창가의 열쇠를 챙겨요.');}
    else turn();
  }else if(nearby==='keys'){
    if(state.step<2)toast('먼저 몸을 내려다보고 전신 거울을 확인해 보세요.');
    else if(state.step===2){progress(3);toast('열쇠를 챙겼어요. 뒤쪽 현관문으로 가볼까요.');}
  }else if(nearby==='door'){
    if(state.step===3)finish();else if(state.step<3)toast('준비를 마치고 열쇠를 챙긴 뒤 나가세요.');else toast('오늘의 준비를 마쳤어요. 방을 더 둘러볼 수 있습니다.');
  }
}
function targetId(){return state.step===1?'mirror':state.step===2?'keys':state.step===3?'door':null;}
function updateInteraction(){
  nearby=null;let best=Infinity;
  for(const[id,t]of Object.entries(TARGETS)){
    if(id==='keys'&&state.step>=3)continue;
    const dx=t.x-state.x,dz=t.z-state.z,d=Math.hypot(dx,dz);
    const dot=d?(-Math.sin(state.yaw*DEG)*dx-Math.cos(state.yaw*DEG)*dz)/d:1;
    if(d<t.radius&&dot>.15&&d<best){nearby=id;best=d;}
  }
  $('interaction').hidden=!nearby||paused;
  if(nearby)$('interact-label').textContent=nearby==='mirror'?(state.step<=1?'거울 속 모습 확인':'한 바퀴 돌아보기'):TARGETS[nearby].label;
  const id=targetId();const marker=$('waypoint');
  marker.hidden=!id||paused;
  if(id&&!paused){const t=TARGETS[id];targetPoint.set(t.x,t.y,t.z);scene.cameraEntity.camera.worldToScreen(targetPoint,screenPoint);
    const p=scene.cameraEntity.getPosition();const forward=scene.cameraEntity.forward;
    const inFront=(t.x-p.x)*forward.x+(t.y-p.y)*forward.y+(t.z-p.z)*forward.z>0;
    const w=canvas.clientWidth,h=canvas.clientHeight;const sx=screenPoint.x,sy=screenPoint.y;
    marker.hidden=!inFront||sx<35||sx>w-35||sy<85||sy>h-90||nearby===id;
    if(!marker.hidden){marker.style.left=`${sx}px`;marker.style.top=`${sy}px`;$('waypoint-label').textContent=`${t.label} · ${Math.hypot(t.x-state.x,t.z-state.z).toFixed(1)} m`;}
  }
}
function update(dt){
  // No wall-clock catch-up: a suspended tab never creates a movement leap.
  dt=Math.min(Math.max(dt,0),.05);
  if(!ready)return;
  let moving=false;
  if(!paused){
    if(keys.has('ArrowLeft'))state.yaw+=85*dt;if(keys.has('ArrowRight'))state.yaw-=85*dt;
    if(keys.has('ArrowUp'))state.pitch+=65*dt;if(keys.has('ArrowDown'))state.pitch-=65*dt;
    state.pitch=clamp(state.pitch,-108,65);state.yaw=((state.yaw+180)%360+360)%360-180;
    let x=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),z=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0);
    const length=Math.hypot(x,z);if(length){x/=length;z/=length;}
    if(length&&turnTime<=0){const yaw=state.yaw*DEG,speed=1.65;const dx=(x*Math.cos(yaw)-z*Math.sin(yaw))*speed*dt,dz=(-x*Math.sin(yaw)-z*Math.cos(yaw))*speed*dt;
      const beforeX=state.x,beforeZ=state.z;
      if(room.allowed(state.x+dx,state.z))state.x+=dx;
      if(room.allowed(state.x,state.z+dz))state.z+=dz;
      moving=Math.hypot(state.x-beforeX,state.z-beforeZ)>.0001;
    }
    if(moving){stepTime+=dt;if(stepTime>.48){stepTime=0;footstep();}}else stepTime=0;
    if(turnTime>0)turnTime=Math.max(0,turnTime-dt);
    if(state.step===0&&state.pitch< -55){bodyLookTime+=dt;if(bodyLookTime>.8){progress(1);toast('몸과 발끝이 보이죠. 이제 앞쪽 전신 거울로 가보세요.');}}else bodyLookTime=0;
    saveTime+=dt;if(saveTime>5){saveTime=0;persist();}
    if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').hidden=true;}
  }
  const motion=moving&&walkAvailable?'walk':'idle';
  if(motion!==currentMotion){currentMotion=motion;character.crossfadeTo(motion,{duration:.22,loop:true,rootMotion:false});}
  character.playbackSpeed=paused?0:1;
  const turnYaw=turnTime>0?(4-turnTime)*90:0;
  character.setPosition(state.x,0,state.z);character.setRotation(0,state.yaw+180+turnYaw,0);
  // Lean the upper viewpoint forward as the player looks down: keeps the
  // skirt, stockings and feet visible instead of placing the eye in the chest.
  const lean=.09+clamp((-state.pitch-25)/55,0,1)*.32;
  eye.set(clamp(state.x-Math.sin(state.yaw*DEG)*lean,-3.86,3.86),1.72,clamp(state.z-Math.cos(state.yaw*DEG)*lean,-2.76,3.76));
  scene.cameraEntity.setPosition(eye);scene.cameraEntity.setEulerAngles(state.pitch,state.yaw,0);mirror.update(eye);
  updateInteraction();
}

document.addEventListener('keydown',e=>{
  if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)return;
  if(e.code==='Escape'){if(started&&!ended){e.preventDefault();setPause(!paused);}return;}
  if(paused)return;
  if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyB','KeyE','KeyR','Space'].includes(e.code))e.preventDefault();
  keys.add(e.code);if(e.repeat)return;
  if(e.code==='KeyB')toggleLook();if(e.code==='KeyE')interact();if(e.code==='KeyR')turn();
});
document.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{clearInput();if(started&&!paused&&!ended)setPause(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(started&&!paused&&!ended)setPause(true);}});
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&started&&!paused&&$('capture-mouse').checked)setPause(true);});
canvas.addEventListener('pointerdown',e=>{if(paused)return;canvas.focus({preventScroll:true});if($('capture-mouse').checked){requestCapture();return;}drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
document.addEventListener('pointermove',e=>{
  if(paused)return;let dx=0,dy=0;
  if(document.pointerLockElement===canvas){dx=e.movementX;dy=e.movementY;}
  else if(drag&&drag.id===e.pointerId){dx=e.clientX-drag.x;dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;}else return;
  state.yaw-=dx*sensitivity;state.pitch=clamp(state.pitch-dy*sensitivity,-108,65);
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{drag=null;});
for(const button of document.querySelectorAll('[data-move]')){
  button.addEventListener('pointerdown',e=>{if(paused)return;e.preventDefault();keys.add(button.dataset.move);button.setPointerCapture(e.pointerId);});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>keys.delete(button.dataset.move));
}
$('start').addEventListener('click',begin);$('pause-button').addEventListener('click',()=>setPause(true));
$('restart').addEventListener('click',restart);$('play-again').addEventListener('click',restart);
$('explore').addEventListener('click',begin);
$('look-button').addEventListener('click',toggleLook);$('turn-button').addEventListener('click',turn);$('interact-button').addEventListener('click',interact);
$('retry').addEventListener('click',()=>location.reload());
$('sensitivity').addEventListener('input',e=>{sensitivity=Number(e.target.value);});
$('sound').addEventListener('change',e=>{audioEnabled=e.target.checked;});
window.addEventListener('pagehide',()=>{if(started&&!paused&&!ended)setPause(true);persist();clearInput();void audioContext?.suspend().catch(()=>{});});

async function boot(){
  try{
    setAssetFetch((url,init={})=>fetch(url,{...init,signal:AbortSignal.any([init.signal,AbortSignal.timeout(30_000)].filter(Boolean))}));
    scene=await Scene.create(canvas,{backend:'webgl',fov:68,near:.035,far:30,depth:true,maxPixelRatio:1.5,ambientLight:.65});
    releaseResolution=bindRenderResolution(scene,canvas,1.5);
    room=buildRoom(scene);scene.start();
    character=await Character.load(scene,'/characters/vr-woman-opaque.vsplat');
    $('loading-status').textContent='캐릭터의 움직임을 준비하고 있습니다…';
    await Animation.loadGlb(scene,'/motions/idle.glb','idle');
    try{await Animation.loadGlb(scene,'/motions/walk.glb','walk');walkAvailable=true;}catch{toast('걷기 동작 파일을 읽지 못했습니다. 이동과 체험은 계속할 수 있어요.');}
    character.playAnimation('idle',{loop:true,rootMotion:false});character.armature.maxAnimDt=.05;
    mirror=createMirror(scene,character,room);
    if(!room.allowed(state.x,state.z))Object.assign(state,SPAWN);
    updateTask();ready=true;scene.app.on('update',update);update(0);
    $('loading-status').textContent=loaded.status==='recovered'?'저장된 진행을 복구할 수 없어 새로 시작합니다.':loaded.state?'이전 진행이 저장되어 있어요.':'준비됐어요. 원하는 속도로 둘러보세요.';
    $('start').disabled=false;$('start').textContent=loaded.state?'이어서 체험하기':'서아의 시선으로 시작';$('restart').hidden=!loaded.state;
    // Read-only snapshots for diagnostics; game input owns all state changes.
    window.seoahGame={get snapshot(){return {...state,ready,started,paused,ended,nearby,currentMotion,turnTime,walkAvailable,headHidden:mirror.groups.reduce((n,v)=>n+v,0),splats:character.splat.numSplats};},scene,character,mirror,room};
  }catch(error){
    console.error('Game load failed:',error);$('loading-status').textContent='캐릭터나 방을 불러오지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.';$('start').hidden=true;$('retry').hidden=false;
    scene?.setSuspended(true);mirror?.dispose();room?.dispose();releaseResolution?.();scene?.destroy();
  }
}
void boot();
