export const SAVE_KEY = 'jst-seoah-afternoon-v1';
export const SPAWN = { x: 0, z: .8, yaw: 0, pitch: -6 };
export const TASKS = [
  ['새로운 눈높이', 'B를 눌러 몸과 발끝을 내려다보세요. WASD로 천천히 걸어볼 수 있어요.'],
  ['거울 속의 나', '앞쪽 전신 거울로 다가가 E를 누르세요. R을 누르면 한 바퀴 돌아봅니다.'],
  ['외출 준비', '창가 책상 위에 둔 열쇠를 챙기세요. 가까이에서 E를 누르면 됩니다.'],
  ['문밖으로 한 걸음', '열쇠를 챙겼어요. 뒤쪽 현관문으로 가서 E를 누르세요.'],
  ['나만의 속도로', '자유롭게 걸어보세요. 거울 앞 R 회전과 B 내려다보기도 계속 사용할 수 있어요.'],
];
export function loadSave() {
  let raw;
  try { raw=localStorage.getItem(SAVE_KEY); }
  catch { return { state: null, status: 'unavailable' }; }
  if (!raw) return { state: null, status: 'ok' };
  try {
    const s = JSON.parse(raw);
    if (s.version !== 1 || !Number.isInteger(s.step) || s.step < 0 || s.step > 4 ||
        ![s.x,s.z,s.yaw,s.pitch].every(Number.isFinite) || Math.abs(s.x)>3.65 || s.z< -2.5 || s.z>3.55 ||
        Math.abs(s.yaw)>1e6 || s.pitch< -108 || s.pitch>65) return { state: null, status: 'recovered' };
    return { state: {x:s.x,z:s.z,yaw:s.yaw,pitch:s.pitch,step:s.step}, status:'ok' };
  } catch { return { state: null, status: 'recovered' }; }
}
export function saveState(s) {
  try { localStorage.setItem(SAVE_KEY,JSON.stringify({version:1,x:s.x,z:s.z,yaw:s.yaw,pitch:s.pitch,step:s.step}));return true; }
  catch { return false; }
}
export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch { /* In-memory restart still works. */ } }
