# JST 캐릭터 스튜디오

실사풍의 가상 한국인 25세 여성 **서아**를 이미지로 만들고, PINOC(JST-2)로 움직이는 3D 캐릭터로 변환했다. 대기·걷기·달리기, 시점 회전, 확대·축소, 일시정지와 재생 속도 조절을 지원한다.

## 실행

```sh
npm install
npm run dev
```

http://127.0.0.1:5178/ 에 접속한다. 캐릭터와 동작 파일을 프로젝트에 저장했으므로 미리보기에는 PINOC 로그인이나 API 키가 필요 없다.

## 결과 파일

| 파일 | 내용 |
| --- | --- |
| `assets/characters/seoah-front.png` | 직접 생성한 1024 × 1536 정면 전신 이미지 |
| `public/characters/seoah.vsplat` | 정밀 보정 포함 3D 캐릭터, high 등급, 48,000 Gaussian, 약 1.3 MB |
| `public/motions/idle.glb` | 대기 |
| `public/motions/walk.glb` | 걷기 |
| `public/motions/run.glb` | 달리기 |
| `public/character.json` | 뷰어에서 읽는 로컬 파일 목록 |
| `output/verification/` | 실제 브라우저 렌더와 동작 검증 화면 |
| `docs/character-prompt.txt` | 내장 image_gen에 사용한 원본 프롬프트 |

캐릭터는 Gaussian splat 형식이다. 일반 메시용 GLB/FBX 가져오기로는 열리지 않으며, 이 프로젝트에 설치한 Viggle Splat Engine으로 재생한다. 동작 파일은 캐릭터용 MetaHuman 뼈대 애니메이션이며 별도 인체 메시가 없다. 정면 외의 모습은 PINOC가 추정한 결과이고 원본 사진보다 머리카락·손가락 등의 세부가 거칠 수 있다.

## 생성 기록

- 원본 이미지: OpenAI 내장 `image_gen`, 2026-10-21 직접 생성.
- PINOC 계정 연결: Codex OAuth, 본인 Google 로그인 완료.
- `generate_character`: 원본 이미지 한 장, `refine: true`, `visibility: private`.
- 생성 작업: `4063a6a7-2532-4731-ba25-944d1c2d5f6b`.
- 생성 Asset ID: `181332d0-bf2e-461a-807f-d3aabea86605`.
- 캐릭터 생성 10크레딧 사용, 동작 3개 0크레딧. 무료 잔액 60 → 50.
- 다운로드 링크를 앱에 남기지 않고 실제 파일을 내려받았다.

## 검증

```sh
npm run build
npm test
```

Playwright의 headless Chromium으로 실제 모델 로딩, 3개 동작 전환과 프레임 진행, 정지·재생·속도 조절, 드래그와 카메라 초기화, 모바일 폭에서의 조작부 표시를 확인한다. 사용자 브라우저나 마우스·키보드 포커스를 조작하지 않는다. 처음 설치한 PC에 테스트용 브라우저가 없다면 `npx playwright install chromium`을 실행한다.

검증 결과: 빌드 성공, 자동 시험 2개 통과, 빌드된 실행본의 WebGL2 렌더·48,000 Gaussian 로딩·걷기 프레임 진행 확인. 오류 0건. 정면·측면·뒷면 렌더를 직접 확인했다. 기록은 `output/verification/report.json`에 있다.

## PINOC에서 추가 작업할 때

이미 완료한 캐릭터를 보려면 계정 연결을 다시 할 필요가 없다. 추가 생성 등 MCP 작업이 필요한 경우에만 다음을 사용한다.

```sh
python3 scripts/connect-pinoc.py
python3 scripts/pinoc-mcp.py get_credit_balance
```

첫 명령은 공식 `codex mcp login pinoc --no-browser`로 연결한다. 두 번째 스크립트는 이 Mac의 Codex Keychain에서 PINOC 인증 항목만 읽어 직접 MCP를 호출한다. 인증 토큰을 프로젝트나 로그에 기록하지 않는다. 토큰 만료 시 공식 로그인 명령으로 다시 연결한다.

## 자료

- [사용자가 제시한 예시](https://x.com/akokoi1/status/2112365119187591189)
- [PINOC MCP](https://viggle.ai/pinoc/mcp)
- [이미지 입력 안내](https://viggle.ai/pinoc/image-to-3d-character)
- [Viggle Splat Engine](https://viggle.ai/pinoc/app/plugin)
- 에셋 출처: `ASSETS.md`
