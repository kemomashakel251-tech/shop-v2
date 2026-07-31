/* =========================================================
   shared.js — إعدادات Firebase + السلة + دوال مشتركة
   ========================================================= */

/* -----------------------------------------------------------
   1) إعدادات Firebase
   عدّل القيم دي بعد ما تعمل مشروع على console.firebase.google.com
   Project settings → General → Your apps → SDK setup and configuration
   ----------------------------------------------------------- */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const IS_CONFIGURED = firebaseConfig.apiKey !== "YOUR_API_KEY";

let db = null;
if (IS_CONFIGURED) {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
}

/* بانر تنبيه لو لسه معملتش ربط Firebase */
function renderSetupBanner() {
  if (IS_CONFIGURED) return;
  const bar = document.createElement("div");
  bar.className = "setup-banner";
  bar.innerHTML = `⚠️ لسه معملتش ربط Firebase — افتح ملف <code>shared.js</code> وحط بيانات مشروعك (firebaseConfig). راجع ملف README.md لخطوات التفعيل.`;
  document.body.prepend(bar);
}

/* -----------------------------------------------------------
   2) تنسيق السعر
   ----------------------------------------------------------- */
function formatPrice(num) {
  const n = Number(num) || 0;
  return n.toLocaleString("ar-EG") + " ج.م";
}

/* -----------------------------------------------------------
   3) السلة (localStorage)
   بنية العنصر: { id, name, price, image, qty }
   ----------------------------------------------------------- */
const CART_KEY = "store_cart_v1";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product, qty = 1) {
  const cart = getCart();
  const existing = cart.find((i) => i.id === product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || "",
      qty: qty
    });
  }
  saveCart(cart);
  bounceCartBubble();
}

function removeFromCart(id) {
  const cart = getCart().filter((i) => i.id !== id);
  saveCart(cart);
}

function setQty(id, qty) {
  const cart = getCart();
  const item = cart.find((i) => i.id === id);
  if (item) {
    item.qty = Math.max(1, qty);
    saveCart(cart);
  }
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

function cartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
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
  void bubble.offsetWidth; /* reflow لإعادة تشغيل الأنيميشن */
  bubble.classList.add("bounce");
}

/* -----------------------------------------------------------
   4) الهيدر المشترك (لوجو + بحث + سلة)
   ----------------------------------------------------------- */
function renderHeader(storeName = "متجري") {
  const header = document.getElementById("site-header");
  if (!header) return;
  header.innerHTML = `
    <div class="header-inner">
      <a href="index.html" class="logo">${storeName}</a>
      <a href="checkout.html" class="cart-fab" id="cart-fab">
        🛒 <span id="cart-count">0</span>
      </a>
    </div>
  `;
  updateCartBadge();
}

/* تشغيل تلقائي عند تحميل أي صفحة */
document.addEventListener("DOMContentLoaded", () => {
  renderSetupBanner();
  updateCartBadge();
});
