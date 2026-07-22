const STORAGE_KEYS = [
  "app_gastos_simple_v2",
  "app_gastos_simple_v1",
  "app_gastos_v1",
  "app_gastos_v2"
];

const STORAGE_KEY = STORAGE_KEYS[0];

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

const pageGastos = document.getElementById("page-gastos");
const pageResumen = document.getElementById("page-resumen");
const pageHistorial = document.getElementById("page-historial");

const topLinks = document.querySelectorAll(".toplink");
const typeGroup = document.getElementById("typeGroup");
const categoryGroup = document.getElementById("categoryGroup");
const paymentGroup = document.getElementById("paymentGroup");
const exportExcelBtn = document.getElementById("exportExcelBtn");

let movements = loadMovements();
let editingId = null;
let activeType = "gasto";
let selectedCategory = "";
let selectedPayment = "Efectivo";
let customCategoryOnce = "";

const categoriesByType = {
  gasto: [
    { value: "Alquiler", icon: "home" },
    { value: "Servicios", icon: "lightbulb" },
    { value: "Pago de tarjetas", icon: "credit_card" },
    { value: "Medicina", icon: "medical_services" },
    { value: "Kiosko", icon: "storefront" },
    { value: "Ocio", icon: "sports_esports" },
    { value: "Varios", icon: "inventory_2" },
    { value: "Combustible", icon: "local_gas_station" },
    { value: "Supermercado", icon: "shopping_cart" }
  ],
  ingreso: [
    { value: "Sueldo", icon: "payments" },
    { value: "Transferencia", icon: "account_balance" },
    { value: "Otro ingreso", icon: "add_circle" }
  ]
};

const paymentMethods = [
  { value: "Efectivo", icon: "paid" },
  { value: "Débito", icon: "account_balance_wallet" },
  { value: "Crédito", icon: "credit_card" },
  { value: "Transferencia", icon: "account_balance" },
  { value: "Mercado Pago", icon: "smartphone" },
  { value: "Otro", icon: "more_horiz" }
];

function uid() {
  return window.crypto?.randomUUID?.() || String(Date.now() + Math.random());
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function setValue(el, value) {
  if (el) el.value = value;
}

function loadMovements() {
  for (const key of STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 0) {
        return parsed.map(normalizeMovement);
      }
    } catch {
      // ignore and continue with next key
    }
  }
  return [];
}

function saveMovements() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(movements));
}

function normalizeMovement(raw) {
  const dateValue = String(raw?.date ?? raw?.fecha ?? todayISO()).slice(0, 10);

  return {
    id: raw?.id ?? uid(),
    type: raw?.type ?? raw?.tipo ?? "gasto",
    description: raw?.description ?? raw?.detalle ?? "",
    amount: Number(raw?.amount ?? raw?.monto ?? 0),
    category: raw?.category ?? raw?.categoria ?? "",
    paymentMethod: raw?.paymentMethod ?? raw?.medio_pago ?? "",
    date: dateValue,
    createdAt: raw?.createdAt ?? raw?.created_at ?? Date.now()
  };
}

function iconSpan(name) {
  return `<span class="material-symbols-outlined">${name}</span>`;
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
  const str = String(iso).slice(0, 10);
  const parts = str.split("-");
  if (parts.length !== 3) return str;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function setSelectedButton(group, value) {
  if (!group) return;
  group.querySelectorAll(".icon-option").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.value === value);
  });
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
  const list = (categoriesByType[type] || []).map((item, index) => ({
    ...item,
    count: counts[item.value] || 0,
    order: index
  }));

  list.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    if (a.order !== b.order) return a.order - b.order;
    return String(a.value).localeCompare(String(b.value), "es");
  });

  return list;
}

function renderTypeButtons() {
  setSelectedButton(typeGroup, activeType);
}

function renderCategoryButtons() {
  if (!categoryGroup) return;

  const list = getSortedCategories(activeType);
  const customIsActive =
    customCategoryOnce && !list.some((item) => item.value === customCategoryOnce)
      ? customCategoryOnce
      : "";

  if (!list.some((item) => item.value === selectedCategory) && !customIsActive) {
    selectedCategory = list[0]?.value || "";
  }

  if (customIsActive) {
    selectedCategory = customIsActive;
  }

  categoryGroup.innerHTML = "";

  list.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `icon-option ${selectedCategory === item.value ? "selected" : ""}`;
    btn.dataset.value = item.value;
    btn.title = item.value;
    btn.setAttribute("aria-label", item.value);
    btn.innerHTML = `
      ${iconSpan(item.icon)}
      <span class="icon-name">${item.value}</span>
    `;
    categoryGroup.appendChild(btn);
  });

  const plusBtn = document.createElement("button");
  plusBtn.type = "button";
  plusBtn.className = `icon-option ${selectedCategory === customIsActive ? "selected" : ""}`;
  plusBtn.dataset.value = "__custom__";
  plusBtn.title = "Categoría excepcional";
  plusBtn.setAttribute("aria-label", "Categoría excepcional");
  plusBtn.innerHTML = `
    ${iconSpan("add")}
    <span class="icon-name">${customIsActive || "Otra"}</span>
  `;
  categoryGroup.appendChild(plusBtn);

  setValue(categoryInput, selectedCategory);
}

function renderPaymentButtons() {
  if (!paymentGroup) return;

  if (!paymentMethods.some((item) => item.value === selectedPayment)) {
    selectedPayment = paymentMethods[0]?.value || "Efectivo";
  }

  paymentGroup.innerHTML = "";

  paymentMethods.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `icon-option ${selectedPayment === item.value ? "selected" : ""}`;
    btn.dataset.value = item.value;
    btn.title = item.value;
    btn.setAttribute("aria-label", item.value);
    btn.innerHTML = `
      ${iconSpan(item.icon)}
      <span class="icon-name">${item.value}</span>
    `;
    paymentGroup.appendChild(btn);
  });

  setValue(paymentInput, selectedPayment);
}

function computeStats() {
  const income = movements
    .filter((m) => m.type === "ingreso")
    .reduce((sum, m) => sum + Number(m.amount || 0), 0);

  const expense = movements
    .filter((m) => m.type === "gasto")
    .reduce((sum, m) => sum + Number(m.amount || 0), 0);

  return {
    income,
    expense,
    balance: income - expense,
    count: movements.length
  };
}

function renderSummary() {
  const stats = computeStats();
  if (totalIncomeEl) totalIncomeEl.textContent = money(stats.income);
  if (totalExpenseEl) totalExpenseEl.textContent = money(stats.expense);
  if (totalBalanceEl) totalBalanceEl.textContent = money(stats.balance);
  if (totalCountEl) totalCountEl.textContent = String(stats.count);
}

function renderHistory() {
  if (!historyList) return;

  if (movements.length === 0) {
    historyList.innerHTML = '<div class="empty">Todavía no hay movimientos cargados.</div>';
    return;
  }

  historyList.innerHTML = "";

  movements.forEach((movement) => {
    const item = document.createElement("div");
    item.className = `movement ${movement.type === "ingreso" ? "ingreso" : "gasto"}`;
    item.innerHTML = `
      <div class="chips">
        <span class="chip ${movement.type === "ingreso" ? "ingreso" : "gasto"}">
          ${movement.type === "ingreso" ? "Ingreso" : "Gasto"}
        </span>
        <span class="chip">${movement.category}</span>
        <span class="chip">${movement.paymentMethod}</span>
        <span class="chip">${dateDisplay(movement.date)}</span>
      </div>
      <strong class="desc">${movement.description}</strong>
      <div class="movement-actions">
        <div class="amount ${movement.type === "ingreso" ? "ingreso" : "gasto"}">
          ${movement.type === "ingreso" ? "+" : "-"} ${money(movement.amount)}
        </div>
        <div class="btn-row">
          <button type="button" class="ghost" data-edit="${movement.id}">Editar</button>
          <button type="button" class="danger" data-del="${movement.id}">Borrar</button>
        </div>
      </div>
    `;
    historyList.appendChild(item);
  });
}

function renderAll() {
  renderTypeButtons();
  renderCategoryButtons();
  renderPaymentButtons();
  renderSummary();
  renderHistory();
}

function setPage(page) {
  if (pageGastos) pageGastos.classList.toggle("active", page === "gastos");
  if (pageResumen) pageResumen.classList.toggle("active", page === "resumen");
  if (pageHistorial) pageHistorial.classList.toggle("active", page === "historial");

  topLinks.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });
}

function resetForm() {
  editingId = null;
  setValue(descriptionInput, "");
  setValue(amountInput, "");
  setValue(dateInput, todayISO());

  activeType = "gasto";
  selectedCategory = categoriesByType.gasto[0]?.value || "";
  selectedPayment = paymentMethods[0]?.value || "Efectivo";
  customCategoryOnce = "";

  setValue(movementTypeInput, "gasto");
  setValue(categoryInput, selectedCategory);
  setValue(paymentInput, selectedPayment);

  renderAll();
}

function startEdit(movement) {
  editingId = movement.id;
  setValue(descriptionInput, movement.description);
  setValue(amountInput, movement.amount);
  setValue(dateInput, movement.date || todayISO());

  activeType = movement.type || "gasto";
  selectedCategory = movement.category || "";
  selectedPayment = movement.paymentMethod || "Efectivo";

  const categoryExists = (categoriesByType[activeType] || []).some(
    (c) => c.value === selectedCategory
  );
  customCategoryOnce = categoryExists ? "" : selectedCategory;

  setValue(movementTypeInput, activeType);
  setValue(categoryInput, selectedCategory);
  setValue(paymentInput, selectedPayment);

  renderAll();
  setPage("gastos");
}

function deleteMovement(id) {
  if (!confirm("¿Eliminar este movimiento?")) return;
  movements = movements.filter((m) => String(m.id) !== String(id));
  saveMovements();
  if (editingId && String(editingId) === String(id)) resetForm();
  renderAll();
}

function exportExcel() {
  if (typeof XLSX === "undefined") {
    alert("No se pudo cargar la librería de Excel.");
    return;
  }

  const rows = movements.map((m) => ({
    Fecha: dateDisplay(m.date),
    Tipo: m.type === "ingreso" ? "Ingreso" : "Gasto",
    Categoria: m.category,
    Detalle: m.description,
    "Medio de pago": m.paymentMethod,
    Monto: Number(m.amount)
  }));

  const stats = computeStats();

  const categoryTotals = {};
  movements.forEach((m) => {
    const key = m.category || "Sin categoría";
    categoryTotals[key] = (categoryTotals[key] || 0) + Number(m.amount || 0);
  });

  const categoryRows = Object.entries(categoryTotals).map(([Categoria, Monto]) => ({
    Categoria,
    Monto
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Historial");
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet([
      { Indicador: "Ingresos", Valor: stats.income },
      { Indicador: "Gastos", Valor: stats.expense },
      { Indicador: "Balance", Valor: stats.balance },
      { Indicador: "Movimientos", Valor: stats.count }
    ]),
    "Resumen"
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(categoryRows), "Categorias");

  XLSX.writeFile(wb, `gestor-de-gastos-${todayISO()}.xlsx`);
}

form?.addEventListener("submit", (e) => {
  e.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = Number(amountInput.value);

  if (!description || !amount || amount <= 0) return;

  const payload = {
    id: editingId || uid(),
    type: movementTypeInput.value || "gasto",
    description,
    amount,
    category: categoryInput.value || "",
    paymentMethod: paymentInput.value || "Efectivo",
    date: dateInput?.value || todayISO(),
    createdAt: editingId ? movements.find((m) => String(m.id) === String(editingId))?.createdAt || Date.now() : Date.now()
  };

  if (editingId) {
    movements = movements.map((m) => (String(m.id) === String(editingId) ? payload : m));
  } else {
    movements.unshift(payload);
  }

  saveMovements();
  resetForm();
});

typeGroup?.addEventListener("click", (e) => {
  const btn = e.target.closest(".icon-option");
  if (!btn) return;

  activeType = btn.dataset.value;
  setValue(movementTypeInput, activeType);
  customCategoryOnce = "";
  const nextCategories = getSortedCategories(activeType);
  selectedCategory = nextCategories[0]?.value || "";
  renderAll();
});

categoryGroup?.addEventListener("click", (e) => {
  const btn = e.target.closest(".icon-option");
  if (!btn) return;

  if (btn.dataset.value === "__custom__") {
    const value = prompt("Escribí la categoría excepcional");
    const cleanValue = value?.trim();

    if (!cleanValue) return;

    customCategoryOnce = cleanValue;
    selectedCategory = cleanValue;
    setValue(categoryInput, cleanValue);
    renderAll();
    return;
  }

  selectedCategory = btn.dataset.value;
  customCategoryOnce = "";
  setValue(categoryInput, selectedCategory);
  renderAll();
});

paymentGroup?.addEventListener("click", (e) => {
  const btn = e.target.closest(".icon-option");
  if (!btn) return;

  selectedPayment = btn.dataset.value;
  setValue(paymentInput, selectedPayment);
  renderAll();
});

historyList?.addEventListener("click", (e) => {
  const editBtn = e.target.closest("[data-edit]");
  const delBtn = e.target.closest("[data-del]");

  if (editBtn) {
    const movement = movements.find((m) => String(m.id) === String(editBtn.dataset.edit));
    if (movement) startEdit(movement);
    return;
  }

  if (delBtn) {
    deleteMovement(delBtn.dataset.del);
  }
});

topLinks.forEach((btn) => {
  btn.addEventListener("click", () => setPage(btn.dataset.page));
});

exportExcelBtn?.addEventListener("click", exportExcel);

setValue(dateInput, todayISO());
setPage("gastos");
renderAll();
