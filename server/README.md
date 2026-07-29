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
    notifications/        Мэдэгдлийн урсгал         (FR-8, NFR-6)
    searches/             Хадгалсан хайлт           (FR-5.4)
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
| `GET` | `/api/notifications` | Миний мэдэгдлүүд + уншаагүйн тоо 🔒 |
| `POST` | `/api/notifications/:id/read` | Уншсан гэж тэмдэглэх 🔒 |
| `POST` | `/api/notifications/read-all` | Бүгдийг уншсан 🔒 |
| `GET` | `/api/searches` | Хадгалсан хайлтууд 🔒 ажилтан |
| `POST` | `/api/searches` | Хайлт хадгалах 🔒 ажилтан |
| `PATCH` | `/api/searches/:id` | Мэдэгдэл асаах/унтраах 🔒 ажилтан |
| `DELETE` | `/api/searches/:id` | Хайлт устгах 🔒 ажилтан |
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

### Нийтийн зарын самбар

`GET /api/shifts` болон `GET /api/profiles/employers` нь **нэвтрэлт
шаардахгүй**. Зочин ажил хараагүй бол бүртгүүлэх шалтгаангүй.

Зочны хүсэлт нь `shifts` хүснэгт рүү ОГТ хандахгүй — оронд нь
`public_shifts` / `public_employers` view-гээс уншина. Тэдгээр нь:

- зөвхөн `status = 'Active'` зарыг агуулна
- идэвхгүй болгосон ажил олгогчийн зарыг хасна
- регистр, хаяг, ажилтнуудын өгөгдлийг АГУУЛАХГҮЙ

⚠ Эдгээр view-д багана нэмэхээсээ өмнө "үүнийг Google индексжүүлж болох уу?"
гэж өөрөөсөө асуу — тэнд байгаа бүхэн олон нийтэд ил.

### Realtime

Чатын шинэ мессеж болон мэдэгдлийг браузер **Supabase Realtime-аас шууд**
сонсоно (`subscribeToMessages`, `subscribeToNotifications`). Сервер
WebSocket барихгүй тул төлөвгүй (stateless) хэвээр үлдэж, хэвтээ
масштаблахад асуудалгүй. Харах эрхийг RLS шалгана.

Аль хүснэгт realtime-д нэвтрэхийг `20260729000400_realtime_publication.sql`
тодорхойлно — дашбоардаас гараар тохируулбал шинэ орчинд дагаж очихгүй.

### Өгөгдлийн сан дахь автомат ажил

Зарим логик серверт бус өгөгдлийн санд байрлана. Шалтгаан: тэдгээр нь
хүсэлтээс хамааралгүй ажиллах, эсвэл бүх хэрэглэгчийн өгөгдлийг унших
шаардлагатай (RLS-ээс болж серверээс хийх боломжгүй).

| Юу | Хэзээ | Хаана |
|---|---|---|
| Хугацаа өнгөрсөн зар хаах (FR-4.3) | pg_cron, 10 мин тутам | `close_expired_shifts()` |
| Хадгалсан хайлтад мэдэгдэх (FR-5.4) | Зар нэмэгдэхэд | `notify_saved_searches()` триггер |
| Зөвшөөрөгдсөн хүсэлтэд чат нээх (FR-6.4) | Төлөв солигдоход | `auto_open_chat()` триггер |
| Захиалга/түвшний шалгалт | Зар, хүсэлт нэмэгдэхэд | `enforce_shift_quota()`, `enforce_level_requirement()` |

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

## QPay

Интеграц **бүрэн бичигдсэн** бөгөөд мерчант гэрээгүй ч апп ажиллана:
нэхэмжлэл үүсээд дансаар төлөгдөж, админ гараар баталгаажуулна.

### Идэвхжүүлэх

1. QPay-тэй мерчант гэрээ байгуулж `username`, `password`, `invoice_code` авна
2. `.env`-д бөглөнө:
   ```
   QPAY_BASE_URL=https://merchant.qpay.mn/v2
   QPAY_USERNAME=...
   QPAY_PASSWORD=...
   QPAY_INVOICE_CODE=...
   QPAY_CALLBACK_URL=https://таны-домэйн.mn/api/billing/qpay/callback
   ```
3. QPay-ийн мерчант хэсэгт callback хаягаа бүртгүүлнэ
4. Серверээ дахин асаана

Өөр код өөрчлөх шаардлагагүй. Дараагийн "Нэхэмжлэл үүсгэх" дарахад QR
үүсэж, захиалгын хуудсанд шууд харагдана.

### Урсгал

```
Ажил олгогч → POST /billing/invoices
                → request_invoice() (DB)  нэхэмжлэл үүснэ
                → QPay /invoice           QR буцаана
                → QR-ыг invoices-д хадгална (service_role)

Хэрэглэгч QR-ыг банкны аппаар уншиж төлнө

QPay → POST /billing/qpay/callback   "шалга" гэсэн ДОХИО
             ↓
       QPay /payment/check           БИД баталгаажуулна
             ↓
       markPaid()                    захиалга сунгана

Зэрэгцээ: хэрэглэгч "Төлсөн, шалгана уу" дарж болно —
          webhook саатсан ч хүлээхгүй.
```

⚠ Webhook-ийн агуулгад **хэзээ ч итгэхгүй**. Хэн ч бидний webhook рүү
"төлөгдсөн" гэж хүсэлт илгээж чадна. Тиймээс ирсэн мэдэгдлийг зөвхөн
"шалгах цаг боллоо" гэсэн дохио гэж үзээд QPay-ээс өөрөөс нь
`payment/check` хийж баталгаажуулна.

`markPaid` нь `.eq('status', 'pending')` нөхцөлтэй UPDATE хийдэг тул
webhook болон "шалгах" товч зэрэг ажилласан ч захиалга нэг л удаа сунгагдана.

### Тест

Мерчант гэрээгүйгээр логикийг шалгахын тулд `qpay.test.js` нь HTTP давхаргыг
орлуулна (mock): зөвхөн `PAID` мөрийн дүн нэмэгдэх, токен кэшлэгдэх,
нэхэмжлэлийн ID зөв дамжих зэргийг шалгана. Энэ бол мөнгөний зам тул
алдаа гарвал хэрэглэгч төлсөн мөртлөө үйлчилгээ авахгүй болно.
