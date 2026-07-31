// =========================================================
// ميزان — shared.js
// إعداد Firebase + منطق السلة (localStorage) + جلب المنتجات
// =========================================================
// TODO: استبدل القيم دي ببيانات مشروعك الحقيقي من Firebase Console
// (Project settings → Your apps → SDK setup and configuration)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let db = null;
let firebaseReady = false;

async function initFirebase() {
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    firebaseReady = true;
  } catch (e) {
    console.warn("Firebase غير مربوط بعد — هيتم استخدام بيانات تجريبية للمعاينة.", e);
    firebaseReady = false;
  }
}

// بيانات تجريبية تظهر في المعاينة قبل ربط Firebase فعلياً
const SAMPLE_PRODUCTS = [
  { id: "p1", name: "قهوة عربية محمصة", category: "بقالة", price: 180, oldPrice: 220, stock: 24, image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600", desc: "بن عربي محمص طازج، تحميص متوسط يبرز نكهة الهيل الطبيعية." },
  { id: "p2", name: "عسل نحل جبلي", category: "بقالة", price: 320, oldPrice: null, stock: 10, image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600", desc: "عسل طبيعي 100% من مناحل جبلية، بدون أي إضافات." },
  { id: "p3", name: "سلة خوص يدوية", category: "منزل", price: 250, oldPrice: 300, stock: 6, image: "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?w=600", desc: "سلة مصنوعة يدوياً من خوص النخيل، مناسبة للتخزين والديكور." },
  { id: "p4", name: "زيت زيتون بكر", category: "بقالة", price: 210, oldPrice: null, stock: 0, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600", desc: "زيت زيتون بكر ممتاز، عصرة أولى باردة." },
  { id: "p5", name: "شال قطني مطرز", category: "أزياء", price: 450, oldPrice: 520, stock: 15, image: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600", desc: "شال قطني بتطريز يدوي تقليدي، متعدد الاستخدامات." },
  { id: "p6", name: "صابون زيت الغار", category: "عناية", price: 65, oldPrice: null, stock: 40, image: "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=600", desc: "صابون طبيعي مصنوع من زيت الغار والزيتون." },
];

async function fetchProducts() {
  if (firebaseReady && db) {
    try {
      const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      const snap = await getDocs(collection(db, "products"));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (e) {
      console.warn("تعذر جلب المنتجات من Firestore، هيتم عرض بيانات تجريبية.", e);
    }
  }
  return SAMPLE_PRODUCTS;
}

async function fetchProduct(id) {
  const all = await fetchProducts();
  return all.find(p => p.id === id) || null;
}

// ---------------- Cart (localStorage) ----------------
const CART_KEY = "dokkan_cart";

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product, qty = 1) {
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);
  if (existing) existing.qty += qty;
  else cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, qty });
  saveCart(cart);
}

function updateCartQty(id, qty) {
  let cart = getCart();
  if (qty <= 0) cart = cart.filter(i => i.id !== id);
  else cart = cart.map(i => i.id === id ? { ...i, qty } : i);
  saveCart(cart);
  renderCartDrawer();
}

function cartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}

function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

function updateCartBadge() {
  document.querySelectorAll(".cart-count").forEach(el => el.textContent = cartCount());
}

function fmtPrice(n) {
  return n.toLocaleString("ar-EG") + " ج.م";
}

// ---------------- Cart Drawer (shared UI) ----------------
function renderCartDrawer() {
  const wrap = document.getElementById("cartItems");
  if (!wrap) return;
  const cart = getCart();

  if (cart.length === 0) {
    wrap.innerHTML = `<div class="empty-state">السلة فاضية دلوقتي.<br>ابدأ التسوق وهتلاقي منتجاتك هنا.</div>`;
  } else {
    wrap.innerHTML = cart.map(i => `
      <div class="cart-item">
        <img src="${i.image}" alt="${i.name}">
        <div class="cart-item-info">
          <div class="name">${i.name}</div>
          <div class="price">${fmtPrice(i.price)}</div>
        </div>
        <div class="qty-control">
          <button onclick="updateCartQty('${i.id}', ${i.qty - 1})">−</button>
          <span>${i.qty}</span>
          <button onclick="updateCartQty('${i.id}', ${i.qty + 1})">+</button>
        </div>
      </div>
    `).join("");
  }
  const totalEl = document.getElementById("cartTotal");
  if (totalEl) totalEl.textContent = fmtPrice(cartTotal());
}

function openCart() {
  document.getElementById("cartDrawer")?.classList.add("open");
  document.getElementById("cartOverlay")?.classList.add("open");
  renderCartDrawer();
}
function closeCart() {
  document.getElementById("cartDrawer")?.classList.remove("open");
  document.getElementById("cartOverlay")?.classList.remove("open");
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  initFirebase();
});
