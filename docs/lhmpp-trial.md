# LHM++ 시험 결과

LHM++는 사진 1장으로 움직일 수 있는 3D 아바타를 만드는 오픈소스임. 이 PC에 깔아 서아 사진으로 돌려 봄.

## 결론
- **권고: 시험용으로만 씀. 제품에는 못 씀.** 모델 파일(가중치)이 비상업 전용(CC BY-NC 4.0)임. 코드만 Apache-2.0임.
- 몸과 옷은 앞·옆·뒤가 모두 그럴듯함.
- 얼굴은 흐리고 원본과 다름. 앞머리가 생기고 시선이 어긋남. PINOC로 만든 기존 모델과 얼굴을 나란히 비교하진 않았음. 기존 모델도 얼굴 유사성 미달이었음([실사감 연구](realism-research.md)).
- 지금 뷰어에서는 못 봄. 결과 파일(`.ply`)은 PINOC 전용 `.vsplat`과 형식이 달라 변환이 필요한데 하지 않았음.
- 사진 1장에 약 9분 걸리고 GPU 메모리 약 8GB를 씀. RTX 5080(16GB)에서는 문제없이 돌아감.

결과 사진: [몸 앞·옆·뒤](../output/research/lhmpp/seoah-body-front-side-back.png), [얼굴 확대](../output/research/lhmpp/seoah-face-closeup.png)

## 다음에 할 일
얼굴 품질이 목표면 이 방법으로는 부족함. 얼굴만 따로 만드는 경로를 [실사감 연구](realism-research.md)의 권고대로 검토해야 함. 이 결과를 뷰어에 올릴지 정하면 변환부터 하면 됨.

설치 위치는 `third_party/LHM-plusplus/`이고 저장소에는 올라가지 않음. 이 PC에 맞추려고 한 조치(RTX 5080용 PyTorch로 교체, 일부 부품 대체, 라이브러리 몇 줄 수정)는 `third_party/LHM-plusplus/SETUP-NOTES.md`에 적어 둠.
