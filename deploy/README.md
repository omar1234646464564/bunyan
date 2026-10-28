# نشر بنيان على Oracle Cloud (Always Free)

دليل نشر مجاني بالكامل: جهاز افتراضي دائم المجانية + Docker + SQLite على قرص دائم.
المشروع يبقى على SQLite، بدون أي ترحيل إلى PostgreSQL.

> Free forever: Oracle Cloud "Always Free" يعطي جهاز `VM.Standard.A1.Flex` (حتى 4 أنوية / 24GB)
> أو `VM.Standard.E2.1.Micro` (1GB). البطاقة مطلوبة للتحقق فقط، ولا يُخصم شيء ما دمت داخل حدود Always Free.

---

## 1. أنشئ الجهاز (Oracle Console)

1. **Compute → Instances → Create instance**
2. **Image and shape**: Ubuntu 24.04 (aarch64) + `VM.Standard.A1.Flex` (1 OCPU / 6 GB يكفي).
   - إن ظهر `Out of host capacity` جرّب Availability Domain آخر أو أعِد المحاولة لاحقًا.
3. **Networking**: اختر/أنشئ VCN، وتأكد أن **Assign a public IPv4 address** مفعّل.
4. **Add SSH keys**: حمّل المفتاح الخاص (`ssh-key-*.key`) واحفظه.
5. اضغط **Create** وانتظر حتى تصبح الحالة **Running**، وسجّل **Public IP address**.

## 2. افتح المنفذين 80 و 443

في Console: **Networking → VCN → Subnets → (subnet) → Security Lists → Default Security List → Add Ingress Rules**

| Source CIDR | IP Protocol | Destination Port Range |
| ----------- | ----------- | ---------------------- |
| `0.0.0.0/0` | TCP         | `80`                   |
| `0.0.0.0/0` | TCP         | `443`                  |
| `0.0.0.0/0` | UDP         | `443`                  |

(سكربت التثبيت يفتح المنافذ داخل الجهاز نفسه عبر `iptables`، لكن قواعد الـ Security List لا يمكن ضبطها إلا من Console.)

## 3. ثبّت المشروع بأمر واحد

```bash
ssh -i ~/ssh-key-2026-10-29.key ubuntu@<PUBLIC_IP>

# على الجهاز:
sudo apt-get update -qq && sudo apt-get install -y -qq git
sudo git clone https://github.com/omar1234646464564/bunyan.git /srv/bunyan
sudo bash /srv/bunyan/deploy/setup.sh
```

السكربت يقوم بكل شيء:

- تثبيت Docker + compose plugin (يدعم arm64).
- إنشاء swap تلقائيًا إن كانت الذاكرة أقل من 3GB (حتى لا يفشل البناء).
- بناء صورة المشروع وتشغيل حاويتين: التطبيق + **Caddy** كـ reverse proxy مع شهادة TLS مجانية.
- توليد `SESSION_SECRET` عشوائي، وكتابة `deploy/.env`.
- فتح 80/443 في `iptables` وحفظها.
- تحميل بيانات العرض (seed) عند أول تشغيل فقط.

### لماذا HTTPS إلزامي؟

`src/lib/auth/session.ts` يضبط الكوكي بـ `secure: true` عندما `NODE_ENV=production`،
فالمتصفح لا يرسلها عبر `http://`. لذلك يستخدم السكربت نطاقًا مجانيًا من [sslip.io](https://sslip.io)
على شكل `129-213-44-7.sslip.io` (يحوّل الشرطات إلى نقاط تلقائيًا) ويصدر له شهادة Let's Encrypt حقيقية
بدون أي حساب أو دومين مدفوع.

## 4. النتيجة

```
URL     https://<PUBLIC_IP_WITH_DASHES>.sslip.io
Admin   om@r.sa / Omar2020@
```

قد تحتاج الشهادة ~30 ثانية عند أول زيارة. لمتابعة السجلات:

```bash
sudo docker compose -f /srv/bunyan/deploy/docker-compose.yml logs -f
```

## التشغيل والصور

```bash
cd /srv/bunyan/deploy
sudo docker compose ps                 # الحالة
sudo docker compose restart app        # إعادة تشغيل التطبيق
sudo docker compose logs -f caddy      # سجلات الشهادة
```

تحديث الموقع بعد أي `git push`:

```bash
sudo bash /srv/bunyan/deploy/setup.sh
```

السكربت idempotent: يسحب آخر كود، يعيد البناء، ويحتفظ بقاعدة البيانات في volume باسم `bunyan-data`.

## نسخة احتياطية

```bash
sudo docker run --rm -v bunyan-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/bunyan-$(date +%F).tar.gz -C /data .
```

## دومين خاص (اختياري)

بدل `sslip.io`، وجّه أي دومين تملكه إلى IP الجهاز (سجل `A`)، ثم:

```bash
SITE_ADDRESS=bunyan.example.com sudo -E bash /srv/bunyan/deploy/setup.sh
```

Caddy سيصدر الشهادة للدومين الجديد تلقائيًا.

## تغيير كلمة مرور المدير

```bash
cd /srv/bunyan/deploy
sudo sed -i 's|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=كلمة-مرور-قوية|' .env
sudo docker compose up -d
```

`scripts/ensure-admin.mjs` يحدّث كلمة المرور عند كل تشغيل للحاوية.

## ملاحظات

- **النسخ الاحتياطي مسؤوليتك**: Always Free قد يستعيد الجهاز الخامل؛ احتفظ بنسخ دورية من الـ volume.
- **الذاكرة**: البناء يحتاج ~1.5GB؛ إن اخترت `E2.1.Micro` سيتكفل swap بذلك لكن سيكون أبطأ.
- **بديل مجاني بدون بطاقة**: غير متاح عمليًا لـ Next.js + قاعدة بيانات دائمة؛ Vercel يحتاج PostgreSQL (انظر القسم في `README.md` الرئيسي).
