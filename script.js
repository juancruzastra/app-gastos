const STORAGE_KEY = "app_gastos_v6";

const form = document.getElementById("expenseForm");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const dateInput = document.getElementById("date");
const movementTypeInput = document.getElementById("movementType");
const categoryInput = document.getElementById("category");
const paymentInput = document.getElementById("paymentMethod");

const totalIncomeEl = document.getElementById("totalIncome");
const totalExpenseEl = document.getElementById("totalExpense");
const totalBalanceEl = document.getElementById("totalBalance");
const totalCountEl = document.getElementById("totalCount");

const historyList = document.getElementById("historyList");
const monthsOverview = document.getElementById("monthsOverview");

const monthFilter = document.getElementById("monthFilter");
const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const paymentFilter = document.getElementById("paymentFilter");
const sortFilter = document.getElementById("sortFilter");

const clearAllBtn = document.getElementById("clearAllBtn");
const exportExcelBtn = document.getElementById("exportExcelBtn");

const pageGastos = document.getElementById("page-gastos");
const pageResumen = document.getElementById("page-resumen");
const topLinks = document.querySelectorAll(".toplink");

const typeGroup = document.getElementById("typeGroup");
const categoryGroup = document.getElementById("categoryGroup");
const paymentGroup = document.getElementById("paymentGroup");

const openCategoryModalBtn = document.getElementById("openCategoryModal");
const categoryModal = document.getElementById("categoryModal");
const closeCategoryModalBtn = document.getElementById("closeCategoryModal");
const allCategoriesGrid = document.getElementById("allCategoriesGrid");
const modalSubtitle = document.getElementById("modalSubtitle");

const editingBanner = document.getElementById("editingBanner");
const cancelEditBtn = document.getElementById("cancelEdit");
const submitButton = document.getElementById("submitButton");

const todayISO = () => new Date().toISOString().slice(0, 10);
dateInput.value = todayISO();

const categoriesByType = {
  gasto: [
    { value: "Combustible", icon: "⛽" },
    { value: "Supermercado", icon: "🛒" },
    { value: "Alquiler", icon: "🏠" },
    { value: "Servicios", icon: "💡" },
    { value: "Pago de tarjetas", icon: "💳" },
    { value: "Medicina", icon: "💊" },
    { value: "Kiosko", icon: "🏪" },
    { value: "Varios", icon: "🧾" }
  ],
  ingreso: [
    { value: "Sueldo", icon: "💰" },
    { value: "Transferencia", icon: "🏦" },
    { value: "Extra", icon: "⭐" },
    { value: "Ajuste", icon: "🧮" },
    { value: "Otros ingresos", icon: "➕" }
  ]
};

const paymentMethods = [
  { value: "Efectivo", icon: "💵" },
  { value: "Débito", icon: "💳" },
  { value: "Crédito", icon: "🪪" },
  { value: "Transferencia", icon: "🏦" },
  { value: "Mercado Pago", icon: "📲" },
  { value: "Otro", icon: "⋯" }
];

let movements = loadMovements();
let editingId = null;
let activeType = "gasto";
let selectedCategory = "";
let selectedPayment = "Efectivo";
let selectedMonth = "all";

function uid() {
  return window.crypto?.randomUUID?.() || String(Date.now() + Math.random());
}

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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(movements));
}

function setPage(page) {
  const isAdd = page === "gastos";
  pageGastos.classList.toggle("active", isAdd);
  pageResumen.classList.toggle("active", !isAdd);

  topLinks.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });
}

function money(value) {
  return Number(value || 0).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2
  });
}

function dateDisplay(iso) {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function monthKeyFromDate(isoDate) {
  return (isoDate || "").slice(0, 7);
}

function currentMonthKey() {
  return todayISO().slice(0, 7);
}

function monthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  const label = d.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric"
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function computeStats(data) {
  const income = data
    .filter((m) => m.type === "ingreso")
    .reduce((sum, m) => sum + Number(m.amount || 0), 0);

  const expense = data
    .filter((m) => m.type === "gasto")
    .reduce((sum, m) => sum + Number(m.amount || 0), 0);

  return {
    income,
    expense,
    balance: income - expense,
    count: data.length
  };
}

function getSortedCategories(type) {
  const counts = {};
  movements
    .filter((m) => m.type === type)
    .forEach((m) => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });

  const list = categoriesByType[type].map((item, index) => ({
    ...item,
    order: index,
    count: counts[item.value] || 0
  }));

  list.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.order - b.order;
  });

  return list;
}

function setSelectedButton(group, value) {
  group.querySelectorAll(".icon-option").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.value === value);
  });
}

function renderTypeButtons() {
  setSelectedButton(typeGroup, activeType);
}

function renderCategoryButtons() {
  const sorted = getSortedCategories(activeType);
  const visible = sorted.slice(0, 5);

  if (!selectedCategory || !sorted.some((item) => item.value === selectedCategory)) {
    selectedCategory = visible[0]?.value || "";
  }

  categoryGroup.innerHTML = "";

  visible.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `icon-option ${selectedCategory === item.value ? "selected" : ""}`;
    btn.dataset.value = item.value;
    btn.innerHTML = `
      <span class="emoji">${item.icon}</span>
      <span class="btn-label">${item.value}</span>
    `;
    categoryGroup.appendChild(btn);
  });

  if (sorted.length > visible.length) {
    const moreBtn = document.createElement("button");
    moreBtn.type = "button";
    moreBtn.className = "icon-option";
    moreBtn.dataset.value = "__more__";
    moreBtn.innerHTML = `
      <span class="emoji">⋯</span>
      <span class="btn-label">más</span>
    `;
    categoryGroup.appendChild(moreBtn);
  }

  categoryInput.value = selectedCategory;
}

function renderCategoryModalButtons() {
  const sorted = getSortedCategories(activeType);
  modalSubtitle.textContent = `categorías de ${activeType}`;
  allCategoriesGrid.innerHTML = "";

  sorted.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `icon-option ${selectedCategory === item.value ? "selected" : ""}`;
    btn.dataset.value = item.value;
    btn.innerHTML = `
      <span class="emoji">${item.icon}</span>
      <span class="btn-label">${item.value}</span>
    `;
    allCategoriesGrid.appendChild(btn);
  });
}

function renderPaymentButtons() {
  const counts = {};
  movements.forEach((m) => {
    counts[m.paymentMethod] = (counts[m.paymentMethod] || 0) + 1;
  });

  const sorted = [...paymentMethods].sort((a, b) => {
    const diff = (counts[b.value] || 0) - (counts[a.value] || 0);
    if (diff !== 0) return diff;
    return paymentMethods.findIndex((p) => p.value === a.value) - paymentMethods.findIndex((p) => p.value === b.value);
  });

  if (!selectedPayment || !sorted.some((item) => item.value === selectedPayment)) {
    selectedPayment = sorted[0]?.value || "Efectivo";
  }

  paymentGroup.innerHTML = "";

  sorted.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `icon-option ${selectedPayment === item.value ? "selected" : ""}`;
    btn.dataset.value = item.value;
    btn.innerHTML = `
      <span class="emoji">${item.icon}</span>
      <span class="btn-label">${item.value}</span>
    `;
    paymentGroup.appendChild(btn);
  });

  paymentInput.value = selectedPayment;
}

function openCategoryModal() {
  categoryModal.classList.add("open");
  categoryModal.setAttribute("aria-hidden", "false");
  renderCategoryModalButtons();
}

function closeCategoryModal() {
  categoryModal.classList.remove("open");
  categoryModal.setAttribute("aria-hidden", "true");
}

function resetForm() {
  editingId = null;
  descriptionInput.value = "";
  amountInput.value = "";
  dateInput.value = todayISO();
  activeType = "gasto";
  selectedCategory = getSortedCategories("gasto")[0]?.value || "";
  selectedPayment = "Efectivo";
  movementTypeInput.value = "gasto";
  categoryInput.value = selectedCategory;
  paymentInput.value = selectedPayment;
  editingBanner.classList.add("hidden");
  submitButton.textContent = "＋";
  renderAll();
}

function startEdit(movement) {
  editingId = movement.id;
  descriptionInput.value = movement.description;
  amountInput.value = movement.amount;
  dateInput.value = movement.date;
  activeType = movement.type;
  selectedCategory = movement.category;
  selectedPayment = movement.paymentMethod;

  movementTypeInput.value = activeType;
  categoryInput.value = selectedCategory;
  paymentInput.value = selectedPayment;

  editingBanner.classList.remove("hidden");
  submitButton.textContent = "guardar";
  setPage("gastos");
  renderAll();
  descriptionInput.focus();
}

function cloneMovement(movement) {
  movements.unshift({
    ...movement,
    id: uid(),
    createdAt: Date.now()
  });
  saveMovements();
  renderAll();
}

function deleteMovement(id) {
  if (!confirm("¿Eliminar este movimiento?")) return;
  movements = movements.filter((m) => m.id !== id);
  if (editingId === id) resetForm();
  saveMovements();
  renderAll();
}

function clearAll() {
  if (!confirm("¿Eliminar todos los movimientos?")) return;
  movements = [];
  saveMovements();
  resetForm();
}

function getActiveMonthData() {
  if (selectedMonth === "all") return [...movements];
  return movements.filter((m) => monthKeyFromDate(m.date) === selectedMonth);
}

function buildFilteredHistory() {
  const base = getActiveMonthData();
  const term = searchInput.value.trim().toLowerCase();
  const typeVal = typeFilter.value;
  const paymentVal = paymentFilter.value;

  let filtered = base.filter((m) => {
    const text = [m.description, m.category, m.paymentMethod, m.type, m.date].join(" ").toLowerCase();
    const matchesTerm = !term || text.includes(term);
    const matchesType = typeVal === "all" || m.type === typeVal;
    const matchesPayment = paymentVal === "all" || m.paymentMethod === paymentVal;
    return matchesTerm && matchesType && matchesPayment;
  });

  switch (sortFilter.value) {
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
  const months = [...new Set(movements.map((m) => monthKeyFromDate(m.date)).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  monthFilter.innerHTML = `<option value="all">todos los meses</option>`;
  months.forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = monthLabel(key);
    monthFilter.appendChild(option);
  });

  monthFilter.value = selectedMonth;
}

function renderSummaryStats() {
  const data = getActiveMonthData();
  const stats = computeStats(data);

  totalIncomeEl.textContent = money(stats.income);
  totalExpenseEl.textContent = money(stats.expense);
  totalBalanceEl.textContent = money(stats.balance);
  totalCountEl.textContent = String(stats.count);
  totalBalanceEl.className = stats.balance >= 0 ? "balance-positive" : "balance-negative";
}

function renderMonthsOverview() {
  const groups = {};
  movements.forEach((m) => {
    const key = monthKeyFromDate(m.date);
    if (!key) return;
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });

  const keys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  if (keys.length === 0) {
    monthsOverview.innerHTML = '<div class="empty">todavía no hay movimientos cargados.</div>';
    return;
  }

  monthsOverview.innerHTML = "";

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
        <div class="metric">
          <span>ingresos</span>
          <strong>${money(stats.income)}</strong>
        </div>
        <div class="metric">
          <span>gastos</span>
          <strong>${money(stats.expense)}</strong>
        </div>
        <div class="metric">
          <span>movimientos</span>
          <strong>${stats.count}</strong>
        </div>
      </div>
    `;
    monthsOverview.appendChild(card);
  });
}

function renderHistory() {
  const data = buildFilteredHistory();

  if (data.length === 0) {
    historyList.innerHTML = '<div class="empty">no hay movimientos con esos filtros.</div>';
    return;
  }

  historyList.innerHTML = "";

  data.forEach((movement) => {
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
        <div class="amount ${movement.type}">
          ${movement.type === "ingreso" ? "+" : "-"} ${money(movement.amount)}
        </div>
        <div class="btn-row">
          <button type="button" class="ghost" data-edit="${movement.id}">editar</button>
          <button type="button" class="ghost" data-dup="${movement.id}">duplicar</button>
          <button type="button" class="danger" data-del="${movement.id}">borrar</button>
        </div>
      </div>
    `;
    historyList.appendChild(row);
  });
}

function exportExcel() {
  if (typeof XLSX === "undefined") {
    alert("No se pudo cargar la librería de Excel.");
    return;
  }

  const historyRows = movements.map((m) => ({
    Fecha: dateDisplay(m.date),
    Tipo: m.type,
    Categoria: m.category,
    Detalle: m.description,
    "Medio de pago": m.paymentMethod,
    Monto: Number(m.amount)
  }));

  const byMonth = {};
  movements.forEach((m) => {
    const key = monthKeyFromDate(m.date);
    if (!key) return;
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(m);
  });

  const monthlyRows = Object.keys(byMonth)
    .sort((a, b) => b.localeCompare(a))
    .map((key) => {
      const stats = computeStats(byMonth[key]);
      return {
        Mes: monthLabel(key),
        Ingresos: stats.income,
        Gastos: stats.expense,
        Balance: stats.balance,
        Movimientos: stats.count
      };
    });

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(historyRows);
  const ws2 = XLSX.utils.json_to_sheet(monthlyRows);

  XLSX.utils.book_append_sheet(wb, ws1, "Historial");
  XLSX.utils.book_append_sheet(wb, ws2, "Resumen mensual");

  XLSX.writeFile(wb, `app-gastos-${todayISO()}.xlsx`);
}

function renderAll() {
  populateMonthFilter();
  renderTypeButtons();
  renderCategoryButtons();
  renderCategoryModalButtons();
  renderPaymentButtons();
  renderSummaryStats();
  renderMonthsOverview();
  renderHistory();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = Number(amountInput.value);

  if (!description || !amount || amount <= 0) return;

  const payload = {
    id: editingId || uid(),
    type: movementTypeInput.value,
    description,
    amount,
    category: categoryInput.value,
    paymentMethod: paymentInput.value,
    date: dateInput.value || todayISO(),
    createdAt: Date.now()
  };

  if (editingId) {
    movements = movements.map((m) => (m.id === editingId ? payload : m));
  } else {
    movements.unshift(payload);
  }

  saveMovements();
  resetForm();
});

typeGroup.addEventListener("click", (e) => {
  const btn = e.target.closest(".icon-option");
  if (!btn) return;

  const value = btn.dataset.value;
  if (value !== "gasto" && value !== "ingreso") return;

  activeType = value;
  movementTypeInput.value = value;
  selectedCategory = getSortedCategories(value)[0]?.value || "";
  renderAll();
});

categoryGroup.addEventListener("click", (e) => {
  const btn = e.target.closest(".icon-option");
  if (!btn) return;

  if (btn.dataset.value === "__more__") {
    openCategoryModal();
    return;
  }

  selectedCategory = btn.dataset.value;
  categoryInput.value = selectedCategory;
  renderAll();
});

paymentGroup.addEventListener("click", (e) => {
  const btn = e.target.closest(".icon-option");
  if (!btn) return;

  selectedPayment = btn.dataset.value;
  paymentInput.value = selectedPayment;
  renderAll();
});

allCategoriesGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".icon-option");
  if (!btn) return;

  selectedCategory = btn.dataset.value;
  categoryInput.value = selectedCategory;
  closeCategoryModal();
  renderAll();
});

historyList.addEventListener("click", (e) => {
  const editBtn = e.target.closest("[data-edit]");
  const dupBtn = e.target.closest("[data-dup]");
  const delBtn = e.target.closest("[data-del]");

  if (editBtn) {
    const movement = movements.find((m) => m.id === editBtn.dataset.edit);
    if (movement) startEdit(movement);
    return;
  }

  if (dupBtn) {
    const movement = movements.find((m) => m.id === dupBtn.dataset.dup);
    if (!movement) return;
    movements.unshift({
      ...movement,
      id: uid(),
      date: todayISO(),
      createdAt: Date.now()
    });
    saveMovements();
    renderAll();
    return;
  }

  if (delBtn) {
    deleteMovement(delBtn.dataset.del);
  }
});

topLinks.forEach((btn) => {
  btn.addEventListener("click", () => setPage(btn.dataset.page));
});

openCategoryModalBtn.addEventListener("click", openCategoryModal);
closeCategoryModalBtn.addEventListener("click", closeCategoryModal);
categoryModal.addEventListener("click", (e) => {
  if (e.target?.dataset?.closeModal) closeCategoryModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCategoryModal();
});

monthFilter.addEventListener("change", () => {
  selectedMonth = monthFilter.value;
  renderSummaryStats();
  renderHistory();
});

searchInput.addEventListener("input", renderHistory);
typeFilter.addEventListener("change", renderHistory);
paymentFilter.addEventListener("change", renderHistory);
sortFilter.addEventListener("change", renderHistory);
clearAllBtn.addEventListener("click", clearAll);
exportExcelBtn.addEventListener("click", exportExcel);
cancelEditBtn.addEventListener("click", resetForm);

setPage("gastos");
resetForm();
renderAll();
