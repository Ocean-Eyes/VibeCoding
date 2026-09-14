# ORBIT

Three.js로 만든 우주 계산기. 정적 파일만 사용하므로 서버나 DB, 빌드 과정이 필요 없습니다.

## 미리보기

이 폴더에서 `python -m http.server 8080` 실행 후 http://localhost:8080 접속.
ES module을 사용하므로 index.html을 더블 클릭하는 대신 HTTP 서버를 사용하세요.

## Vercel 배포

Node.js 설치 후 이 폴더에서:

```sh
npx vercel login
npx vercel --prod --scope auto-nav
```

프로젝트 이름은 `orbit-calculator`, 프레임워크는 `Other`, 경로는 `./`입니다. 빌드 명령 없이 현재 폴더를 배포합니다.
혹은 GitHub 저장소에 이 폴더의 내용을 올리고 https://vercel.com/new?teamSlug=auto-nav 에서 해당 저장소를 Import하세요. Framework Preset은 Other, Build Command는 비워두고 Output Directory는 `.`으로 지정합니다.
배포 성공 후 CLI 또는 대시보드에 표시되는 Production URL이 공유 주소입니다.

## 사용법

- 사칙연산은 일반 계산기처럼 입력 순서대로 계산합니다. `2 + 3 × 4 =` → `20`.
- `%`는 현재 값을 100으로 나눕니다. `200 + 10 % =` → `200.1`.
- Enter: 계산, Escape: 초기화, Backspace: 한 글자 삭제.
- 계산 기록을 누르면 결과를 다시 사용합니다. 최근 8개 기록은 현재 페이지에서만 유지됩니다.
- 행성 드래그: 시점 변경. 랜덤 궤도: 무작위 숫자 입력.
- 모션 끄기 및 운영체제의 동작 줄이기 설정을 지원합니다.
- 12자리 정밀도로 반올림하는 일반 부동소수점 계산기입니다.

Three.js 0.180.0 (MIT), 라이선스: vendor/LICENSE. 글꼴은 Google Fonts에서 불러오며 실패 시 시스템 글꼴을 사용합니다.
