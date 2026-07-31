# ميزان — متجر إلكتروني بسيط (Firebase Spark - مجاني بالكامل)

موقع تجارة إلكترونية جاهز، بدون سيرفر خلفي (backend) — بيشتغل بالكامل على
**HTML/CSS/JS + Firestore + Firebase Hosting**، ومناسب 100% لخطة Firebase
المجانية (Spark)، لأنه مش محتاج Cloud Functions ولا أي فوترة.

## الصفحات
- `index.html` — واجهة المتجر (عرض المنتجات، الفلترة بالقسم، سلة المشتريات)
- `product.html` — صفحة تفاصيل منتج واحد
- `checkout.html` — إتمام الطلب (دفع عند الاستلام أو تأكيد واتساب)
- `admin.html` — لوحة تحكم صاحب المتجر (منتجات، طلبات، إعدادات)

## معاينة سريعة بدون Firebase
افتح `index.html` مباشرة في المتصفح (أو ارفعه على Firebase Hosting) — هيشتغل
فوراً ببيانات تجريبية (منتجات وهمية) عشان تقدر تعاين الشكل والتصميم قبل ما
تربطه بحسابك الحقيقي.

## خطوات ربط Firebase الفعلي

### 1. أنشئ مشروع Firebase
روح على https://console.firebase.google.com → **Add project** → اتبع الخطوات
(الخطة المجانية Spark تكفي بالكامل).

### 2. فعّل الخدمات المطلوبة
- **Firestore Database** → Create database → ابدأ في وضع "production mode"
- **Authentication** → Sign-in method → فعّل **Email/Password**
  (ده هيكون تسجيل دخول صاحب المتجر بس، مش العملاء)
- **Hosting** → Get started

### 3. اعمل حساب أدمن واحد
من Authentication → Users → **Add user** → حط إيميل وباسورد، وده اللي
هتدخل بيه على `admin.html`.

### 4. هات بيانات الربط (Firebase Config)
من Project settings (⚙️ فوق شمال) → Your apps → أضف **Web app** (</> icon) →
هيديك كود فيه `firebaseConfig` زي كده:
```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

### 5. حط البيانات دي في مكانين بالظبط
- `js/shared.js` (أول 10 سطور تقريباً)
- `js/admin-core.js` (نفس الكود، انسخه هناك كمان)

### 6. ارفع قواعد الأمان (Firestore Rules)
```bash
firebase login
firebase init firestore   # اختار نفس المشروع، وسيب firestore.rules زي ما هو
firebase deploy --only firestore:rules
```

### 7. انشر الموقع
```bash
firebase init hosting   # اختار "." كمجلد public، ولا تستبدل index.html
firebase deploy --only hosting
```
هيديك رابط زي: `https://your-project.web.app`

## ملاحظات مهمة
- **بدون بوابة دفع أونلاين حالياً**: الموقع مبني على "الدفع عند الاستلام" أو
  "تأكيد الطلب عبر واتساب" — دول أبسط حل يشتغل بالكامل بدون Cloud Functions
  أو خطة مدفوعة. لو حبيت تضيف فيزا/فودافون كاش لاحقاً، هيحتاج ترقية لخطة
  Blaze (لسه بيبقى فيها استخدام مجاني، بس محتاج تفعيل الفوترة).
- **رقم الواتساب الافتراضي وهمي** (`201000000000`) — غيّره من قسم الإعدادات
  في لوحة التحكم بعد ما تربط Firebase، أو مباشرة في `checkout.html`.
- **الصور حالياً روابط Unsplash تجريبية** — لما تضيف منتجاتك الحقيقية من
  لوحة التحكم، حط رابط صورة منتجك (أسهل حل: ارفع الصورة على أي مكان زي
  imgbb.com وانسخ الرابط المباشر).
