# 서아 일러스트 3D 모델

정면·측면·후면 일러스트 3장으로 PINOC(JST-2)에서 생성한 성인 여성 캐릭터다. 2026-10-21 제작, 비공개 생성, 정밀 보정 포함 1회 10크레딧 사용.

## 파일

- `characters/seoah-illustration.vsplat`: 48,000 Gaussian 캐릭터. 일반 메시 GLB·FBX가 아니며 Viggle Splat Engine으로 연다.
- `motions/idle.glb`, `walk.glb`, `run.glb`: PINOC의 무료 대기·걷기·달리기. 캐릭터 몸체가 아닌 호환 뼈대 동작 파일이다.
- `generation.json`: 입력 파일명, 생성 옵션, 자산 ID, 비용과 모델 파일 해시.

## 보기

현재 PC에서는 `D:\JST`의 앱을 이용한다. 개발 서버가 실행 중이면 `http://127.0.0.1:5178/?model=illustration`을 연다. 저장된 모델의 열람·동작 재생에는 PINOC 로그인과 추가 크레딧이 필요 없다.

서버를 다시 켤 때는 프로젝트 폴더에서 `npm run dev`를 실행한다. 새 PC에 프로젝트 전체를 복사했다면 먼저 `npm ci`를 실행한다. 이 ZIP은 모델·동작 파일 묶음이며 웹 앱 전체를 포함하지 않는다.

다른 앱에 적용할 때는 [공식 Viggle Splat Engine](https://viggle.ai/pinoc/app/plugin)을 사용한다. 웹 프로젝트에서는 `@viggle/splat-engine@0.2.0`과 `playcanvas@2.18.0`으로 확인했다.

## 확인한 범위

정면·측면·후면 회전, 원형과 얼굴 비교, 대기·걷기·달리기, 모델 전환과 모바일 화면을 headless Chromium에서 확인했다. 원본 일러스트의 미소, 머리 장식 위치, 뒤쪽 치마 장식과 세부 자수에는 차이가 남아 있다. 움직이는 캐릭터 시제품이며 원본을 정확히 복제한 모델은 아니다.

동작 출처는 PINOC 공식 무료 라이브러리다. Standing Idle `1cbf45b5-5abe-4a88-97cd-a1a21da60d7b`, Walking `32d71c7f-e88a-4d1f-9c0c-1fde2da5f060`, Running `32c1d7ba-29d6-466c-a2bc-56ff17ca4d1a`를 사용했다.
