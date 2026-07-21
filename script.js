const STORAGE_KEY = "app_gastos_simple_v2";

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
const topLinks = document.querySelectorAll(".toplink");

const typeGroup = document.getElementById("typeGroup");
const categoryGroup = document.getElementById("categoryGroup");
const paymentGroup = document.getElementById("paymentGroup");
const exportExcelBtn = document.getElementById("exportExcelBtn");

const categoriesByType = {
  gasto: [
    { value: "Alquiler", icon: "home" },
    { value: "Servicios", icon: "lightbulb" },
    { value: "Pago de tarjetas", icon: "credit_card" },
    { value: "Medicina", icon: "medical_services" },
    { value: "Kiosko", icon: "storefront" },
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
  { value: "Débito", icon: "debit_card" },
  { value: "Crédito", icon: "credit_card" },
  { value: "Transferencia", icon: "account_balance" },
  { value: "Mercado Pago", icon: "smartphone" },
  { value: "Otro", icon: "more_horiz" }
];

let movements = loadMovements();
let activeType = "gasto";
let selectedCategory = categoriesByType.gasto[0].value;
let selectedPayment = "Efectivo";
let editingId = null;

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

function dateISO() {
  return new Date().toISOString().slice(0, 10);
}

function dateDisplay(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function setSelectedButton(group, value) {
  group.querySelectorAll(".icon-option").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.value === value);
  });
}

function iconSpan(name) {
  return `<span class="material-symbols-outlined">${name}</span>`;
}

function renderTypeButtons() {
  setSelectedButton(typeGroup, activeType);
}

function renderCategoryButtons() {
  const list = categoriesByType[activeType];
  if (!list.some((item) => item.value === selectedCategory)) {
    selectedCategory = list[0].value;
  }

  categoryGroup.innerHTML = "";

  list.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `icon-option ${selectedCategory === item.value ? "selected" : ""}`;
    btn.dataset.value = item.value;
    btn.innerHTML = `
      ${iconSpan(item.icon)}
      <span class="btn-label">${item.value}</span>
    `;
    categoryGroup.appendChild(btn);
  });

  categoryInput.value = selectedCategory;
}

function renderPaymentButtons() {
  if (!paymentMethods.some((item) => item.value === selectedPayment)) {
    selectedPayment = "Efectivo";
  }

  paymentGroup.innerHTML = "";

  paymentMethods.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `icon-option ${selectedPayment === item.value ? "selected" : ""}`;
    btn.dataset.value = item.value;
    btn.innerHTML = `
      ${iconSpan(item.icon)}
      <span class="btn-label">${item.value}</span>
    `;
    paymentGroup.appendChild(btn);
  });

  paymentInput.value = selectedPayment;
}

function computeStats() {
  const income = movements
    .filter((m) => m.type === "ingreso")
    .reduce((sum, m) => sum + Number(m.amount || 0), 0);

  const expense = movements
    .filter((m) => m.type === "gasto")
    .reduce((sum, m) => sum + Number(m.amount || 0), 0);

  const balance = income - expense;

  return {
    income,
    expense,
    balance,
    count: movements.length
  };
}

function renderSummary() {
  const stats = computeStats();
  totalIncomeEl.textContent = money(stats.income);
  totalExpenseEl.textContent = money(stats.expense);
  totalBalanceEl.textContent = money(stats.balance);
  totalCountEl.textContent = String(stats.count);
}

function renderHistory() {
  if (movements.length === 0) {
    historyList.innerHTML = '<div class="empty">todavía no hay movimientos cargados.</div>';
    return;
  }

  historyList.innerHTML = "";

  movements.forEach((movement) => {
    const item = document.createElement("div");
    item.className = `movement ${movement.type}`;
    item.innerHTML = `
      <div class="chips">
        <span class="chip ${movement.type}">${movement.type}</span>
        <span class="chip">${movement.category}</span>
        <span class="chip">${movement.paymentMethod}</span>
        <span class="chip">${dateDisplay(movement.date)}</span>
      </div>
      <strong class="desc">${movement.description}</strong>
      <div class="movement-actions">
        <div class="amount ${movement.type}">
          ${movement.type === "ingreso" ? "+" : "-"} ${money(movement.amount)}
        </div>
        <div class="btn-row">
          <button type="button" class="ghost" data-edit="${movement.id}">editar</button>
          <button type="button" class="danger" data-del="${movement.id}">borrar</button>
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

function resetForm() {
  editingId = null;
  descriptionInput.value = "";
  amountInput.value = "";
  dateInput.value = dateISO();
  activeType = "gasto";
  selectedCategory = categoriesByType.gasto[0].value;
  selectedPayment = "Efectivo";
  movementTypeInput.value = "gasto";
  categoryInput.value = selectedCategory;
  paymentInput.value = selectedPayment;
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
  movementTypeInput.value = movement.type;
  categoryInput.value = movement.category;
  paymentInput.value = movement.paymentMethod;
  renderAll();
  setPage("gastos");
}

function deleteMovement(id) {
  if (!confirm("¿Eliminar este movimiento?")) return;
  movements = movements.filter((m) => m.id !== id);
  saveMovements();
  if (editingId === id) resetForm();
  renderAll();
}

function exportExcel() {
  if (typeof XLSX === "undefined") {
    alert("No se pudo cargar la librería de Excel.");
    return;
  }

  const rows = movements.map((m) => ({
    Fecha: dateDisplay(m.date),
    Tipo: m.type,
    Categoria: m.category,
    Detalle: m.description,
    "Medio de pago": m.paymentMethod,
    Monto: Number(m.amount)
  }));

  const summary = computeStats();

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(rows);
  const ws2 = XLSX.utils.json_to_sheet([summary]);

  XLSX.utils.book_append_sheet(wb, ws1, "Historial");
  XLSX.utils.book_append_sheet(wb, ws2, "Resumen");

  XLSX.writeFile(wb, `app-gastos-${dateISO()}.xlsx`);
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
    date: dateInput.value || dateISO()
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

  activeType = btn.dataset.value;
  movementTypeInput.value = activeType;
  selectedCategory = categoriesByType[activeType][0].value;
  renderAll();
});

categoryGroup.addEventListener("click", (e) => {
  const btn = e.target.closest(".icon-option");
  if (!btn) return;

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

historyList.addEventListener("click", (e) => {
  const editBtn = e.target.closest("[data-edit]");
  const delBtn = e.target.closest("[data-del]");

  if (editBtn) {
    const movement = movements.find((m) => m.id === editBtn.dataset.edit);
    if (movement) startEdit(movement);
  }

  if (delBtn) {
    deleteMovement(delBtn.dataset.del);
  }
});

topLinks.forEach((btn) => {
  btn.addEventListener("click", () => setPage(btn.dataset.page));
});

exportExcelBtn.addEventListener("click", exportExcel);

dateInput.value = dateISO();
setPage("gastos");
renderAll();
