// =========================================================
// ميزان — admin-orders.js
// =========================================================
let adminOrdersCache = [];

const SAMPLE_ORDERS = [
  { id: "DK-000123", customerName: "منى سعيد", customerPhone: "01012345678", address: "القاهرة - مدينة نصر", total: 460, status: "جديد", items: [{name:"قهوة عربية محمصة", qty:2}] },
  { id: "DK-000122", customerName: "كريم فتحي", customerPhone: "01098765432", address: "الجيزة - الدقي", total: 250, status: "قيد التنفيذ", items: [{name:"سلة خوص يدوية", qty:1}] },
  { id: "DK-000121", customerName: "سارة إبراهيم", customerPhone: "01111222333", address: "الإسكندرية - سموحة", total: 715, status: "تم التسليم", items: [{name:"شال قطني مطرز", qty:1},{name:"عسل نحل جبلي", qty:1}] },
];

const STATUS_CLASS = {
  "جديد": "status-new",
  "قيد التنفيذ": "status-progress",
  "تم التسليم": "status-done",
  "ملغي": "status-cancelled",
};

async function loadAdminOrders() {
  if (adminFirebaseReady && adminDb) {
    try {
      const { collection, getDocs, query, orderBy } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      const snap = await getDocs(query(collection(adminDb, "orders"), orderBy("createdAt", "desc")));
      adminOrdersCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn("تعذر جلب الطلبات، هيتم عرض بيانات تجريبية.", e);
      adminOrdersCache = SAMPLE_ORDERS;
    }
  } else {
    adminOrdersCache = SAMPLE_ORDERS;
  }
  renderAdminOrders();
}

function renderAdminOrders() {
  const tbody = document.getElementById("ordersTableBody");
  if (!tbody) return;

  if (adminOrdersCache.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#9A9182;">لسه مفيش طلبات.</td></tr>`;
    return;
  }

  tbody.innerHTML = adminOrdersCache.map(o => `
    <tr>
      <td>#${o.id}</td>
      <td>${o.customerName}<br><small style="color:#9A9182;">${o.customerPhone}</small></td>
      <td>${o.address}</td>
      <td>${fmtPrice(o.total)}</td>
      <td>
        <select onchange="updateOrderStatus('${o.id}', this.value)" class="status-tag ${STATUS_CLASS[o.status] || 'status-new'}" style="border:none;">
          ${["جديد","قيد التنفيذ","تم التسليم","ملغي"].map(s => `<option value="${s}" ${o.status===s?"selected":""}>${s}</option>`).join("")}
        </select>
      </td>
      <td class="row-actions">
        <button onclick='viewOrderDetails(${JSON.stringify(o)})'>التفاصيل</button>
      </td>
    </tr>
  `).join("");
}

async function updateOrderStatus(id, status) {
  if (adminFirebaseReady && adminDb) {
    const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    await updateDoc(doc(adminDb, "orders", id), { status });
  }
  adminOrdersCache = adminOrdersCache.map(o => o.id === id ? { ...o, status } : o);
}

function viewOrderDetails(order) {
  const itemsList = (order.items || []).map(i => `${i.name} × ${i.qty}`).join("، ");
  alert(`طلب #${order.id}\nالعميل: ${order.customerName}\nالموبايل: ${order.customerPhone}\nالعنوان: ${order.address}\nالمنتجات: ${itemsList}\nالإجمالي: ${fmtPrice(order.total)}`);
}
