const STORAGE_KEY = "app_gastos_v7";
const todayISO = () => new Date().toISOString().slice(0, 10);

const typeOptions = [
  { value: "gasto", icon: "🟢", label: "gasto" },
  { value: "ingreso", icon: "🔵", label: "ingreso" },
];

const categoriesByType = {
  gasto: [
    { value: "Combustible", icon: "⛽" },
    { value: "Supermercado", icon: "🛒" },
    { value: "Alquiler", icon: "🏠" },
    { value: "Servicios", icon: "💡" },
    { value: "Pago de tarjetas", icon: "💳" },
    { value: "Medicina", icon: "💊" },
    { value: "Kiosko", icon: "🏪" },
    { value: "Varios", icon: "🧾" },
  ],
  ingreso: [
    { value: "Sueldo", icon: "💰" },
    { value: "Transferencia", icon: "🏦" },
    { value: "Extra", icon: "⭐" },
    { value: "Ajuste", icon: "🧮" },
    { value: "Otros ingresos", icon: "➕" },
  ],
};

const paymentMethods = [
  { value: "Efectivo", icon: "💵" },
  { value: "Débito", icon: "💳" },
  { value: "Crédito", icon: "🪪" },
  { value: "Transferencia", icon: "🏦" },
  { value: "Mercado Pago", icon: "📲" },
  { value: "Otro", icon: "⋯" },
];

const state = {
  movements: loadMovements(),
  activePage: "add",
  activeType: "gasto",
  selectedCategory: "",
  selectedPayment: "Efectivo",
  selectedMonth: "all",
  editingId: null,
  filters: {
    search: "",
    type: "all",
    payment: "all",
    sort: "newest",
  },
};

const el = {
  topLinks: document.querySelectorAll(".toplink"),
  pageAdd: document.getElementById("page-add"),
  pageSummary: document.getElementById("page-summary"),
  form: document.getElementById("expenseForm"),
  submitButton: document.getElementById("submitButton"),
  editingBanner: document.getElementById("editingBanner"),
  cancelEdit: document.getElementById("cancelEdit"),
  movementType: document.getElementById("movementType"),
  description: document.getElementById("description"),
  amount: document.getElementById("amount"),
  category: document.getElementById("category"),
  paymentMethod: document.getElementById("paymentMethod"),
  typeGroup: document.getElementById("typeGroup"),
  categoryGroup: document.getElementById("categoryGroup"),
  paymentGroup: document.getElementById("paymentGroup"),
  openCategoryModal: document.getElementById("openCategoryModal"),
  categoryModal: document.getElementById("categoryModal"),
  closeCategoryModal: document.getElementById("closeCategoryModal"),
  modalSubtitle: document.getElementById("modalSubtitle"),
  allCategoriesGrid: document.getElementById("allCategoriesGrid"),
  monthFilter: document.getElementById("monthFilter"),
  exportExcelBtn: document.getElementById("exportExcelBtn"),
  totalIncome: document.getElementById("totalIncome"),
  totalExpense: document.getElementById("totalExpense"),
  totalBalance: document.getElementById("totalBalance"),
  totalCount: document.getElementById("totalCount"),
  monthsOverview: document.getElementById("monthsOverview"),
  searchInput: document.getElementById("searchInput"),
  typeFilter: document.getElementById("typeFilter"),
  paymentFilter: document.getElementById("paymentFilter"),
  sortFilter: document.getElementById("sortFilter"),
  clearAllBtn: document.getElementById("clearAllBtn"),
  historyList: document.getElementById("historyList"),
};

function loadMovements() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMovements() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.movements));
}

function uid() {
  return window.crypto?.randomUUID?.() || String(Date.now() + Math.random());
}

function money(value) {
  return Number(value || 0).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  });
}

function dateDisplay(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function monthKeyFromDate(iso) {
  return (iso || "").slice(0, 7);
}

function monthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  const label = d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function computeStats(rows) {
  const income = rows.filter((r) => r.type === "ingreso").reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const expense = rows.filter((r) => r.type === "gasto").reduce((sum, r) => sum + Number(r.amount || 0), 0);
  return { income, expense, balance: income - expense, count: rows.length };
}

function setPage(page) {
  state.activePage = page;
  el.pageAdd.classList.toggle("active", page === "add");
  el.pageSummary.classList.toggle("active", page === "summary");
  el.topLinks.forEach((btn) => btn.classList.toggle("active", btn.dataset.page === page));
}

function openCategoryModal() {
  el.categoryModal.classList.add("open");
  el.categoryModal.setAttribute("aria-hidden", "false");
  renderCategoryModal();
}

function closeCategoryModal() {
  el.categoryModal.classList.remove("open");
  el.categoryModal.setAttribute("aria-hidden", "true");
}

function setSelectedButton(group, value) {
  group.querySelectorAll(".icon-option").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.value === value);
  });
}

function getSortedCategories(type) {
  const usage = {};
  state.movements.filter((m) => m.type === type).forEach((m) => {
    usage[m.category] = (usage[m.category] || 0) + 1;
  });

  const list = categoriesByType[type].map((item, index) => ({ ...item, index, count: usage[item.value] || 0 }));
  list.sort((a, b) => (b.count - a.count) || (a.index - b.index));
  return list;
}

function renderTypeButtons() {
  el.typeGroup.innerHTML = "";
  typeOptions.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `icon-option ${item.value === state.activeType ? `type-${item.value} selected` : `type-${item.value}`}`;
    btn.dataset.value = item.value;
    btn.innerHTML = `<span class="emoji">${item.icon}</span><span class="btn-label">${item.label}</span>`;
    el.typeGroup.appendChild(btn);
  });
}

function renderCategoryButtons() {
  const sorted = getSortedCategories(state.activeType);
  const visible = sorted.slice(0, 5);

  if (!state.selectedCategory || !sorted.some((item) => item.value === state.selectedCategory)) {
    state.selectedCategory = visible[0]?.value || "";
  }

  el.categoryGroup.innerHTML = "";
  visible.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `icon-option ${state.selectedCategory === item.value ? "selected" : ""}`;
    btn.dataset.value = item.value;
    btn.innerHTML = `<span class="emoji">${item.icon}</span><span class="btn-label">${item.value}</span>`;
    el.categoryGroup.appendChild(btn);
  });

  if (sorted.length > visible.length) {
    const moreBtn = document.createElement("button");
    moreBtn.type = "button";
    moreBtn.className = "icon-option";
    moreBtn.dataset.value = "__more__";
    moreBtn.innerHTML = `<span class="emoji">⋯</span><span class="btn-label">más</span>`;
    el.categoryGroup.appendChild(moreBtn);
  }

  el.category.value = state.selectedCategory;
}

function renderCategoryModal() {
  const sorted = getSortedCategories(state.activeType);
  el.modalSubtitle.textContent = `categorías de ${state.activeType}`;
  el.allCategoriesGrid.innerHTML = "";

  sorted.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `icon-option ${state.selectedCategory === item.value ? "selected" : ""}`;
    btn.dataset.value = item.value;
    btn.innerHTML = `<span class="emoji">${item.icon}</span><span class="btn-label">${item.value}</span>`;
    el.allCategoriesGrid.appendChild(btn);
  });
}

function renderPaymentButtons() {
  const usage = {};
  state.movements.forEach((m) => {
    usage[m.paymentMethod] = (usage[m.paymentMethod] || 0) + 1;
  });

  const sorted = [...paymentMethods].sort((a, b) => (usage[b.value] || 0) - (usage[a.value] || 0));
  if (!state.selectedPayment || !sorted.some((item) => item.value === state.selectedPayment)) {
    state.selectedPayment = sorted[0]?.value || "Efectivo";
  }

  el.paymentGroup.innerHTML = "";
  sorted.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `icon-option ${state.selectedPayment === item.value ? "selected" : ""}`;
    btn.dataset.value = item.value;
    btn.innerHTML = `<span class="emoji">${item.icon}</span><span class="btn-label">${item.value}</span>`;
    el.paymentGroup.appendChild(btn);
  });

  el.paymentMethod.value = state.selectedPayment;
}

function resetForm() {
  state.editingId = null;
  el.description.value = "";
  el.amount.value = "";
  state.activeType = "gasto";
  el.movementType.value = "gasto";
  state.selectedCategory = getSortedCategories("gasto")[0]?.value || "";
  state.selectedPayment = "Efectivo";
  el.category.value = state.selectedCategory;
  el.paymentMethod.value = state.selectedPayment;
  el.editingBanner.classList.add("hidden");
  el.submitButton.textContent = "＋";
  renderUI();
}

function startEdit(movement) {
  state.editingId = movement.id;
  el.description.value = movement.description;
  el.amount.value = movement.amount;
  state.activeType = movement.type;
  state.selectedCategory = movement.category;
  state.selectedPayment = movement.paymentMethod;
  el.movementType.value = movement.type;
  el.category.value = movement.category;
  el.paymentMethod.value = movement.paymentMethod;
  el.editingBanner.classList.remove("hidden");
  el.submitButton.textContent = "guardar";
  setPage("add");
  renderUI();
  el.description.focus();
}

function cloneMovement(movement) {
  state.movements.unshift({ ...movement, id: uid(), createdAt: Date.now() });
  saveMovements();
  renderUI();
}

function deleteMovement(id) {
  if (!confirm("¿Eliminar este movimiento?")) return;
  state.movements = state.movements.filter((m) => m.id !== id);
  if (state.editingId === id) resetForm();
  saveMovements();
  renderUI();
}

function clearAll() {
  if (!confirm("¿Eliminar todos los movimientos?")) return;
  state.movements = [];
  saveMovements();
  resetForm();
}

function getActiveMonthData() {
  if (state.selectedMonth === "all") return [...state.movements];
  return state.movements.filter((m) => monthKeyFromDate(m.date) === state.selectedMonth);
}

function buildFilteredHistory() {
  const base = getActiveMonthData();
  const term = state.filters.search.trim().toLowerCase();
  const typeVal = state.filters.type;
  const paymentVal = state.filters.payment;

  let filtered = base.filter((m) => {
    const text = [m.description, m.category, m.paymentMethod, m.type, m.date].join(" ").toLowerCase();
    const matchesTerm = !term || text.includes(term);
    const matchesType = typeVal === "all" || m.type === typeVal;
    const matchesPayment = paymentVal === "all" || m.paymentMethod === paymentVal;
    return matchesTerm && matchesType && matchesPayment;
  });

  switch (state.filters.sort) {
    case "oldest":
      filtered.sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt || 0) - (b.createdAt || 0));
      break;
    case "amount_desc":
      filtered.sort((a, b) => Number(b.amount) - Number(a.amount));
      break;
    case "amount_asc":
      filtered.sort((a, b) => Number(a.amount) - Number(b.amount));
      break;
    case "az":
      filtered.sort((a, b) => a.description.localeCompare(b.description, "es"));
      break;
    case "za":
      filtered.sort((a, b) => b.description.localeCompare(a.description, "es"));
      break;
    case "newest":
    default:
      filtered.sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0));
      break;
  }

  return filtered;
}

function populateMonthFilter() {
  const keys = [...new Set(state.movements.map((m) => monthKeyFromDate(m.date)).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  el.monthFilter.innerHTML = `<option value="all">todos los meses</option>`;
  keys.forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = monthLabel(key);
    el.monthFilter.appendChild(option);
  });

  if (!keys.includes(state.selectedMonth) && state.selectedMonth !== "all") state.selectedMonth = "all";
  el.monthFilter.value = state.selectedMonth;
}

function renderSummaryStats() {
  const data = getActiveMonthData();
  const stats = computeStats(data);
  el.totalIncome.textContent = money(stats.income);
  el.totalExpense.textContent = money(stats.expense);
  el.totalBalance.textContent = money(stats.balance);
  el.totalBalance.className = stats.balance >= 0 ? "balance-positive" : "balance-negative";
  el.totalCount.textContent = String(stats.count);
}

function renderMonthsOverview() {
  const groups = {};
  state.movements.forEach((m) => {
    const key = monthKeyFromDate(m.date);
    if (!key) return;
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });

  const keys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  if (keys.length === 0) {
    el.monthsOverview.innerHTML = '<div class="empty">todavía no hay movimientos cargados.</div>';
    return;
  }

  el.monthsOverview.innerHTML = "";
  keys.forEach((key) => {
    const stats = computeStats(groups[key]);
    const card = document.createElement("div");
    card.className = "month-card";
    card.innerHTML = `
      <div class="month-card-head">
        <div class="month-name">${monthLabel(key)}</div>
        <div class="month-balance">${money(stats.balance)}</div>
      </div>
      <div class="month-metrics">
        <div class="metric"><span>ingresos</span><strong>${money(stats.income)}</strong></div>
        <div class="metric"><span>gastos</span><strong>${money(stats.expense)}</strong></div>
        <div class="metric"><span>movimientos</span><strong>${stats.count}</strong></div>
      </div>
    `;
    el.monthsOverview.appendChild(card);
  });
}

function renderHistory() {
  const rows = buildFilteredHistory();
  if (rows.length === 0) {
    el.historyList.innerHTML = '<div class="empty">no hay movimientos con esos filtros.</div>';
    return;
  }

  el.historyList.innerHTML = "";
  rows.forEach((movement) => {
    const row = document.createElement("div");
    row.className = `movement ${movement.type}`;
    row.innerHTML = `
      <div class="movement-head">
        <div class="movement-main">
          <div class="chips">
            <span class="chip ${movement.type}">${movement.type}</span>
            <span class="chip">${movement.category}</span>
            <span class="chip">${movement.paymentMethod}</span>
            <span class="chip">${dateDisplay(movement.date)}</span>
          </div>
          <strong class="desc">${movement.description}</strong>
        </div>
      </div>
      <div class="movement-actions">
        <div class="amount ${movement.type}">${movement.type === "ingreso" ? "+" : "-"} ${money(movement.amount)}</div>
        <div class="btn-row">
          <button type="button" class="ghost" data-edit="${movement.id}">editar</button>
          <button type="button" class="ghost" data-dup="${movement.id}">duplicar</button>
          <button type="button" class="danger" data-del="${movement.id}">borrar</button>
        </div>
      </div>
    `;
    el.historyList.appendChild(row);
  });
}

function exportExcel() {
  if (typeof XLSX === "undefined") {
    alert("No se pudo cargar la librería de Excel.");
    return;
  }

  const historyRows = state.movements.map((m) => ({
    Fecha: dateDisplay(m.date),
    Tipo: m.type,
    Categoria: m.category,
    Detalle: m.description,
    "Medio de pago": m.paymentMethod,
    Monto: Number(m.amount),
  }));

  const byMonth = {};
  state.movements.forEach((m) => {
    const key = monthKeyFromDate(m.date);
    if (!key) return;
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(m);
  });

  const monthlyRows = Object.keys(byMonth).sort((a, b) => b.localeCompare(a)).map((key) => {
    const stats = computeStats(byMonth[key]);
    return {
      Mes: monthLabel(key),
      Ingresos: stats.income,
      Gastos: stats.expense,
      Balance: stats.balance,
      Movimientos: stats.count,
    };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(historyRows), "Historial");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(monthlyRows), "Resumen mensual");
  XLSX.writeFile(wb, `app-gastos-${todayISO()}.xlsx`);
}

function renderUI() {
  setSelectedButton(el.typeGroup, state.activeType);
  renderTypeButtons();
  renderCategoryButtons();
  renderPaymentButtons();
  populateMonthFilter();
  renderSummaryStats();
  renderMonthsOverview();
  renderHistory();
}

el.topLinks.forEach((btn) => btn.addEventListener("click", () => setPage(btn.dataset.page)));

el.form.addEventListener("submit", (e) => {
  e.preventDefault();

  const description = el.description.value.trim();
  const amount = Number(el.amount.value);
  if (!description || !amount || amount <= 0) return;

  const payload = {
    id: state.editingId || uid(),
    type: el.movementType.value,
    description,
    amount,
    category: el.category.value,
    paymentMethod: el.paymentMethod.value,
    date: todayISO(),
    createdAt: Date.now(),
  };

  if (state.editingId) {
    const index = state.movements.findIndex((m) => m.id === state.editingId);
    if (index >= 0) state.movements[index] = { ...state.movements[index], ...payload, createdAt: state.movements[index].createdAt || Date.now() };
  } else {
    state.movements.unshift(payload);
  }

  saveMovements();
  state.editingId = null;
  el.editingBanner.classList.add("hidden");
  el.submitButton.textContent = "＋";
  el.description.value = "";
  el.amount.value = "";
  state.activeType = "gasto";
  state.selectedCategory = getSortedCategories("gasto")[0]?.value || "";
  state.selectedPayment = "Efectivo";
  el.movementType.value = "gasto";
  el.category.value = state.selectedCategory;
  el.paymentMethod.value = state.selectedPayment;
  renderUI();
});

el.typeGroup.addEventListener("click", (e) => {
  const btn = e.target.closest(".icon-option");
  if (!btn) return;
  const value = btn.dataset.value;
  if (value !== "gasto" && value !== "ingreso") return;
  state.activeType = value;
  el.movementType.value = value;
  state.selectedCategory = getSortedCategories(value)[0]?.value || "";
  renderUI();
});

el.categoryGroup.addEventListener("click", (e) => {
  const btn = e.target.closest(".icon-option");
  if (!btn) return;
  if (btn.dataset.value === "__more__") return openCategoryModal();
  state.selectedCategory = btn.dataset.value;
  el.category.value = state.selectedCategory;
  renderUI();
});

el.paymentGroup.addEventListener("click", (e) => {
  const btn = e.target.closest(".icon-option");
  if (!btn) return;
  state.selectedPayment = btn.dataset.value;
  el.paymentMethod.value = state.selectedPayment;
  renderUI();
});

el.allCategoriesGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".icon-option");
  if (!btn) return;
  state.selectedCategory = btn.dataset.value;
  el.category.value = state.selectedCategory;
  closeCategoryModal();
  renderUI();
});

el.historyList.addEventListener("click", (e) => {
  const editBtn = e.target.closest("[data-edit]");
  const dupBtn = e.target.closest("[data-dup]");
  const delBtn = e.target.closest("[data-del]");

  if (editBtn) {
    const movement = state.movements.find((m) => m.id === editBtn.dataset.edit);
    if (!movement) return;
    state.editingId = movement.id;
    state.activeType = movement.type;
    state.selectedCategory = movement.category;
    state.selectedPayment = movement.paymentMethod;
    el.movementType.value = movement.type;
    el.category.value = movement.category;
    el.paymentMethod.value = movement.paymentMethod;
    el.description.value = movement.description;
    el.amount.value = movement.amount;
    el.editingBanner.classList.remove("hidden");
    el.submitButton.textContent = "guardar";
    setPage("add");
    renderUI();
    el.description.focus();
    return;
  }

  if (dupBtn) {
    const movement = state.movements.find((m) => m.id === dupBtn.dataset.dup);
    if (!movement) return;
    state.movements.unshift({ ...movement, id: uid(), date: todayISO(), createdAt: Date.now() });
    saveMovements();
    renderUI();
    return;
  }

  if (delBtn) deleteMovement(delBtn.dataset.del);
});

function deleteMovement(id) {
  if (!confirm("¿Eliminar este movimiento?")) return;
  state.movements = state.movements.filter((m) => m.id !== id);
  if (state.editingId === id) {
    state.editingId = null;
    el.editingBanner.classList.add("hidden");
    el.submitButton.textContent = "＋";
  }
  saveMovements();
  renderUI();
}

el.openCategoryModal.addEventListener("click", openCategoryModal);
el.closeCategoryModal.addEventListener("click", closeCategoryModal);
el.categoryModal.addEventListener("click", (e) => {
  if (e.target?.dataset?.closeModal) closeCategoryModal();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCategoryModal(); });

el.cancelEdit.addEventListener("click", () => {
  state.editingId = null;
  el.description.value = "";
  el.amount.value = "";
  el.editingBanner.classList.add("hidden");
  el.submitButton.textContent = "＋";
  renderUI();
});

el.monthFilter.addEventListener("change", () => {
  state.selectedMonth = el.monthFilter.value;
  renderSummaryStats();
  renderHistory();
});

el.searchInput.addEventListener("input", () => { state.filters.search = el.searchInput.value; renderHistory(); });
el.typeFilter.addEventListener("change", () => { state.filters.type = el.typeFilter.value; renderHistory(); });
el.paymentFilter.addEventListener("change", () => { state.filters.payment = el.paymentFilter.value; renderHistory(); });
el.sortFilter.addEventListener("change", () => { state.filters.sort = el.sortFilter.value; renderHistory(); });
el.clearAllBtn.addEventListener("click", clearAll);
el.exportExcelBtn.addEventListener("click", exportExcel);

setPage("add");
state.selectedCategory = getSortedCategories("gasto")[0]?.value || "";
el.category.value = state.selectedCategory;
el.paymentMethod.value = state.selectedPayment;
renderUI();
