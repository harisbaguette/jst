# JST 캐릭터 스튜디오

가상의 한국인 25세 여성 **서아**를 이미지로 만들고 PINOC(JST-2)로 움직이는 3D 캐릭터로 변환한 실험이다. **현재 모델은 원본 얼굴 유사성과 실사감 기준에 미달한다.** 동작 재생 성공과 실사급 완성을 구분한다.

## 보기

```sh
npm ci
npm run dev
```

http://127.0.0.1:5178/ 에서 본다. 에셋을 로컬에 저장해 미리보기에는 PINOC 로그인이나 API 키가 필요 없다.

- **전신**: 대기·걷기·달리기, 회전·확대, 정지·속도 조절.
- **얼굴 비교**: 원본 사진의 얼굴 확대와 동작 없는 3D 원형을 나란히 확인. 원본은 새 이미지로 교체하지 않았다.
- **비교할 모델**: 전신 1장 입력 / 얼굴 참고 추가 실험. 기본은 기존 모델이며, 새 모델을 품질 개선 성공으로 판정하지 않았다.
- **원형**: 애니메이션을 끈 생성 모델 자체. 사진과 같은 포즈·카메라를 정밀 복원한 것은 아니다.

## 연구와 심사

[실사감 원인·비교 실험·제작 권고](docs/realism-research.md) · [Benan 심사와 수정 기록](docs/benan-review.md)

핵심 결과: 화면 버퍼 크기를 수정해 선명도 저하를 줄였다. 48,000→131,072점 비교와 얼굴 참고 추가 생성에서도 원본 얼굴·피부 디테일은 충분히 복원되지 않았다. 실사급 근접 장면은 얼굴 메시·피부·눈·머리카락을 직접 조절하는 제작 경로가 필요하다는 판단이다.

## 주요 파일

| 파일 | 내용 |
| --- | --- |
| `assets/characters/seoah-front.png` | 기준 전신 이미지, 1024×1536 |
| `assets/characters/seoah-face-reference.png` | 원본을 바탕으로 생성한 얼굴 참고. 관측 자료나 정답 이미지가 아님 |
| `public/characters/seoah.vsplat` | 기존 모델 high, 48,000점, 1,303,788 bytes |
| `public/characters/seoah-full.vsplat` | 같은 자산의 full, 131,072점, 3,546,788 bytes. 비교 연구용 |
| `public/characters/seoah-face-reference.vsplat` | 두 이미지 입력 실험 high, 48,000점, 1,303,804 bytes |
| `public/motions/` | 무료 대기·걷기·달리기 `splat-skeleton-glb` |
| `output/research/` | 같은 조건의 모델·해상도 비교, 입력 검증, 측정값 |
| `output/verification/` | 기능·모바일·얼굴 비교 캡처와 빌드 확인 기록 |

`.vsplat`은 Gaussian splat이며 일반 인체 메시 GLB/FBX가 아니다. 동작 GLB에는 MetaHuman 뼈대 애니메이션이 있고 별도 인체 메시가 없다. [출처와 생성 조건](ASSETS.md)을 참고한다.

## 검증

```sh
npm run build
npm test
# 개발 서버 실행 중, 무료 로컬 비교 캡처
node scripts/probe-render.mjs
```

Playwright headless Chromium으로 모델·동작, 정지·속도, 카메라, 모바일, DPR 2 실제 버퍼, 원형, 모델 왕복 전환, 동작 일부 실패와 모델 재시도를 확인한다. 처음 PC에 테스트용 브라우저가 없으면 `npx playwright install chromium`을 실행한다. 사용자 브라우저나 입력 포커스를 조작하지 않는다.

자동 시험은 동작과 복구 검증이다. 얼굴 유사성과 실사감은 원본 대조 캡처를 직접 보고 판단했고 **불합격**이다. 빌드에는 엔진 청크 크기와 `node:worker_threads` 브라우저 외부화 경고가 남으며, 브라우저 실행 오류와는 구분한다.

## 생성 기록과 추가 작업

기존 모델 Asset ID: `181332d0-bf2e-461a-807f-d3aabea86605`.
얼굴 참고 추가 실험: `a886542f-93bf-4b31-aa69-601c8a692b20`.
둘 다 `refine: true`, `visibility: private`로 생성. 각 10크레딧, 누적 20, 확인 잔액 40. 이미 받은 모델의 열람과 비교에는 생성 비용이 없다.

PINOC MCP가 연결돼 있으면 직접 도구를 사용한다. 별도로 연결해야 할 때만 `python3 scripts/connect-pinoc.py`를 쓴다. 기존 `scripts/pinoc-mcp.py`는 이 Mac의 Codex Keychain에 저장된 PINOC 항목으로 MCP를 호출하는 보조 도구다. 토큰이나 서명된 다운로드 주소를 저장소에 넣지 않는다.

[사용자가 준 예시](https://x.com/akokoi1/status/2112365119187591189) · [PINOC MCP](https://viggle.ai/pinoc/mcp) · [Viggle Splat Engine](https://viggle.ai/pinoc/app/plugin)
