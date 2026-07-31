# МонголАжил

Оюутан, цагийн ажил хайгчдыг ажил олгогчтой холбох **ээлж (shift) дээр
суурилсан** marketplace. Дипломын ажил.

## Архитектур

```
Браузер (React PWA)
      │
      │  HTTPS  /api/*
      ▼
Modular Monolith (Express 5)          ← бизнес логик, эрхийн шалгалт, QPay
      │
      │  хэрэглэгчийн токеноор
      ▼
PostgreSQL (Supabase)                 ← RLS, триггер, security definer функцууд
      ▲
      │  WebSocket (зөвхөн чатын шинэ мессеж)
      └──────────────── Браузер
```

**Гол зарчим: хамгаалалт хоёр давхар.**

Сервер нь өгөгдлийн сан руу хандахдаа `service_role` биш, **хэрэглэгчийн
токеныг** дамжуулдаг. Тиймээс:

- **Сервер** нь урсгалын дараалал (`applied → approved → in-progress → completed`),
  дүрийн эрх, оролтын шалгалт, гадаад төлбөрийн үйлчилгээг хариуцна
- **Өгөгдлийн сан** нь "энэ хэрэглэгч энэ мөрийг харах/засах эрхтэй юу" гэдгийг
  RLS-ээр шалгана

Аль нэг давхаргад алдаа гарсан ч нөгөө нь барина. Сервер нэмснээр RLS
сулраагүй — дээр нь нэг давхар нэмэгдсэн.

Дэлгэрэнгүйг [`server/README.md`](server/README.md) үзнэ үү.

## Ажиллуулах

```bash
npm install
cp .env.example .env    # Supabase түлхүүрээ бөглөнө
npm run db:seed         # демо өгөгдөл (нууц үг: demo1234)
npm run dev
```

- Frontend → http://localhost:5173
- API → http://localhost:3001

| Тушаал | Үйлдэл |
|---|---|
| `npm run dev` | API + frontend хоёуланг зэрэг |
| `npm run dev:api` / `npm run dev:web` | Тусад нь |
| `npm test` | Unit + integration тест |
| `npm run build` | Frontend production build |
| `npm run db:seed` | Демо өгөгдөл |
| `npm run db:refresh` | Демо зарын хугацааг шинэчилнэ (үзүүлбэрийн өмнө) |
| `npm run account -- --email … --role admin` | Бүртгэл үүсгэх / шинэчлэх |

Демо бүртгэл: ажилтан `99112233`, ажил олгогч `70112233`, админ `99001122`
(нууц үг бүгд `demo1234`).

> ⚠ **Демо өгөгдөл хугацаатай.** Зарууд seed хийсэн мөчөөс хойших огноотой
> үүсдэг тул хэдэн хоногийн дараа хугацаа хэтэрч, автомат хаалт (FR-4.3)
> тэднийг хаана — зарын самбар хоосорно. Үзүүлбэрийн өмнө `npm run db:refresh`
> ажиллуулна уу. Энэ нь юу ч устгахгүй, зөвхөн огноог урагшлуулна.

## Deploy (Vercel)

Frontend болон API **нэг Vercel төсөл дээр** байрлана. `createApp()` нь
`listen()`-ээс тусдаа тул монолит нь serverless функц болж ажиллана —
кодод өөрчлөлт хийх шаардлагагүй.

```
Vercel
├── dist/            статик SPA
└── api/index.js     Express монолит бүхэлдээ (serverless)
```

Нэг домэйн дээр байгаа тул **CORS шаардлагагүй**, `VITE_API_URL`-ыг
хоосон орхино (`/api` руу харина).

### Алхмууд

1. Repo-г Vercel-д холбоно (Import Git Repository)
2. Build тохиргоог `vercel.json` уншина — гар хүрэх шаардлагагүй
3. Settings → Environment Variables:

   | Хувьсагч | Тайлбар |
   |---|---|
   | `SUPABASE_URL` | Сервер тал |
   | `SUPABASE_ANON_KEY` | Сервер тал |
   | `SUPABASE_SERVICE_ROLE_KEY` | ⚠ Зөвхөн сервер. `VITE_` угтвар БҮҮ хэрэглэ |
   | `VITE_SUPABASE_URL` | Браузер тал |
   | `VITE_SUPABASE_ANON_KEY` | Браузер тал |
   | `QPAY_*` | Мерчант гэрээ байгуулсны дараа |

4. Deploy

Дутуу хувьсагч байвал функц асахдаа аль нь дутуугаа бүртгэлд тодорхой бичнэ.

### Serverless-ийн хязгаарлалт

`core/rateLimit.js` нь санах ойд түшдэг тул хязгаар **instance тус бүрд**
тусдаа тоологдоно. Vercel олон instance үүсгэвэл бодит хязгаар өснө.
Ачаалал ихсэх үед Redis эсвэл Postgres руу зөөнө — модулийн интерфэйс
хэвээр үлдэх тул дуудагч код өөрчлөгдөхгүй.

## Android апп (Capacitor)

Вэб хувилбартай **ижил кодыг** native бүрхүүлд ороож `.apk` гаргана. React
код дахин бичигдээгүй — зөвхөн апп доторх ялгааг `src/config/runtime.js`
төвлөрүүлж шийднэ.

### Юу өөр байдаг вэ

| Асуудал | Вэб | Апп |
|---|---|---|
| Хуудасны origin | жинхэнэ домэйн | `https://localhost` |
| API хаяг | `/api` (нэг домэйн) | бүтэн хаяг (`runtime.js`) |
| И-мэйлийн линк | `window.location.origin` | `VITE_PUBLIC_WEB_URL` |
| Google нэвтрэлт | ижил цонх, implicit | Custom Tab + PKCE + deep link |
| Дэлгэцийн ирмэг | — | `--sa-top/--sa-bottom` аюулгүй зай |
| Буцах товч | хөтчийн | `NativeBridge` → router |

### Командууд

```bash
npm run app:sync     # vite build → android руу хуулах
npm run app:open     # Android Studio нээх (суулгасан бол)
npm run app:icons    # assets/*.png → бүх хэмжээний icon/splash
```

`assets/` доторх эх зургийг `node scripts/generate-app-assets.mjs` үүсгэнэ
(лого солих бол тэр файлыг засна).

### `.apk` бүтээх

Локал компьютерт JDK 21 + Android SDK хэрэгтэй. Тэдгээргүйгээр
**GitHub Actions** (`.github/workflows/android.yml`) үүлэн дээр бүтээнэ:
`main` руу push хийх эсвэл Actions хуудаснаас гараар ажиллуулаад,
дууссаны дараа `ajil-debug-apk` артефактыг татна.

### Нэг удаагийн тохиргоо

1. **GitHub → Settings → Secrets and variables → Actions**
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` нэмнэ.
2. **Supabase → Authentication → URL Configuration → Redirect URLs**
   `mn.ajil.app://auth-callback` нэмнэ (Google-ээр нэвтрэхэд).

Серверийн CORS тал бэлэн — `server/config.js` нь аппын тогтмол origin-уудыг
үргэлж зөвшөөрдөг тул Vercel дээр юу ч өөрчлөх шаардлагагүй.

## Хавтасны бүтэц

```
android/              Capacitor-ийн Android төсөл (generated + гар засвар)
assets/               Аппын icon/splash-ийн ЭХ зураг

src/                  React frontend
  data/queries.js       Өгөгдлийн ЦОРЫН ГАНЦ хандалтын цэг → /api
  data/constants.js     Дүүрэг, ур чадварын жагсаалт
  lib/api.js            HTTP клиент (токен хавсаргана)
  lib/supabase.js       Supabase Auth + Realtime клиент
  config/runtime.js     Вэб vs. апп-ын ялгааг шийдэх ЦОРЫН ГАНЦ газар
  components/NativeBridge.jsx  Буцах товч, deep link, splash
  hooks/useData.js      Өгөгдөл татах hook-ууд
  pages/                employee / employer / admin

server/               Modular monolith — server/README.md үзнэ үү
  core/                 Хуваалцсан суурь (auth, http, validate, rateLimit)
  modules/              11 домэйн модуль

supabase/migrations/  Өгөгдлийн сангийн схем, RLS, функцууд
tests/                Integration тест (бүтэн урсгал)
```

## Хэрэгжсэн шаардлагууд

| # | Шаардлага | Төлөв |
|---|---|---|
| FR-1 | Бүртгэл, нэвтрэлт, нууц үг сэргээх, Google OAuth | ✅ SMS OTP ❌ |
| FR-2 | Ажилтны профайл, ур чадвар, боломжит цаг | ✅ |
| FR-3 | Ажил олгогчийн профайл, админы баталгаажуулалт | ✅ |
| FR-4 | Зар үүсгэх, төлөв удирдах, автомат хаалт (pg_cron, 10 мин тутам) | ✅ |
| FR-5 | Шүүлт, "надад тохирох", газрын зураг, хадгалсан хайлт, нийтийн самбар | ✅ |
| FR-6 | Хүсэлтийн урсгал, чат | ✅ |
| FR-7 | Хоёр талын үнэлгээ, нэгэн зэрэг нээгдэх | ✅ |
| FR-8 | Мэдэгдэл — хонх, уншсан тэмдэглэх, realtime | ✅ Push (FCM) / SMS ❌ |
| FR-9 | Админ панель, метрик, moderation, ажил олгогч батлах | ✅ |
| NFR-3 | Утас зөвхөн зөвшөөрөгдсөн талд нээгдэнэ | ✅ |
| NFR-4 | Rate limit, эрхийн шалгалт, оролтын шалгалт | ✅ |
| §8 | Гол flow бүрд integration тест | ✅ |

Хэрэгжээгүй: SMS OTP, FCM push, QR цаг бүртгэл, escrow төлбөр (Үе шат 2).

**QPay** нь код талаасаа бүрэн — мерчант гэрээ байгуулаад `.env`-д 5 утга
бөглөхөд QR төлбөр шууд ажиллана ([server/README.md](server/README.md#qpay)).
Тохируулаагүй үед нэхэмжлэл дансаар төлөгдөж, админ баталгаажуулна.
