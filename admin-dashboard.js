// =========================================================
// دكّان — admin-dashboard.js
// =========================================================
async function loadAdminDashboard() {
  const products = adminProductsCache.length ? adminProductsCache : await fetchProducts();
  const orders = adminOrdersCache.length ? adminOrdersCache : SAMPLE_ORDERS;

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingOrders = orders.filter(o => o.status === "جديد").length;
  const outOfStock = products.filter(p => p.stock === 0).length;

  document.getElementById("statProducts").textContent = products.length;
  document.getElementById("statOrders").textContent = orders.length;
  document.getElementById("statRevenue").textContent = fmtPrice(totalRevenue);
  document.getElementById("statPending").textContent = pendingOrders;

  const recentWrap = document.getElementById("recentOrdersBody");
  if (recentWrap) {
    recentWrap.innerHTML = orders.slice(0, 5).map(o => `
      <tr>
        <td>#${o.id}</td>
        <td>${o.customerName}</td>
        <td>${fmtPrice(o.total)}</td>
        <td><span class="status-tag ${STATUS_CLASS[o.status] || 'status-new'}">${o.status}</span></td>
      </tr>
    `).join("");
  }

  if (outOfStock > 0) {
    document.getElementById("stockWarning").style.display = "block";
    document.getElementById("stockWarning").textContent = `⚠️ يوجد ${outOfStock} منتج نفد من المخزون — راجع قسم المنتجات.`;
  }
}
