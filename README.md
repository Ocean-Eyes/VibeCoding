# DUST / DRIVE

Three.js 자동차 주행 게임. 사막 서킷에서 자유롭게 운전할 수 있습니다.

Blender 4.5에서 제작한 쿠페 차체·휠·사암 모델을 GLB로 불러옵니다. 웹 실시간 렌더링은 Three.js가 담당하며, 금속 도장·유리 반사, 자연광 환경 맵, 차량을 따라가는 그림자와 아스팔트·모래 질감을 적용합니다.

- WASD / 방향키: 가속, 브레이크·후진, 조향
- Space: 핸드브레이크
- C: 추적 / 상공 카메라
- R: 차량 위치와 현재 주행 기록 초기화
- P / Escape: 일시정지
- 모바일: 화면 하단 버튼

시계 방향으로 서킷의 체크포인트를 순서대로 통과하면 랩을 기록합니다. 최고 기록은 현재 브라우저에 저장합니다. 노면 밖에서는 속도가 감소하며 바위와 선인장에 충돌합니다. 탭을 전환하면 자동으로 일시정지합니다.

## 로컬 실행

`preview.cmd` 실행 또는 `python -m http.server 8080 --bind 127.0.0.1` 후 http://localhost:8080 접속.

## Vercel

저장소를 Import하고 Framework Preset을 Other, Root Directory를 ./, Output Directory를 .으로 지정하세요. Build Command는 필요 없습니다. GitHub와 연결된 Vercel 프로젝트는 main 푸시 후 자동 배포됩니다.

외부 서버·API 키·빌드 도구 없이 정적 파일로 실행합니다. Three.js 0.180.0, MIT 라이선스는 vendor/LICENSE에 있습니다.

## Blender 원본 수정

`art/dust-coupe.blend`에서 원본을 열 수 있습니다. `blender --background --python art/build_assets.py`로 모델과 GLB를 다시 생성합니다. Blender 공식 bpy 4.5 패키지를 설치한 Python 3.11에서도 스크립트를 실행할 수 있습니다.

차체와 바퀴를 별도로 내보내므로 조향과 회전 애니메이션을 유지합니다. 런타임에는 Blender 설치가 필요 없습니다. 아트 원본은 GitHub에 보관하고 Vercel 배포에서는 제외합니다.
