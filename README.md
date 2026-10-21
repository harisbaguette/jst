# JST 캐릭터 실험

실사풍의 가상 한국인 25세 여성 이미지를 PINOC(JST-2)에 넣어 움직이는 3D 캐릭터를 만드는 작업.

## 현재 상태

- 전신 이미지 생성 및 육안 확인 완료: `assets/characters/seoah-front.png`
- Codex의 `pinoc` MCP 서버 설정 완료: `https://pinoc.mcp.viggle.ai/mcp`
- 서버에 접속하여 계정 인증이 필요함을 확인했다.
- PINOC 로그인 완료. 정밀 보정 포함 3D 캐릭터 생성 중. 무료 크레딧 10개 사용.
- 대기·걷기·달리기 동작을 공식 무료 라이브러리에서 내려받았다.
- 로컬 뷰어: `npm run dev` 실행 후 http://127.0.0.1:5178/ 접속. 모델 생성 완료 후 실제 동작 검증 예정.

## 계정 연결

```sh
python3 scripts/connect-pinoc.py
```

출력되는 공식 Viggle 인증 링크를 사용자가 직접 열어 로그인한다. 이 스크립트는 `codex mcp login pinoc --no-browser`를 실행한다. 브라우저를 자동으로 열지 않으며, 같은 PC에서 로그인하면 Codex가 로컬 callback을 받는다. 비밀번호나 인증 코드를 대화에 붙여넣을 필요가 없다. 인증 정보 저장도 Codex가 처리한다. 로그인 링크가 만료되면 스크립트를 다시 실행한다.

## 생성 절차

1. `get_credit_balance`로 실제 잔액과 생성 비용 확인.
2. 전신 원본을 공식 일회용 업로드 경로로 전달.
3. `generate_character`로 정밀 보정 포함 캐릭터 한 개 생성. 공식 안내상 10크레딧. 재생성이나 추가 결제는 자동으로 하지 않는다.
4. 생성 작업 완료 후 `.vsplat` 파일을 이 프로젝트에 다운로드.
5. 무료 라이브러리에서 대기·걷기·달리기 동작을 골라 실제 재생 확인.

캐릭터는 Gaussian splat 형식이며, 동작 GLB/FBX와 별개다. 로컬에서 움직임을 렌더링할 때 Viggle Splat Engine이 필요하다. 동작 파일은 `public/motions/`에 있다. 모델과 실제 동작 재생 검증은 생성 완료 후 진행한다.

## 자료

- [사용자가 제시한 예시](https://x.com/akokoi1/status/2112365119187591189)
- [PINOC MCP](https://viggle.ai/pinoc/mcp)
- [이미지 입력 안내](https://viggle.ai/pinoc/image-to-3d-character)
- [Viggle Splat Engine](https://viggle.ai/pinoc/app/plugin)
- 생성 출처: `ASSETS.md`
- 원본 생성 프롬프트: `docs/character-prompt.txt`
