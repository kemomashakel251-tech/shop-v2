/* =========================================================
   shared.js — إعدادات Firebase + Cloudinary + السلة + دوال مشتركة
   ========================================================= */

/* -----------------------------------------------------------
   1) إعدادات Firebase
   ----------------------------------------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyCdUoMyIrrkHLJ0aw8f4C9m5x5uGUCE9Dk",
  authDomain: "matgari-530da.firebaseapp.com",
  projectId: "matgari-530da",
  storageBucket: "matgari-530da.firebasestorage.app",
  messagingSenderId: "104981908529",
  appId: "1:104981908529:web:efcee44f967e64de80d910"
};

const IS_CONFIGURED = firebaseConfig.apiKey !== "YOUR_API_KEY";

let db = null;
if (IS_CONFIGURED) {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
}

/* -----------------------------------------------------------
   1.b) إعدادات Cloudinary (رفع صور وفيديوهات المنتجات مجانًا)
   ----------------------------------------------------------- */
const CLOUDINARY_CONFIG = {
  cloudName: "ux58o5sr",
  uploadPreset: "h8wskyp1"
};
const CLOUDINARY_CONFIGURED = CLOUDINARY_CONFIG.cloudName !== "YOUR_CLOUD_NAME";

async function uploadToCloudinary(file, onProgress) {
  if (!CLOUDINARY_CONFIGURED) throw new Error("لسه معملتش ربط Cloudinary — راجع shared.js وREADME.md");
  const isVideo = file.type.startsWith("video/");
  const resourceType = isVideo ? "video" : "image";
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => { if (onProgress && e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (res.secure_url) resolve({ url: res.secure_url, type: resourceType });
        else reject(new Error((res.error && res.error.message) || "فشل الرفع"));
      } catch (e) { reject(new Error("فشل الرفع")); }
    };
    xhr.onerror = () => reject(new Error("فشل الاتصال أثناء الرفع"));
    xhr.send(formData);
  });
}

/* -----------------------------------------------------------
   2) تنسيق السعر
   ----------------------------------------------------------- */
function formatPrice(num) {
  const n = Number(num) || 0;
  return n.toLocaleString("ar-EG") + " ج.م";
}

/* -----------------------------------------------------------
   3) كاش بسيط في localStorage — بيقلل قراءات Firestore
   ----------------------------------------------------------- */
const CACHE_TTL = 10 * 60 * 1000; /* 10 دقايق */
function cacheGet(key, ttlMs) {
  try {
    const raw = localStorage.getItem("cache_" + key);
    if (!raw) return null;
    const { t, v } = JSON.parse(raw);
    if (Date.now() - t > ttlMs) return null;
    return v;
  } catch (e) { return null; }
}
function cacheSet(key, value) {
  try { localStorage.setItem("cache_" + key, JSON.stringify({ t: Date.now(), v: value })); } catch (e) {}
}
function cacheClear(key) {
  try { localStorage.removeItem("cache_" + key); } catch (e) {}
}

/* -----------------------------------------------------------
   4) السلة (localStorage)
   بنية العنصر: { lineId, id, name, price, image, qty, color, size,
                  qtyDiscountThreshold, qtyDiscountPercent }
   ----------------------------------------------------------- */
const CART_KEY = "store_cart_v1";

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch (e) { return []; }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}
function makeLineId(productId, color, size) {
  return [productId, color || "", size || ""].join("::");
}
function addToCart(product, qty = 1, variant = {}) {
  const cart = getCart();
  const lineId = makeLineId(product.id, variant.color, variant.size);
  const existing = cart.find((i) => i.lineId === lineId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      lineId,
      id: product.id,
      name: product.name,
      price: product.price,
      image: (product.images && product.images[0]) || product.image || "",
      qty: qty,
      color: variant.color || "",
      size: variant.size || "",
      qtyDiscountThreshold: product.qtyDiscountThreshold || null,
      qtyDiscountPercent: product.qtyDiscountPercent || null
    });
  }
  saveCart(cart);
  bounceCartBubble();
}
function removeFromCart(lineId) {
  saveCart(getCart().filter((i) => i.lineId !== lineId));
}
function setQty(lineId, qty) {
  const cart = getCart();
  const item = cart.find((i) => i.lineId === lineId);
  if (item) { item.qty = Math.max(1, qty); saveCart(cart); }
}
function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}
function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}
function updateCartBadge() {
  const badge = document.getElementById("cart-count");
  if (badge) badge.textContent = cartCount();
}
function bounceCartBubble() {
  const bubble = document.getElementById("cart-fab");
  if (!bubble) return;
  bubble.classList.remove("bounce");
  void bubble.offsetWidth;
  bubble.classList.add("bounce");
}

/* ---------- خصم الكمية على مستوى السطر الواحد في السلة ---------- */
function lineEffectivePrice(item) {
  if (item.qtyDiscountThreshold && item.qtyDiscountPercent && item.qty >= item.qtyDiscountThreshold) {
    return Math.round(item.price * (1 - item.qtyDiscountPercent / 100));
  }
  return item.price;
}
function cartSubtotal() {
  return getCart().reduce((sum, i) => sum + lineEffectivePrice(i) * i.qty, 0);
}

/* -----------------------------------------------------------
   5) الشحن حسب المحافظة (settings/shipping)
   ----------------------------------------------------------- */
async function getShippingRates() {
  if (!IS_CONFIGURED) return { cities: {}, default: 0 };
  try {
    const doc = await db.collection("settings").doc("shipping").get();
    if (doc.exists) return doc.data();
  } catch (e) {}
  return { cities: {}, default: 0 };
}
function getShippingFee(rates, city) {
  if (!city) return rates.default || 0;
  const match = Object.keys(rates.cities || {}).find((c) => c.trim() === city.trim());
  return match ? rates.cities[match] : rates.default || 0;
}

/* -----------------------------------------------------------
   6) الكوبونات
   ----------------------------------------------------------- */
async function validateCoupon(code) {
  if (!code || !IS_CONFIGURED) return null;
  try {
    const doc = await db.collection("coupons").doc(code.trim().toUpperCase()).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (!data.active) return null;
    return { code: doc.id, ...data };
  } catch (e) { return null; }
}
function applyCouponToTotal(subtotal, coupon) {
  if (!coupon) return 0;
  if (coupon.minOrder && subtotal < coupon.minOrder) return 0;
  if (coupon.type === "percent") return Math.round((subtotal * coupon.value) / 100);
  return Math.min(coupon.value, subtotal);
}

/* -----------------------------------------------------------
   7) المنتجات (مع كاش لتقليل القراءات)
   ----------------------------------------------------------- */
async function getProductsCached() {
  const cached = cacheGet("products_list", CACHE_TTL);
  if (cached) {
    /* بيرجع الكاش فورًا، وبيحدثه في الخلفية بهدوء من غير ما يعطل الصفحة */
    refreshProductsInBackground();
    return cached;
  }
  return await fetchProductsFresh();
}
async function fetchProductsFresh() {
  const snap = await db.collection("products").orderBy("createdAt", "desc").get();
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  cacheSet("products_list", list);
  return list;
}
function refreshProductsInBackground() {
  fetchProductsFresh().catch(() => {});
}
function clearProductsCache() { cacheClear("products_list"); }

/* -----------------------------------------------------------
   8) الإعدادات العامة (settings/general) + الأسئلة الشائعة (settings/faq)
   ----------------------------------------------------------- */
const SETTINGS_DEFAULTS = {
  storeName: "متجري",
  logoUrl: "",
  seoTitle: "متجري — تسوق أونلاين",
  seoDescription: "تسوق أفضل المنتجات أونلاين بأسعار مناسبة وتوصيل سريع.",
  aboutText: "",
  shippingPolicyText: "",
  whatsappNumber: "",
  facebookUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  vodafoneCashEnabled: false,
  vodafoneCashNumber: "",
  instapayEnabled: false,
  instapayNumber: "",
  metaPixelId: "",
  gaId: "",
  customHeadCode: ""
};

async function getSettings() {
  const cached = cacheGet("settings_general", CACHE_TTL);
  if (cached) return cached;
  if (!IS_CONFIGURED) return SETTINGS_DEFAULTS;
  try {
    const doc = await db.collection("settings").doc("general").get();
    const data = { ...SETTINGS_DEFAULTS, ...(doc.exists ? doc.data() : {}) };
    cacheSet("settings_general", data);
    return data;
  } catch (e) {
    return SETTINGS_DEFAULTS;
  }
}
function clearSettingsCache() { cacheClear("settings_general"); }

async function getFaqItems() {
  const cached = cacheGet("faq_items", CACHE_TTL);
  if (cached) return cached;
  if (!IS_CONFIGURED) return [];
  try {
    const doc = await db.collection("settings").doc("faq").get();
    const items = doc.exists ? doc.data().items || [] : [];
    cacheSet("faq_items", items);
    return items;
  } catch (e) {
    return [];
  }
}

/* -----------------------------------------------------------
   9) الهيدر والفوتر المشتركين
   ----------------------------------------------------------- */
function renderHeader(storeName, logoUrl) {
  const header = document.getElementById("site-header");
  if (!header) return;
  header.innerHTML = `
    <div class="header-inner">
      <a href="index.html" class="logo">${logoUrl ? `<img src="${logoUrl}" style="height:34px; vertical-align:middle; margin-left:8px;">` : ""}${storeName}</a>
      <a href="checkout.html" class="cart-fab" id="cart-fab">🛒 <span id="cart-count">0</span></a>
    </div>
  `;
  updateCartBadge();
}

function renderFooter(settings) {
  const footer = document.getElementById("site-footer");
  if (!footer) return;
  const social = [
    settings.facebookUrl ? `<a href="${settings.facebookUrl}" target="_blank" rel="noopener">فيسبوك</a>` : "",
    settings.instagramUrl ? `<a href="${settings.instagramUrl}" target="_blank" rel="noopener">إنستجرام</a>` : "",
    settings.tiktokUrl ? `<a href="${settings.tiktokUrl}" target="_blank" rel="noopener">تيك توك</a>` : ""
  ].filter(Boolean).join(" · ");

  footer.innerHTML = `
    <div class="footer-links">
      <a href="about.html">من نحن</a>
      <a href="shipping-policy.html">سياسة الشحن والاستبدال</a>
    </div>
    ${social ? `<div class="footer-social">${social}</div>` : ""}
    <p>© <span id="footer-year"></span> ${settings.storeName || "متجري"} — جميع الحقوق محفوظة</p>
  `;
  document.getElementById("footer-year").textContent = new Date().getFullYear();
}

/* ---------- زرار واتساب عائم ---------- */
function renderWhatsAppFab(number) {
  if (!number || document.getElementById("wa-fab")) return;
  const a = document.createElement("a");
  a.id = "wa-fab";
  a.className = "wa-fab";
  a.target = "_blank";
  a.rel = "noopener";
  a.href = `https://wa.me/${number}`;
  a.innerHTML = "💬";
  a.title = "تواصل معنا عبر واتساب";
  document.body.appendChild(a);
}

function buildWhatsAppOrderLink(order, number) {
  const lines = [
    `طلب جديد من ${order.customerName}`,
    `📱 ${order.phone}`,
    `📍 ${order.city} - ${order.address}`,
    "",
    ...order.items.map((i) => {
      const variant = [i.color, i.size].filter(Boolean).join(" / ");
      return `• ${i.name}${variant ? ` (${variant})` : ""} × ${i.qty}`;
    }),
    "",
    `طريقة الدفع: ${order.paymentMethod || "الدفع عند الاستلام"}`,
    `الشحن: ${formatPrice(order.shipping || 0)}`,
    order.discount ? `الخصم: -${formatPrice(order.discount)}` : "",
    `الإجمالي: ${formatPrice(order.total)}`
  ].filter(Boolean);
  if (order.notes) lines.push(`ملاحظات: ${order.notes}`);
  return `https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`;
}

/* ---------- أسئلة شائعة (بديل روبوت الرد) ---------- */
function renderFaqWidget(faqList) {
  if (!faqList || faqList.length === 0) return;
  if (document.getElementById("faq-fab")) return;

  const fab = document.createElement("button");
  fab.id = "faq-fab";
  fab.className = "faq-fab";
  fab.innerHTML = "🗨️";
  fab.title = "أسئلة شائعة";

  const panel = document.createElement("div");
  panel.id = "faq-panel";
  panel.className = "faq-panel hidden";
  panel.innerHTML = `
    <div class="faq-panel-header"><span>أسئلة شائعة</span><button id="faq-close" type="button">×</button></div>
    <div class="faq-panel-body">
      ${faqList.map((item, idx) => `
        <button type="button" class="faq-question" data-idx="${idx}">${item.q}</button>
        <div class="faq-answer hidden" id="faq-answer-${idx}">${item.a}</div>
      `).join("")}
    </div>
  `;
  document.body.appendChild(fab);
  document.body.appendChild(panel);
  fab.addEventListener("click", () => panel.classList.toggle("hidden"));
  panel.querySelector("#faq-close").addEventListener("click", () => panel.classList.add("hidden"));
  panel.querySelectorAll(".faq-question").forEach((btn) => {
    btn.addEventListener("click", () => document.getElementById("faq-answer-" + btn.dataset.idx).classList.toggle("hidden"));
  });
}

/* ---------- أكواد التتبع (Meta Pixel / GA) + كود هيدر مخصص ---------- */
function injectTrackingCodes(settings) {
  if (settings.metaPixelId) {
    const s = document.createElement("script");
    s.innerHTML = `
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
      document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${settings.metaPixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(s);
  }
  if (settings.gaId) {
    const s1 = document.createElement("script");
    s1.async = true;
    s1.src = `https://www.googletagmanager.com/gtag/js?id=${settings.gaId}`;
    document.head.appendChild(s1);
    const s2 = document.createElement("script");
    s2.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${settings.gaId}');`;
    document.head.appendChild(s2);
  }
  if (settings.customHeadCode) {
    const wrap = document.createElement("div");
    wrap.innerHTML = settings.customHeadCode;
    Array.from(wrap.childNodes).forEach((node) => document.head.appendChild(node));
  }
}
function trackPixelEvent(eventName, params) {
  if (window.fbq) window.fbq("track", eventName, params || {});
}

/* ---------- SEO (عنوان الصفحة + الوصف + Open Graph) ---------- */
function applySEO(settings, title, description) {
  document.title = title || settings.seoTitle || "متجري";
  const desc = description || settings.seoDescription || "";
  setMetaTag("name", "description", desc);
  setMetaTag("property", "og:title", document.title);
  setMetaTag("property", "og:description", desc);
  setMetaTag("property", "og:type", "website");
  if (settings.logoUrl) setMetaTag("property", "og:image", settings.logoUrl);
}
function setMetaTag(attr, key, value) {
  if (!value) return;
  let tag = document.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", value);
}

/* -----------------------------------------------------------
   10) bootPage — بتشتغل في أول كل صفحة عميل (مش لوحة التحكم)
   بتجيب الإعدادات، وتبني الهيدر والفوتر، وتحقن السيو وأكواد التتبع،
   وتظهر زرار واتساب وويدجت الأسئلة الشائعة
   ----------------------------------------------------------- */
async function bootPage(opts = {}) {
  const settings = await getSettings();
  renderHeader(settings.storeName, settings.logoUrl);
  renderFooter(settings);
  applySEO(settings, opts.title ? `${opts.title} — ${settings.storeName}` : settings.seoTitle, opts.description);
  injectTrackingCodes(settings);
  renderWhatsAppFab(settings.whatsappNumber);
  getFaqItems().then((items) => renderFaqWidget(items));
  return settings;
}
