# МонголАжил — Backend (Modular Monolith)

Express 5 + Supabase (PostgreSQL). Модуль бүр өөрийн домэйныг бүрэн эзэмшинэ.

## Ажиллуулах

```bash
npm run dev
```

Хоёуланг нь зэрэг асаана:
- API сервер → http://localhost:3001
- Vite frontend → http://localhost:5173 (`/api` хүсэлтийг сервер рүү дамжуулна)

Тусад нь: `npm run dev:api` / `npm run dev:web`.

## Бүтэц

```
server/
  index.js              Сервер асаах (listen)
  app.js                Express апп угсрах — тест үүнийг портгүйгээр импортлоно
  config.js             Орчны хувьсагч + асахдаа шалгах
  core/                 Модулиудын хуваалцдаг суурь
    http.js               ApiError, asyncHandler, unwrap, алдааны нэгдсэн хэлбэр
    auth.js               requireAuth / optionalAuth / requireRole
    supabase.js           admin / anon / asUser клиентүүд
    validate.js           Оролтын шалгалт
    rateLimit.js          Хүсэлтийн хязгаар
  modules/
    index.js              Модулийн БҮРТГЭЛ — шинэ модулийг зөвхөн энд нэмнэ
    shifts/               Зар + хадгалсан ажил      (FR-4)
    applications/         Хүсэлтийн урсгал + урилга (FR-6, FR-13)
    reviews/              Үнэлгээ                   (FR-7)
    profiles/             Профайл, ур чадвар, гоёолт (FR-2, FR-3, NFR-3)
    chat/                 Платформ доторх чат       (FR-6.4)
    gamification/         EXP, түвшин, тэргүүлэгчид
    moderation/           Мэдээлэх, хянах           (FR-9.2)
    employers/            Баталгаажуулах дараалал   (FR-3.2, FR-9.1)
    billing/              Захиалга, нэхэмжлэл, QPay
  scripts/
    seed.js               Демо өгөгдөл оруулах
    createAccount.mjs     Бүртгэл үүсгэх / шинэчлэх
```

### Модулийн дүрэм

Модуль бүр гурван файлтай:

| Файл | Хариуцлага |
|---|---|
| `routes.js` | HTTP — зам, дүрийн шалгалт, rate limit. `{ basePath, router }` экспортлоно |
| `service.js` | Бизнес логик — шалгалт, дүрэм, өгөгдлийн сангийн хандалт |
| `mapper.js` | `snake_case` ↔ `camelCase` хөрвүүлэг (жижиг модульд `service.js` дотор) |

Хамаарал **нэг чиглэлтэй**: `modules → core`. `core` нь модулиудыг мэдэхгүй.
Модулиуд бие биеэ шууд импортлохгүй — шаардлагатай бол `core` руу зөөнө.

Шинэ модуль нэмэх: хавтас үүсгэж, `modules/index.js`-д бүртгэнэ. `app.js`-д
гар хүрэхгүй.

## Аюулгүй байдлын загвар

Сервер нь Postgres руу **гурван өөр эрхээр** ханддаг:

| Клиент | Хэзээ | RLS |
|---|---|---|
| `anon()` | Нэвтрээгүй зочин | Хүчинтэй |
| `asUser(token)` | **Анхдагч.** Нэвтэрсэн хэрэглэгч | Хүчинтэй, `auth.uid()` зөв |
| `admin` | Зөвхөн хэрэглэгчгүй үйлдэл (QPay webhook, төлбөр батлах) | **Тойрно** |

Гол санаа: сервер нь хэрэглэгчийн токеныг Postgres руу дамжуулдаг тул
**RLS хэвээр хүчинтэй**. Хамгаалалт хоёр давхар:

1. **Сервер** — урсгалын дараалал, дүрийн эрх, оролтын шалгалт
2. **Өгөгдлийн сан** — RLS policy, триггер, `security definer` функцууд

`open_chat`, `request_invoice`, `invite_worker` зэрэг функцууд дуудагчийг
`auth.uid()`-ээр таньдаг тул тэднийг `admin`-аар дуудвал ажиллахгүй.

Бусад:
- Дүрийг **токеноос БУС**, өгөгдлийн сангаас уншина (`core/auth.js`) — эс тэгвээс
  хэрэглэгч `user_metadata`-гаа засаж өөрийгөө админ болгоно
- `employer_id`, `worker_id`, `reviewer_id` зэргийг **body-оос хэзээ ч авахгүй**,
  токеноос авна
- JSON биетийн хязгаар 100kb, CORS зөвшөөрөгдсөн домэйнээр
- Rate limit: apply 20/мин, чат 60/мин, нэхэмжлэл 5/мин, мэдээлэх 20/цаг

## API

Бүх зам `/api`-аар эхэлнэ. Хамгаалалттай зам `Authorization: Bearer <supabase access token>` шаардана.

Амжилттай хариу `{ "data": ... }`, алдаа `{ "error": "монгол мессеж" }`.

| Метод | Зам | Тайлбар |
|---|---|---|
| `GET` | `/api/health` | Сервер амьд эсэх |
| `GET` | `/api` | Бүртгэгдсэн модулиуд |
| `GET` | `/api/shifts` | Зарын жагсаалт |
| `GET` | `/api/shifts/saved` | Хадгалсан ажлын ID-ууд 🔒 |
| `GET` | `/api/shifts/:id` | Нэг зар |
| `POST` | `/api/shifts` | Зар нийтлэх 🔒 ажил олгогч |
| `PATCH` | `/api/shifts/:id` | Зар засах 🔒 эзэн |
| `DELETE` | `/api/shifts/:id` | Зар устгах 🔒 эзэн |
| `POST` | `/api/shifts/:id/save` | Хадгалах 🔒 |
| `DELETE` | `/api/shifts/:id/save` | Хадгалснаас хасах 🔒 |
| `GET` | `/api/applications` | Миний хүсэлтүүд 🔒 |
| `POST` | `/api/applications` | Хүсэлт илгээх 🔒 ажилтан |
| `PATCH` | `/api/applications/:id/status` | Төлөв өөрчлөх 🔒 |
| `DELETE` | `/api/applications/:id` | Хүсэлт буцаан татах 🔒 |
| `POST` | `/api/applications/invite` | Ажилтныг урих 🔒 ажил олгогч |
| `GET` | `/api/reviews` | Нээгдсэн үнэлгээнүүд |
| `POST` | `/api/reviews` | Үнэлгээ өгөх 🔒 |
| `GET` | `/api/profiles` | Нийтийн профайлууд (утас, и-мэйлгүй) |
| `GET` | `/api/profiles/admin` | Бүрэн жагсаалт 🔒 админ |
| `GET` | `/api/profiles/employers` | Байгууллагууд |
| `GET` | `/api/profiles/workers` | Ажилтны ур чадварууд |
| `GET` | `/api/profiles/:id/contact` | Утас, и-мэйл 🔒 эрхтэй үед |
| `GET` | `/api/profiles/:id/worker` | Нэг ажилтны ур чадвар |
| `PUT` | `/api/profiles/me/worker` | Ур чадвар, хуваарь хадгалах 🔒 |
| `GET` | `/api/profiles/:id/cosmetics` | Профайлын гоёолт |
| `PUT` | `/api/profiles/me/cosmetics` | Гоёолт хадгалах 🔒 |
| `GET` | `/api/chat/threads` | Миний чатууд 🔒 |
| `POST` | `/api/chat/threads` | Чат нээх 🔒 |
| `GET` | `/api/chat/threads/:id/messages` | Мессежүүд 🔒 |
| `POST` | `/api/chat/threads/:id/messages` | Мессеж илгээх 🔒 |
| `POST` | `/api/chat/threads/:id/read` | Уншсан гэж тэмдэглэх 🔒 |
| `GET` | `/api/gamification/me` | Миний EXP, түвшин 🔒 |
| `GET` | `/api/gamification/ranking?role=` | Тэргүүлэгчид |
| `POST` | `/api/moderation/reports` | Мэдээлэх 🔒 |
| `GET` | `/api/moderation/reports` | Мэдээллүүд 🔒 админ |
| `PATCH` | `/api/moderation/reports/:id` | Шийдвэрлэх 🔒 админ |
| `POST` | `/api/moderation/users/:id/deactivate` | Идэвхгүй болгох 🔒 админ |
| `GET` | `/api/employers/queue` | Баталгаажуулах дараалал 🔒 админ |
| `POST` | `/api/employers/:id/verify` | Баталгаажуулах 🔒 админ |
| `POST` | `/api/employers/:id/reject` | Татгалзах 🔒 админ |
| `GET` | `/api/billing/subscription` | Захиалгын төлөв 🔒 ажил олгогч |
| `GET` | `/api/billing/plan` | Багцын мэдээлэл 🔒 |
| `GET` | `/api/billing/invoices` | Нэхэмжлэлүүд 🔒 |
| `POST` | `/api/billing/invoices` | Төлөх нэхэмжлэл хүсэх 🔒 ажил олгогч |
| `POST` | `/api/billing/invoices/:id/check` | Төлбөр орсон эсэхийг шалгах 🔒 |
| `POST` | `/api/billing/invoices/:id/confirm` | Гараар баталгаажуулах 🔒 админ |
| `POST` | `/api/billing/qpay/callback` | QPay webhook (нэвтрэлтгүй) |

### Realtime

Чатын шинэ мессежийг браузер **Supabase Realtime-аас шууд** сонсоно
(`subscribeToMessages`). Сервер WebSocket барихгүй тул төлөвгүй (stateless)
хэвээр үлдэж, хэвтээ масштаблахад асуудалгүй. Харах эрхийг RLS шалгана.

## Өгөгдлийн сан

Схем нь `supabase/migrations/`-д. Өөрчлөлт оруулах:

```bash
npx supabase db push --linked
```

Демо өгөгдөл (нууц үг `demo1234`):

```bash
npm run db:seed
```

| Дүр | Утас |
|---|---|
| Ажил хайгч | 99112233, 95112233 |
| Ажил олгогч | 70112233, 75112233 |
| Админ | 99001122 |

Шинэ бүртгэл (админ ч үүсгэж болно):

```bash
npm run account -- --email a@gmail.com --password 12345678 --role admin --name "Нэр"
```

## Тест

```bash
npm test
```

- **Unit** — оролтын шалгалт, rate limit, хүсэлтийн урсгалын дүрэм
- **Integration** — бодит Supabase рүү ханддаг. Зар нийтлэх → хүсэлт →
  зөвшөөрөх → чат → дуусгах → үнэлгээ гэсэн **бүтэн урсгалыг** шалгана
  (Хүлээн авах шалгуур §8). Тест өөрийн үүсгэсэн өгөгдлөө цэвэрлэнэ.

`.env` дутуу бол integration тестүүд алгасагдана.

## Тохиргоо

`.env.example`-г `.env` болгон хуулна. Заавал:

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Дутуу бол сервер асахдаа тодорхой алдаа өгөөд зогсоно.

Продакшнд нэмж: `CORS_ORIGINS=https://таны-домэйн.mn`, `NODE_ENV=production`.

QPay нь заавал биш — тохируулаагүй үед нэхэмжлэл дансаар төлөгдөж, админ
гараар баталгаажуулна.
