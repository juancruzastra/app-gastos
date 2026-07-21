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

let movements = loadMovements();
let editingId = null;
let activeType = "gasto";
let selectedCategory = "";
let selectedPayment = "Efectivo";
let selectedMonth = currentMonthKey();

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
    maximumFractionDigits: 2,
  });
}

function dateDisplay(iso) {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function currentMonthKey() {
  return todayISO().slice(0, 7);
}

function monthKeyFromDate(isoDate) {
  return (isoDate || "").slice(0, 7);
}

function monthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  const label = d.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getUniqueMonths() {
  const keys = [...new Set(movements.map((m) => monthKeyFromDate(m.date)).filter(Boolean))];
  keys.sort((a, b) => b.localeCompare(a));
  const current = currentMonthKey();
  if (!keys.includes(current)) keys.unshift(current);
  return keys;
}

function getCategoryCounts(type) {
  const counts = {};
  movements
    .filter((m) => m.type === type)
    .forEach((m) => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });
  return counts;
}

function getSortedCategories(type) {
  const counts = getCategoryCounts(type);
  const defaults = categoriesByType[type].map((item, index) => ({
    ...item,
    order: index,
    count: counts[item.value] || 0,
  }));

  defaults.sort((a, b) => {
    if ((b.count || 0) !== (a.count || 0)) return (b.count || 0) - (a.count || 0);
    return a.order - b.order;
  });

  return defaults;
}

function setSelectedButton(group, value) {
  group.querySelectorAll(".icon-option").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.value === value);
  });
}

function renderTypeButtons() {
  typeGroup.querySelectorAll(".icon-option").forEach((button) => {
    button.addEventListener("click", () => {
      activeType = button.dataset.value;
      movementTypeInput.value = activeType;
      setSelectedButton(typeGroup, activeType);
      renderCategoryButtons();
      renderCategoryModalButtons();
    });
  });
}

function renderCategoryButtons() {
  const sorted = getSortedCategories(activeType);
  const visible = sorted.slice(0, 5);

  if (!selectedCategory || !sorted.some((item) => item.value === selectedCategory)) {
    selectedCategory = visible[0]?.value || sorted[0]?.value || "";
  }

  categoryGroup.innerHTML = "";

  visible.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `icon-option ${selectedCategory === item.value ? "selected" : ""}`;
    button.dataset.value = item.value;
    button.innerHTML = `
      <span class="emoji">${item.icon}</span>
      <span class="btn-label">${item.value}</span>
    `;

    button.addEventListener("click", () => {
      selectedCategory = item.value;
      categoryInput.value = item.value;
      renderCategoryButtons();
    });

    categoryGroup.appendChild(button);
  });

  if (sorted.length > visible.length) {
    const moreButton = document.createElement("button");
    moreButton.type = "button";
    moreButton.className = "icon-option";
    moreButton.innerHTML = `
      <span class="emoji">⋯</span>
      <span class="btn-label">más</span>
    `;
    moreButton.addEventListener("click", openCategoryModal);
    categoryGroup.appendChild(moreButton);
  }

  categoryInput.value = selectedCategory;
}

function renderCategoryModalButtons() {
  const sorted = getSortedCategories(activeType);
  modalSubtitle.textContent = `categorías de ${activeType}`;

  allCategoriesGrid.innerHTML = "";

  sorted.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `icon-option ${selectedCategory === item.value ? "selected" : ""}`;
    button.dataset.value = item.value;
    button.innerHTML = `
      <span class="emoji">${item.icon}</span>
      <span class="btn-label">${item.value}</span>
    `;

    button.addEventListener("click", () => {
      selectedCategory = item.value;
      categoryInput.value = item.value;
      closeCategoryModal();
      renderCategoryButtons();
      renderCategoryModalButtons();
    });

    allCategoriesGrid.appendChild(button);
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
    const button = document.createElement("button");
    button.type = "button";
    button.className = `icon-option ${selectedPayment === item.value ? "selected" : ""}`;
    button.dataset.value = item.value;
    button.innerHTML = `
      <span class="emoji">${item.icon}</span>
      <span class="btn-label">${item.value}</span>
    `;

    button.addEventListener("click", () => {
      selectedPayment = item.value;
      paymentInput.value = item.value;
      renderPaymentButtons();
    });

    paymentGroup.appendChild(button);
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
  movementTypeInput.value = "gasto";
  selectedCategory = getSortedCategories(activeType)[0]?.value || "";
  selectedPayment = "Efectivo";
  categoryInput.value = selectedCategory;
  paymentInput.value = selectedPayment;
  editingBanner.classList.add("hidden");
  submitButton.textContent = "＋";
  setSelectedButton(typeGroup, activeType);
  renderCategoryButtons();
  renderCategoryModalButtons();
  renderPaymentButtons();
}

function startEdit(movement) {
  editingId = movement.id;
  descriptionInput.value = movement.description;
  amountInput.value = movement.amount;
  dateInput.value = movement.date;
  activeType = movement.type;
  movementTypeInput.value = movement.type;
  selectedCategory = movement.category;
  selectedPayment = movement.paymentMethod;
  categoryInput.value = selectedCategory;
  paymentInput.value = selectedPayment;
  editingBanner.classList.remove("hidden");
  submitButton.textContent = "guardar";
  setSelectedButton(typeGroup, activeType);
  renderCategoryButtons();
  renderCategoryModalButtons();
  renderPaymentButtons();
  setPage("gastos");
  descriptionInput.focus();
}

function cloneMovement(movement) {
  movements.unshift({
    ...movement,
    id: uid(),
    createdAt: Date.now(),
  });
  saveMovements();
  renderAll();
}

function deleteMovement(id) {
  if (!confirm("¿Eliminar este movimiento?")) return;
  movements = movements.filter((m) => m.id !== id);
  saveMovements();
  if (editingId === id) resetForm();
  renderAll();
}

function clearAll() {
  if (!confirm("¿Eliminar todos los movimientos?")) return;
  movements = [];
  saveMovements();
  resetForm();
  renderAll();
}

function getStatsBaseData() {
  if (selectedMonth === "all") return movements;
  return movements.filter((m) => monthKeyFromDate(m.date) === selectedMonth);
}

function computeStats(data) {
  const income = data
    .filter((m) => m.type === "ingreso")
    .reduce((sum, m) => sum + Number(m.amount || 0), 0);

  const expense = data
    .filter((m) => m.type === "gasto")
    .reduce((sum, m) => sum + Number(m.amount || 0), 0);

  const balance = income - expense;

  return {
    income,
    expense,
    balance,
    count: data.length,
  };
}

function buildFilteredHistory() {
  const monthFiltered =
    selectedMonth === "all"
      ? [...movements]
      : movements.filter((m) => monthKeyFromDate(m.date) === selectedMonth);

  const term = searchInput.value.trim().toLowerCase();
  const typeVal = typeFilter.value;
  const paymentVal = paymentFilter.value;

  let filtered = monthFiltered.filter((m) => {
    const matchesTerm =
      !term ||
      [m.description, m.category, m.paymentMethod, m.type, m.date]
        .join(" ")
        .toLowerCase()
        .includes(term);

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

function renderSummaryStats() {
  const data = getStatsBaseData();
  const stats = computeStats(data);

  totalIncomeEl.textContent = money(stats.income);
  totalExpenseEl.textContent = money(stats.expense);
  totalBalanceEl.textContent = money(stats.balance);
  totalBalanceEl.className =
    stats.balance >= 0
      ? "balance-positive"
      : "balance-negative";
  totalCountEl.textContent = String(stats.count);
}

function renderMonthsOverview() {
  const groups = {};

  movements.forEach((movement) => {
    const key = monthKeyFromDate(movement.date);
    if (!key) return;

    if (!groups[key]) groups[key] = [];
    groups[key].push(movement);
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

    const signedAmount = movement.type === "ingreso" ? `+ ${money(movement.amount)}` : `- ${money(movement.amount)}`;

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
        <div class="amount ${movement.type}">${signedAmount}</div>
        <div class="btn-row">
          <button type="button" class="ghost" data-edit="${movement.id}">editar</button>
          <button type="button" class="ghost" data-dup="${movement.id}">duplicar</button>
          <button type="button" class="danger" data-del="${movement.id}">borrar</button>
        </div>
      </div>
    `;

    historyList.appendChild(row);
  });

  document.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const movement = movements.find((m) => m.id === btn.dataset.edit);
      if (movement) startEdit(movement);
    });
  });

  document.querySelectorAll("[data-dup]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const movement = movements.find((m) => m.id === btn.dataset.dup);
      if (movement) cloneMovement({
        ...movement,
        date: todayISO(),
      });
    });
  });

  document.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => deleteMovement(btn.dataset.del));
  });
}

function populateMonthFilter() {
  const months = getUniqueMonths();

  monthFilter.innerHTML = `
    <option value="all">todos los meses</option>
    ${months
      .map(
        (key) => `<option value="${key}">${monthLabel(key)}</option>`
      )
      .join("")}
  `;

  if (!monthFilter.querySelector(`option[value="${selectedMonth}"]`)) {
    selectedMonth = "all";
  }

  monthFilter.value = selectedMonth;
}

function renderAll() {
  populateMonthFilter();
  renderSummaryStats();
  renderMonthsOverview();
  renderHistory();
  renderTypeButtons();
  renderCategoryButtons();
  renderCategoryModalButtons();
  renderPaymentButtons();
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
    Monto: Number(m.amount),
  }));

  const monthlyMap = {};
  movements.forEach((m) => {
    const key = monthKeyFromDate(m.date);
    if (!key) return;
    if (!monthlyMap[key]) monthlyMap[key] = [];
    monthlyMap[key].push(m);
  });

  const monthlyRows = Object.keys(monthlyMap)
    .sort((a, b) => b.localeCompare(a))
    .map((key) => {
      const stats = computeStats(monthlyMap[key]);
      return {
        Mes: monthLabel(key),
        Ingresos: stats.income,
        Gastos: stats.expense,
        Balance: stats.balance,
        Movimientos: stats.count,
      };
    });

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(historyRows);
  const ws2 = XLSX.utils.json_to_sheet(monthlyRows);

  XLSX.utils.book_append_sheet(wb, ws1, "Historial");
  XLSX.utils.book_append_sheet(wb, ws2, "Resumen mensual");

  XLSX.writeFile(wb, `app-gastos-${todayISO()}.xlsx`);
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
    createdAt: Date.now(),
  };

  if (editingId) {
    movements = movements.map((m) => (m.id === editingId ? payload : m));
  } else {
    movements.unshift(payload);
  }

  saveMovements();

  descriptionInput.value = "";
  amountInput.value = "";
  dateInput.value = todayISO();
  editingId = null;
  editingBanner.classList.add("hidden");
  submitButton.textContent = "＋";

  renderAll();
});

cancelEditBtn.addEventListener("click", () => {
  resetForm();
});

clearAllBtn.addEventListener("click", clearAll);
exportExcelBtn.addEventListener("click", exportExcel);

monthFilter.addEventListener("change", () => {
  selectedMonth = monthFilter.value;
  renderSummaryStats();
  renderHistory();
});

searchInput.addEventListener("input", renderHistory);
typeFilter.addEventListener("change", renderHistory);
paymentFilter.addEventListener("change", renderHistory);
sortFilter.addEventListener("change", renderHistory);

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

renderTypeButtons();
resetForm();
renderAll();
setPage("gastos");
