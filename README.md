# بنيان (bunyan)

منصة سعودية تربط **موردي مواد البناء** بعملاء **المقاولات والمشاريع**. تصفح المواد،
قارن الأسعار، أرسل الطلبات وتابعها، وتواصل مع الموردين داخل المنصة.

## المزايا

- **عملاء (Customers):** تصفح كتالوج المواد، البحث والفلترة حسب المدينة/التصنيف/السعر،
  إنشاء طلبات تصل إلى **منصة بنيان** مع حساب ضريبة القيمة المضافة (15%)، متابعة حالة الطلب،
  المحادثة مع فريق بنيان، وتقييم الخدمة بعد التسليم.
- **موردون (Suppliers):** تسجيل المنشأة (بانتظار اعتماد الإدارة)، إدارة المواد (إضافة/تعديل/
  إخفاء/حذف)، واستقبال الطلبات **التي تعيّنها لها المنصة** وتحديث حالتها.
- **إدارة (Admins):** استقبال جميع الطلبات وتعيين مورد لكل طلب ومتابعتها، اعتماد/رفض/إيقاف
  الموردين، إدارة التصنيفات، وإحصائيات عامة.
- واجهة عربية بالكامل (RTL) مع تنسيق العملة بالريال السعودي.

## آلية الطلبات

1. العميل ينشئ الطلب من صفحة المادة (يصل الطلب وفيه بند المادة الذي اختاره).
2. الطلب يصل إلى **لوحة الإدارة** بحالة «بانتظار تعيين مورد»، والعميل يرى «بنيان» كجهة الطلب
   ويتواصل مع فريقها فقط (لا تظهر هوية المورد للعميل).
3. الإدارة تعدّل **أصناف الطلب** (إضافة/تعديل كمية وسعر/حذف) بحيث يُعاد حساب المجموع والضريبة
   تلقائياً، ثم تعيّن مورداً معتمداً وتضغط **«قبول الطلب»** لاعتماده.
4. بعد قبول الإدارة، يصبح الطلب ظاهراً لدى المورد المعيّن، ويمكنه تحديث مراحل التنفيذ
   (قيد التجهيز → تم الشحن → تم التسليم)، والعميل يتابع الحالة.
   - ملاحظة: لا يمكن تعديل الأصناف أو قبول الطلب إلا من قِبَل الإدارة.

## التقنيات

- [Next.js 16](https://nextjs.org) (App Router، Server Actions) + React 19
- [Prisma 6](https://www.prisma.io) + **SQLite** (قاعدة بيانات ملفية بدون خادم)
- Tailwind CSS v4
- مصادقة مخصّصة بجلسات JWT (`jose`) + تشفير كلمات المرور (`bcryptjs`) عبر الكوكيز وطبقة DAL
- التحقق من المدخلات بـ Zod

## التشغيل محلياً

### 1. المتطلبات

- Node.js 20+ فقط. **لا حاجة لأي قاعدة بيانات خارجية** — تُستخدم SQLite (ملف محلي).

### 2. الإعداد

```bash
npm install
cp .env.example .env
```

القيم الافتراضية في `.env` كافية للتطوير:

```
DATABASE_URL="file:./dev.db"
SESSION_SECRET="<32+ حرف عشوائي>"
```

> غيّر `SESSION_SECRET` في الإنتاج. توليد قيمة سرية:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
> ```

### 3. قاعدة البيانات

```bash
npm run db:generate   # توليد Prisma Client
npm run db:push       # إنشاء ملف قاعدة البيانات prisma/dev.db
npm run db:seed       # إدخال بيانات تجريبية
```

يُنشئ `db:push` الملف `prisma/dev.db` تلقائياً (مُستثنى من git).

### 4. التشغيل

```bash
npm run dev
```

افتح http://localhost:3000

## حسابات تجريبية (بعد `db:seed`)

| الدور   | البريد الإلكتروني       | كلمة المرور      |
| ------- | ----------------------- | ---------------- |
| إدارة   | `om@r.sa`               | `Omar2020@`      |
| عميل    | `customer@bunyan.sa`    | `Customer@12345` |
| مورد    | `alsafa@bunyan.sa`      | `Supplier@12345` |

## الأوامر

| الأمر                | الوصف                                   |
| -------------------- | --------------------------------------- |
| `npm run dev`        | تشغيل خادم التطوير                      |
| `npm run build`      | بناء الإنتاج                            |
| `npm run start`      | تشغيل الإنتاج (مزامنة DB + خادم Next)   |
| `npm run start:next` | تشغيل Next فقط بدون مزامنة DB           |
| `npm run typecheck`  | توليد أنواع المسارات + فحص TypeScript   |
| `npm run lint`       | ESLint                                  |
| `npm run db:push`    | مزامنة المخطط مع قاعدة البيانات         |
| `npm run db:migrate` | إنشاء ترحيل جديد                        |
| `npm run db:seed`    | البيانات التجريبية                      |
| `npm run db:studio`  | Prisma Studio                           |

## البنية

```
prisma/
  schema.prisma        # نماذج البيانات (SQLite)
  seed.ts              # بيانات تجريبية
  dev.db               # ملف قاعدة البيانات (يُنشأ محلياً، مستثنى من git)
scripts/
  prisma-sync.mjs      # اختيار مزوّد قاعدة البيانات (SQLite/Postgres) + التوليد
  start.mjs            # نقطة تشغيل الإنتاج (DB push + إنشاء الإدارة + Next)
  ensure-admin.mjs     # إنشاء حساب الإدارة من متغيّرات البيئة
Dockerfile             # صورة النشر (قرص دائم على /data)
src/
  app/                 # الصفحات (App Router)
    materials/         # الكتالوج وتفاصيل المادة
    suppliers/         # دليل الموردين
    categories/        # التصنيفات
    login/ register/   # المصادقة
    dashboard/         # لوحة العميل
    supplier/          # لوحة المورد
    admin/             # لوحة الإدارة (بما فيها إدارة الطلبات وتعيين الموردين)
  actions/             # Server Actions
  components/          # مكوّنات الواجهة
  lib/                 # prisma، المصادقة، الثوابت، المساعدات
  proxy.ts             # حماية المسارات (Middleware)
```

## ملاحظات حول SQLite

SQLite لا يدعم أنواع `enum` ولا النوع `Decimal` ولا مرشّح `mode: "insensitive"`، لذلك في
`schema.prisma` تُخزَّن الحالات/الأدوار/الوحدات كسلاسل نصية (`String`) والمبالغ كـ `Float`.

### التبديل إلى PostgreSQL

لا حاجة لتعديل المخطط يدوياً: ما عليك سوى ضبط `DATABASE_URL` على رابط `postgres://`، وسيختار
`scripts/prisma-sync.mjs` المزوّد المناسب وينشئ `prisma/schema.generated.prisma` تلقائياً.
النماذج متطابقة (String/Float فقط) والفرق الوحيد هو المزوّد.

## النشر

يدعم التطبيق **وضعين**: SQLite محلياً، وPostgreSQL تلقائياً عندما يكون `DATABASE_URL` رابط
`postgres://`. اختيار المزوّد يتم وقت البناء عبر `scripts/prisma-sync.mjs`.

### أ) Vercel (يتطلب PostgreSQL)

> Vercel لا يوفّر قرصاً دائماً، لذلك **لا يمكن تشغيل SQLite هناك** (رسالة
> `Unable to open the database file`). استخدم قاعدة PostgreSQL مجانية (Vercel Postgres أو Neon).

1. أنشئ قاعدة PostgreSQL من لوحة Vercel (Storage → Postgres) أو من [Neon](https://neon.tech).
2. أضف متغيّرات البيئة في المشروع:
   - `DATABASE_URL` = رابط الـ Postgres (يُفضّل الرابط المُجمَّع/pooled للتشغيل)
   - `DIRECT_URL` = الرابط المباشر (غير المُجمَّع) — يُستخدم لإنشاء الجداول وقت البناء (اختياري لكن مُستحسن مع Neon)
   - `SESSION_SECRET` = نص عشوائي 32+ حرف
   - `ADMIN_EMAIL` و`ADMIN_PASSWORD` (اختياري) لإنشاء حساب الإدارة تلقائياً عند البناء
3. ادفع إلى الفرع المرتبط بـ Vercel. عند `npm run build` يقوم التطبيق بـ:
   `prisma db push` (إنشاء الجداول) ثم إنشاء حساب الإدارة (إن وُجدت المتغيّرات) ثم `next build`.

> ملاحظة: إذا أضفت قاعدة Vercel Postgres/Neon من لوحة Vercel فستُسمّى متغيّراتها
> `POSTGRES_URL` و`POSTGRES_PRISMA_URL` و`POSTGRES_URL_NON_POOLING` بدل `DATABASE_URL`؛
> يتعرّف التطبيق عليها تلقائياً ويستخدم `POSTGRES_URL_NON_POOLING` لإنشاء الجداول.
> تأكّد فقط من ضبط `SESSION_SECRET`.

### ب) استضافة بقرص دائم (Railway / Render / Fly.io / VPS) مع SQLite

المستودع يتضمّن `Dockerfile` جاهزاً يخزّن قاعدة SQLite على مسار `/data`.

```bash
# مثال لخادم VPS
docker build -t bunyan .
docker run -d --name bunyan -p 3000:3000 \
  -v /srv/bunyan-data:/data \
  -e SESSION_SECRET="<سر عشوائي 32+ حرف>" \
  -e ADMIN_EMAIL="om@r.sa" \
  -e ADMIN_PASSWORD="<كلمة مرور قوية>" \
  bunyan
```

- **Railway:** أضف Volume واربطه بـ `/data`، واضبط `DATABASE_URL=file:/data/bunyan.db`.
- **Render:** أضف Disk بنقطة الربط `/data`، وبنفس المتغيّرات.
- **Fly.io:** أنشئ Volume (`fly volumes create bunyan_data`)، واربطه بـ `/data`.

يقوم `npm run start` عند الإقلاع بـ: مزامنة المخطط (`prisma db push`) → إنشاء الإدارة (اختياري)
→ تشغيل Next.js. استخدم `npm run start:next` لتجاوز خطوة مزامنة قاعدة البيانات.

> تأكّد أن مسار `DATABASE_URL` داخل مجلد مُثبَّت بشكل دائم (Persistent Volume)، وإلا فُقدت
> البيانات عند إعادة النشر.
