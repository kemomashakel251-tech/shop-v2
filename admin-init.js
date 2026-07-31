// =========================================================
// ميزان — admin-init.js
// نقطة الدخول: تسجيل الدخول + التنقل بين لوحات الإدارة
// =========================================================
document.addEventListener("DOMContentLoaded", async () => {
  await initAdminFirebase();

  const loginForm = document.getElementById("loginForm");
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const result = await adminLogin(email, password);

    if (result.ok) {
      document.getElementById("adminLoginScreen").style.display = "none";
      document.getElementById("adminShell").style.display = "flex";
      if (result.preview) {
        document.getElementById("previewBanner").style.display = "block";
      }
      bootAdminPanels();
    } else {
      const errEl = document.getElementById("loginError");
      errEl.textContent = "بيانات الدخول غير صحيحة. تأكد من البريد وكلمة المرور.";
      errEl.style.display = "block";
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", adminLogout);

  // التنقل بين اللوحات
  document.querySelectorAll(".admin-nav button[data-panel]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".admin-nav button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".admin-panel").forEach(p => p.classList.remove("active"));
      document.getElementById("panel-" + btn.dataset.panel).classList.add("active");
    });
  });

  // نماذج الحفظ
  document.getElementById("productForm").addEventListener("submit", saveProduct);
  document.getElementById("settingsForm").addEventListener("submit", saveAdminSettings);
});

async function bootAdminPanels() {
  await loadAdminProducts();
  await loadAdminOrders();
  await loadAdminDashboard();
  await loadAdminSettings();
}
