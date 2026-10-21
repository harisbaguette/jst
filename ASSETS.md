# 에셋 출처

| 파일 | 출처 | 용도 |
| --- | --- | --- |
| `assets/characters/seoah-front.png` | OpenAI 내장 `image_gen`, 2026-10-21 직접 생성 | PINOC JST-2 캐릭터 생성용 정면 전신 원본 |

가상의 한국인 25세 여성 캐릭터. 특정 실존 인물의 사진이나 외부 캐릭터 에셋을 사용하지 않았다. 생성 프롬프트는 `docs/character-prompt.txt`에 보관한다.

참고한 작업 방식: https://x.com/akokoi1/status/2112365119187591189
PINOC 연결·기능·비용 안내: https://viggle.ai/pinoc/mcp

## PINOC 동작

공식 무료 동작 라이브러리에서 가져온 `splat-skeleton-glb` 파일. 캐릭터와 호환되는 MetaHuman 뼈대이며 별도 인체 메시를 포함하지 않는다.

| 파일 | 공식 이름 | Asset ID |
| --- | --- | --- |
| `public/motions/idle.glb` | Standing Idle | `1cbf45b5-5abe-4a88-97cd-a1a21da60d7b` |
| `public/motions/walk.glb` | Walking | `32d71c7f-e88a-4d1f-9c0c-1fde2da5f060` |
| `public/motions/run.glb` | Running | `32c1d7ba-29d6-466c-a2bc-56ff17ca4d1a` |

출처: https://viggle.ai/pinoc/app/ — 2026-10-21 MCP로 취득, 동작 비용 0크레딧.

뷰어 엔진: `@viggle/splat-engine@0.2.0` (MIT), `playcanvas@2.18.0` (MIT). 라이선스 원문은 설치 패키지에 포함된다.

## PINOC 캐릭터

`public/characters/seoah.vsplat`: 위에서 생성한 전신 원본을 PINOC(JST-2)에 넣어 정밀 보정 포함으로 생성한 비공개 캐릭터.

- Asset ID: `181332d0-bf2e-461a-807f-d3aabea86605`
- 취득 형식: `high`, 48,000 Gaussian, 1,303,788 bytes
- 생성 비용: 10크레딧
- 생성 결과와 뷰어를 2026-10-21에 확인했다.

## 얼굴 보존·실사감 비교 실험

| 파일 | 출처와 용도 |
| --- | --- |
| `assets/characters/seoah-face-reference.png` | OpenAI 내장 image_gen으로 전신 원본을 참조해 생성한 1024×1536 얼굴 클로즈업. 특정 실존 인물 자료 없음. AI가 추정한 세부이며 원본의 실측 복원본이 아님 |
| `public/characters/seoah-full.vsplat` | 기존 PINOC 자산의 full 단계, 131,072점, 3,546,788 bytes. 점 수 비교용. 추가 생성 비용 없음 |
| `public/characters/seoah-face-reference.vsplat` | 전신 원본+얼굴 참고를 넣은 실험 자산 `a886542f-93bf-4b31-aa69-601c8a692b20`. high 48,000점, 1,303,804 bytes, refine=true, private |
| `output/research/provider-source.png` | PINOC get_asset이 반환한 기존 입력 파일. 기준 원본과 SHA-256 동일 |
| `output/research/provider-preview.webp` | PINOC가 제공한 기존 생성 자산의 미리보기. 로컬 렌더러 이전의 품질 비교용 |
| `output/research/*.png`, `output/verification/*.png` | 격리된 headless Chromium에서 직접 캡처한 비교·검증 화면. 외부 홍보 이미지 아님 |

2026-10-21 실험. [얼굴 생성 프롬프트](docs/face-reference-prompt.txt), [3D 생성 조건](docs/face-reference-experiment.json)을 보관했다. 추가 생성 10크레딧, 잔액 50→40. 이미지 파일과 모델을 실제 저장했으며 만료되는 서명 URL은 앱에 사용하지 않는다.

새 모델은 실사감 개선 성공으로 판정하지 않았다. 비교 선택지로만 보존하고 기존 모델을 기본값으로 유지한다. 외부 에셋 팩이나 실존 인물 스캔은 이번 작업에 사용하지 않았다.
