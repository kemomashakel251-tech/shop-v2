// =========================================================
// دكّان — admin-settings.js
// إعدادات عامة للمتجر (اسم، واتساب، رسالة الهيدر) — تُخزَّن في
// مستند واحد settings/store بدل كولكشن كامل، لأنها بيانات ثابتة.
// =========================================================
async function loadAdminSettings() {
  let settings = { storeName: "دكّان", whatsapp: "201000000000", heroText: "منتجات محلية أصيلة توصلك لبيتك" };

  if (adminFirebaseReady && adminDb) {
    try {
      const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      const snap = await getDoc(doc(adminDb, "settings", "store"));
      if (snap.exists()) settings = { ...settings, ...snap.data() };
    } catch (e) {
      console.warn("تعذر تحميل الإعدادات من Firestore.", e);
    }
  }

  document.getElementById("setStoreName").value = settings.storeName;
  document.getElementById("setWhatsapp").value = settings.whatsapp;
  document.getElementById("setHeroText").value = settings.heroText;
}

async function saveAdminSettings(e) {
  e.preventDefault();
  const data = {
    storeName: document.getElementById("setStoreName").value,
    whatsapp: document.getElementById("setWhatsapp").value,
    heroText: document.getElementById("setHeroText").value,
  };

  if (adminFirebaseReady && adminDb) {
    const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    await setDoc(doc(adminDb, "settings", "store"), data, { merge: true });
    alert("تم حفظ الإعدادات بنجاح ✓");
  } else {
    alert("وضع المعاينة: الإعدادات مش هتتحفظ فعلياً لحد ما تربط Firebase.");
  }
}
