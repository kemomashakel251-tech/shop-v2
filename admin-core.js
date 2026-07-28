// =========================================================
// دكّان — admin-core.js
// تهيئة Firebase (Auth + Firestore) لصفحة الإدارة
// نفس firebaseConfig المستخدم في shared.js — حدّثه من مكان واحد فقط
// =========================================================
let auth = null;
let adminDb = null;
let adminFirebaseReady = false;

async function initAdminFirebase() {
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    adminDb = getFirestore(app);
    adminFirebaseReady = true;
  } catch (e) {
    console.warn("Firebase مش مربوط بعد — لوحة التحكم هتشتغل بوضع المعاينة (بيانات تجريبية، بدون حفظ فعلي).", e);
    adminFirebaseReady = false;
  }
}

async function adminLogin(email, password) {
  if (!adminFirebaseReady) {
    // وضع المعاينة: أي بيانات تدخل الداشبورد مباشرة عشان تقدر تعاين التصميم
    return { ok: true, preview: true };
  }
  try {
    const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    await signInWithEmailAndPassword(auth, email, password);
    return { ok: true, preview: false };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function adminLogout() {
  if (adminFirebaseReady && auth) {
    const { signOut } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    await signOut(auth);
  }
  location.reload();
}
