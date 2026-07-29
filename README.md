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
| `npm run account -- --email … --role admin` | Бүртгэл үүсгэх / шинэчлэх |

Демо бүртгэл: ажилтан `99112233`, ажил олгогч `70112233`, админ `99001122`
(нууц үг бүгд `demo1234`).

## Хавтасны бүтэц

```
src/                  React frontend
  data/queries.js       Өгөгдлийн ЦОРЫН ГАНЦ хандалтын цэг → /api
  data/constants.js     Дүүрэг, ур чадварын жагсаалт
  lib/api.js            HTTP клиент (токен хавсаргана)
  lib/supabase.js       Supabase Auth + Realtime клиент
  hooks/useData.js      Өгөгдөл татах hook-ууд
  pages/                employee / employer / admin

server/               Modular monolith — server/README.md үзнэ үү
  core/                 Хуваалцсан суурь (auth, http, validate, rateLimit)
  modules/              9 домэйн модуль

supabase/migrations/  Өгөгдлийн сангийн схем, RLS, функцууд
tests/                Integration тест (бүтэн урсгал)
```

## Хэрэгжсэн шаардлагууд

| # | Шаардлага | Төлөв |
|---|---|---|
| FR-1 | Бүртгэл, нэвтрэлт (Supabase Auth) | ✅ утас/и-мэйл + нууц үг. SMS OTP ❌ |
| FR-2 | Ажилтны профайл, ур чадвар, боломжит цаг | ✅ |
| FR-3 | Ажил олгогчийн профайл, админы баталгаажуулалт | ✅ |
| FR-4 | Зар үүсгэх, статус, автомат хаалт | ✅ |
| FR-5 | Шүүлт, "надад тохирох", нийтийн зарын самбар | ✅ Газрын зураг ❌ |
| FR-6 | Хүсэлтийн урсгал, чат | ✅ |
| FR-7 | Хоёр талын үнэлгээ, нэгэн зэрэг нээгдэх | ✅ |
| FR-8 | Мэдэгдэл | ⚠ апп доторх ✅, push/SMS ❌ |
| FR-9 | Админ панель, метрик, moderation | ✅ |
| NFR-3 | Утас зөвхөн зөвшөөрөгдсөн талд нээгдэнэ | ✅ |
| NFR-4 | Rate limit, эрхийн шалгалт, оролтын шалгалт | ✅ |
| §8 | Гол flow бүрд integration тест | ✅ |

Хэрэгжээгүй: SMS OTP, FCM push, газрын зураг, QR цаг бүртгэл, escrow төлбөр.

**QPay** нь код талаасаа бүрэн — мерчант гэрээ байгуулаад `.env`-д 5 утга
бөглөхөд QR төлбөр шууд ажиллана ([server/README.md](server/README.md#qpay)).
Тохируулаагүй үед нэхэмжлэл дансаар төлөгдөж, админ баталгаажуулна.
