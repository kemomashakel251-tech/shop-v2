// =========================================================
// ميزان — admin-products.js
// عرض/إضافة/تعديل/حذف المنتجات
// =========================================================
let adminProductsCache = [];

async function loadAdminProducts() {
  adminProductsCache = await fetchProducts(); // من shared.js (Firestore أو بيانات تجريبية)
  renderAdminProducts();
}

function renderAdminProducts() {
  const tbody = document.getElementById("productsTableBody");
  if (!tbody) return;

  if (adminProductsCache.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#9A9182;">لسه مفيش منتجات — دوس "إضافة منتج" عشان تبدأ.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminProductsCache.map(p => `
    <tr>
      <td><img class="thumb" src="${p.image}" alt=""></td>
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>${fmtPrice(p.price)}</td>
      <td>${p.stock > 0 ? p.stock : '<span class="status-tag status-cancelled">نفدت</span>'}</td>
      <td class="row-actions">
        <button onclick='openProductModal(${JSON.stringify(p)})'>تعديل</button>
        <button class="danger" onclick="deleteProduct('${p.id}')">حذف</button>
      </td>
    </tr>
  `).join("");
}

function openProductModal(product = null) {
  const isEdit = !!product;
  document.getElementById("productModalTitle").textContent = isEdit ? "تعديل المنتج" : "إضافة منتج جديد";
  document.getElementById("pfId").value = product?.id || "";
  document.getElementById("pfName").value = product?.name || "";
  document.getElementById("pfCategory").value = product?.category || "بقالة";
  document.getElementById("pfPrice").value = product?.price || "";
  document.getElementById("pfOldPrice").value = product?.oldPrice || "";
  document.getElementById("pfStock").value = product?.stock ?? "";
  document.getElementById("pfImage").value = product?.image || "";
  document.getElementById("pfDesc").value = product?.desc || "";
  document.getElementById("productModal").classList.add("open");
}
function closeProductModal() {
  document.getElementById("productModal").classList.remove("open");
}

async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById("pfId").value;
  const data = {
    name: document.getElementById("pfName").value,
    category: document.getElementById("pfCategory").value,
    price: Number(document.getElementById("pfPrice").value),
    oldPrice: document.getElementById("pfOldPrice").value ? Number(document.getElementById("pfOldPrice").value) : null,
    stock: Number(document.getElementById("pfStock").value),
    image: document.getElementById("pfImage").value,
    desc: document.getElementById("pfDesc").value,
  };

  if (adminFirebaseReady && adminDb) {
    const { collection, doc, setDoc, addDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    if (id) await setDoc(doc(adminDb, "products", id), data, { merge: true });
    else await addDoc(collection(adminDb, "products"), data);
  } else {
    // وضع المعاينة: تعديل محلي بس، مش هيتحفظ فعلياً لحد ما تربط Firebase
    if (id) {
      adminProductsCache = adminProductsCache.map(p => p.id === id ? { ...p, ...data } : p);
    } else {
      adminProductsCache.push({ id: "preview-" + Date.now(), ...data });
    }
    renderAdminProducts();
    closeProductModal();
    return;
  }

  closeProductModal();
  await loadAdminProducts();
}

async function deleteProduct(id) {
  if (!confirm("متأكد إنك عايز تحذف المنتج ده؟")) return;

  if (adminFirebaseReady && adminDb) {
    const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    await deleteDoc(doc(adminDb, "products", id));
    await loadAdminProducts();
  } else {
    adminProductsCache = adminProductsCache.filter(p => p.id !== id);
    renderAdminProducts();
  }
}
