# 시연용 배포 안내 (Vercel)

의뢰자가 발표할 수 있도록 **인터넷 주소**를 만드는 절차입니다.
같은 저장소를 Vercel에 **두 번** 연결해 참여자용·관리자용 주소를 각각 만듭니다.

```
https://hamkke-apply.vercel.app   ← 참여자 (의뢰자가 시연할 화면)
https://hamkke-admin.vercel.app   ← 관리자 (재단 내부용)
```

> **왜 두 번 올리나요?**
> 무료 `vercel.app` 주소로는 `admin.○○○.vercel.app` 같은 걸 만들 수 없습니다.
> 나중에 도메인을 사면 프로젝트 하나로 합치고 `www.` / `admin.` 으로 갈라도 됩니다.
> 코드는 그대로 두고 환경변수만 바꾸면 되도록 만들어 두었습니다. (`src/proxy.ts`)

---

## 0. 준비물

- GitHub 계정 (이미 있음 — `madongchan/GranteeManagementSystem`)
- Vercel 계정 → [vercel.com](https://vercel.com) 에서 **Continue with GitHub** 으로 가입 (카드 불필요)

> ⚠️ **계정 명의를 먼저 정하세요.** 지금 본인 계정으로 만들었다가 나중에 재단으로 넘기려면 번거롭습니다. 재단 담당 이메일을 받을 수 있으면 처음부터 그쪽으로 만드는 게 낫습니다.

---

## 1. 비밀키 만들기

터미널에서 아래를 실행하고 나온 값을 메모해 둡니다. 두 프로젝트에 **같은 값**을 씁니다.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 2. 참여자 프로젝트 만들기

1. Vercel → **Add New… → Project**
2. `GranteeManagementSystem` 저장소 선택 → **Import**
3. **Root Directory** 를 `web` 으로 변경 ⚠️ *이걸 빼먹으면 빌드가 실패합니다*
4. **Environment Variables** 에 아래를 넣습니다

   | Name | Value |
   |---|---|
   | `AUTH_SECRET` | 1번에서 만든 값 |
   | `SITE_MODE` | `participant` |
   | `ALLOW_DEMO_LOGIN` | `true` |

5. **Deploy** → 2~3분 뒤 주소가 나옵니다
6. Settings → General → **Project Name** 을 `hamkke-apply` 등으로 바꾸면 주소도 바뀝니다

---

## 3. 관리자 프로젝트 만들기

2번과 똑같이 하되 **환경변수 하나만 다릅니다**.

| Name | Value |
|---|---|
| `AUTH_SECRET` | 1번과 **같은 값** |
| `SITE_MODE` | `admin` ← 여기만 다름 |

관리자 화면은 로그인이 없으므로 `ALLOW_DEMO_LOGIN` 은 넣지 않아도 됩니다.

---

## 4. 구글 로그인 켜기 (선택)

체험용 로그인만으로도 시연은 됩니다. 의뢰자가 **자기 구글 계정으로 직접 로그인**하는 모습을 보여주고 싶을 때만 하세요.

1. [console.cloud.google.com](https://console.cloud.google.com) → 프로젝트 만들기
2. **API 및 서비스 → OAuth 동의 화면**
   - User Type: **외부**
   - 앱 이름, 지원 이메일, 개발자 연락처만 채우고 저장
3. **사용자 인증 정보 → 사용자 인증 정보 만들기 → OAuth 클라이언트 ID**
   - 애플리케이션 유형: **웹 애플리케이션**
   - **승인된 리디렉션 URI** 에 아래 둘을 모두 등록
     ```
     http://localhost:3000/api/auth/callback/google
     https://참여자주소.vercel.app/api/auth/callback/google
     ```
4. 발급된 값을 **참여자 프로젝트**의 환경변수에 추가

   | Name | Value |
   |---|---|
   | `GOOGLE_CLIENT_ID` | 클라이언트 ID |
   | `GOOGLE_CLIENT_SECRET` | 클라이언트 보안 비밀번호 |

5. Vercel → Deployments → 맨 위 항목 **⋯ → Redeploy**

> 환경변수를 바꾼 뒤에는 **반드시 재배포**해야 반영됩니다.

---

## 5. 확인할 것

| 확인 | 기대 결과 |
|---|---|
| 참여자 주소 열기 | 사업 공모 목록이 보임 |
| 참여자 주소 + `/admin` | **404** |
| 로그인 없이 `/my` | 로그인 화면으로 이동 |
| 체험용 로그인 | 고른 참여자의 신청 내역이 보임 |
| 관리자 주소 열기 | 대시보드가 보임 |

---

## ⚠️ 실서비스로 넘어가기 전에 반드시

- [ ] `ALLOW_DEMO_LOGIN` 환경변수 **삭제** — 남겨두면 아무나 다른 참여자 계정으로 들어갑니다
- [ ] `src/app/api/auth/demo/route.ts` 파일 삭제
- [ ] 관리자 사이트에 **로그인 + 관리자 권한 확인** 붙이기 — 지금은 주소만 알면 누구나 들어옵니다
- [ ] 데이터를 DB로 옮기기 — 지금은 새로고침하면 모든 입력이 사라집니다

---

## 자주 겪는 문제

**빌드 실패 `Couldn't find any pages or app directory`**
→ Root Directory 가 `web` 으로 되어 있는지 확인하세요.

**구글 로그인에서 `redirect_uri_mismatch`**
→ 구글 콘솔에 등록한 주소와 실제 접속 주소가 정확히 같아야 합니다. `https`, 끝의 `/` 유무까지 확인하세요.

**로그인은 되는데 새로고침하면 풀림**
→ 두 프로젝트의 `AUTH_SECRET` 이 다르거나 비어 있습니다.
