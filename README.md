# closai.kr

클로세이(closai) 회사 홈페이지. 순수 HTML/CSS/JS 정적 사이트, GitHub Pages로 게시.

## 구조

```
index.html       메인: 히어로 + [진단하기|문의하기] 탭 + 카테고리 카드
products.html    상품 4모델
team.html        팀·조직
log.html         기록(블로그·인스타)
privacy.html     개인정보처리방침
css/style.css    공통 스타일
js/form.js       탭 전환, 3단계 폼, 전송
assets/          로고, 파비콘, OG 이미지
apps-script/     폼 수신용 Google Apps Script
```

빌드 없음. 파일을 고치고 `main`에 push하면 1~2분 뒤 반영된다.

## 로컬에서 보기

```bash
cd closai_site && python3 -m http.server 8000
# http://localhost:8000
```

## 폼 수신 설정 (Google 시트 + Apps Script)

폼은 서버 없이 Apps Script 웹앱으로 JSON을 보낸다. 한 번만 설정하면 된다.

1. Google Drive에서 새 스프레드시트를 만든다. 이름은 `closai 진단·문의 접수` 등 자유.
2. 메뉴 **확장 프로그램 → Apps Script**를 연다.
3. 편집기의 내용을 지우고 `apps-script/Code.gs` 전체를 붙여넣고 저장한다.
4. 오른쪽 위 **배포 → 새 배포** → 유형 **웹 앱** 선택.
   - 설명: `closai form v1`
   - 실행 계정: **나**
   - 액세스 권한: **모든 사용자**
5. **배포**를 누르고 권한 요청을 승인한다(이 계정의 시트·메일 사용 허용).
6. 표시되는 **웹 앱 URL**(`https://script.google.com/macros/s/.../exec`)을 복사한다.
7. 브라우저에서 그 URL을 열어 `closai form endpoint OK`가 보이는지 확인한다.
8. `js/form.js` 맨 위 `var ENDPOINT`에 URL을 넣고 push한다. (2026-09-09 배포 완료: 시트 `closai 진단·문의 접수`, 프로젝트 `closai form`)

이후 제출마다 시트의 `diagnosis` / `contact` 탭에 한 줄이 쌓이고 `claire@closai.kr`, `closai@closai.kr`, `namdalrm@closai.kr`로 알림 메일이 온다. 수신 주소는 `Code.gs`의 `NOTIFY_TO`에서 바꾼다.
스크립트를 고친 뒤에는 **배포 → 배포 관리 → 새 버전**으로 다시 배포해야 반영된다.

## 도메인 (가비아 DNS)

My가비아 → 도메인 → DNS 관리 → 레코드 수정. **MX 레코드(이메일)는 건드리지 않는다.**

| 타입 | 호스트 | 값 |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | nagyeongclairelee.github.io |

확인: `dig +short closai.kr` 이 위 IP를 돌려주면 끝. GitHub Pages 설정에서 Enforce HTTPS를 켠다.

## 배포 후 할 일

- 네이버 서치어드바이저(https://searchadvisor.naver.com)에 `https://closai.kr` 등록, 사이트맵 `https://closai.kr/sitemap.xml` 제출
- 구글 서치콘솔(https://search.google.com/search-console)에 동일하게 등록
- `log.html`의 블로그 링크(`href="#"` 3곳)를 실제 URL로 교체
- `index.html` 히어로의 정의 문장을 확정본으로 교체

## 규칙

- 이 저장소는 **공개**다. 가격, 내부 문서, 개인 전화번호, 계약 정보는 넣지 않는다.
- 회사 문안의 정본은 private 저장소 `closai-docs`다. 여기 문구는 그쪽을 따른다.
