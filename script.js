import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://miiskclwrvbmgqkdswro.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_PkTLIcz-j9wyXkuTjp_yvg_t8coIacO";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
const monthFilter = document.getElementById("monthFilter");
let selectedMonth = currentMonthKey();

let movements = [];
let editingId = null;
let activeType = "gasto";
let selectedCategory = "";
let customCategoryOnce = "";
let selectedPayment = "Efectivo";
let categoriesByType = { gasto: [], ingreso: [] };
let paymentMethods = [];
let bootstrapped = false;

function uid() {
  return window.crypto?.randomUUID?.() || String(Date.now() + Math.random());
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function setSelectedButton(group, value) {
  group.querySelectorAll(".icon-option").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.value === value);
  });
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
  const str = String(iso);
  return str.length >= 10 ? str.slice(0, 10).split("-").reverse().join("/") : str;
}

function currentMonthKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

function getMovementDate(m) {
  return String(m.fecha ?? m.date ?? "").slice(0, 10);
}

function monthKeyFromMovement(m) {
  const date = getMovementDate(m);
  return date ? date.slice(0, 7) : "";
}

function monthLabel(monthKey) {
  if (!monthKey) return "Sin fecha";
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  const label = d.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric"
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function populateMonthFilter() {
  const months = [...new Set(movements.map(monthKeyFromMovement).filter(Boolean))]
    .sort((a, b) => b.localeCompare(a));

  monthFilter.innerHTML = "";

  if (!months.includes(selectedMonth)) {
    selectedMonth = currentMonthKey();
  }

  const currentOption = document.createElement("option");
  currentOption.value = selectedMonth;
  currentOption.textContent = monthLabel(selectedMonth);
  monthFilter.appendChild(currentOption);

  months
    .filter((m) => m !== selectedMonth)
    .forEach((key) => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = monthLabel(key);
      monthFilter.appendChild(option);
    });

  monthFilter.value = selectedMonth;
}

function dateForInput(value) {
  if (!value) return todayISO();
  const str = String(value);
  return str.length >= 10 ? str.slice(0, 10) : todayISO();
}

function normalizeRow(row) {
  return {
    id: row.id,
    created_at: row.created_at,
    fecha: row.fecha,
    type: row.tipo,
    description: row.detalle,
    amount: Number(row.monto),
    category: row.categoria,
    paymentMethod: row.medio_pago
  };
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

async function loadReferenceData() {
  const [{ data: catData, error: catError }, { data: payData, error: payError }] = await Promise.all([
    supabase
      .from("categorias")
      .select("tipo, nombre, icono, orden, activa")
      .eq("activa", true)
      .order("orden", { ascending: true }),
    supabase
      .from("medios_pago")
      .select("nombre, icono, orden, activa")
      .eq("activa", true)
      .order("orden", { ascending: true })
  ]);

  if (catError) throw catError;
  if (payError) throw payError;

  categoriesByType = {
    gasto: (catData || [])
      .filter((item) => item.tipo === "gasto")
      .map((item) => ({
        value: item.nombre,
        icon: item.icono,
        order: item.orden ?? 0
      })),
    ingreso: (catData || [])
      .filter((item) => item.tipo === "ingreso")
      .map((item) => ({
        value: item.nombre,
        icon: item.icono,
        order: item.orden ?? 0
      }))
  };

  paymentMethods = (payData || []).map((item) => ({
    value: item.nombre,
    icon: item.icono,
    order: item.orden ?? 0
  }));

  if (!categoriesByType.gasto.length) {
    categoriesByType.gasto = [
      { value: "Ocio", icon: "sports_esports" },
      { value: "Alquiler", icon: "home", order: 1 },
      { value: "Servicios", icon: "lightbulb", order: 2 },
      { value: "Pago de tarjetas", icon: "credit_card", order: 3 },
      { value: "Medicina", icon: "medical_services", order: 4 },
      { value: "Kiosko", icon: "storefront", order: 5 },
      { value: "Varios", icon: "inventory_2", order: 6 },
      { value: "Combustible", icon: "local_gas_station", order: 7 },
      { value: "Supermercado", icon: "shopping_cart", order: 8 }
    ];
  }

  if (!categoriesByType.ingreso.length) {
    categoriesByType.ingreso = [
      { value: "Sueldo", icon: "payments", order: 1 },
      { value: "Transferencia", icon: "account_balance", order: 2 },
      { value: "Otro ingreso", icon: "add_circle", order: 3 }
    ];
  }

  if (!paymentMethods.length) {
    paymentMethods = [
      { value: "Efectivo", icon: "paid", order: 1 },
      { value: "Débito", icon: "account_balance_wallet", order: 2 },
      { value: "Crédito", icon: "credit_card", order: 3 },
      { value: "Transferencia", icon: "account_balance", order: 4 },
      { value: "Mercado Pago", icon: "smartphone", order: 5 },
      { value: "Otro", icon: "more_horiz", order: 6 }
    ];
  }
}

async function loadMovements() {
  const { data, error } = await supabase
    .from("movimientos")
    .select("id, created_at, fecha, tipo, detalle, monto, categoria, medio_pago")
    .order("fecha", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  movements = (data || []).map(normalizeRow);
}

function renderTypeButtons() {
  setSelectedButton(typeGroup, activeType);
}

function renderCategoryButtons() {
  const list = getSortedCategories(activeType);
  const customIsActive =
    customCategoryOnce && !list.some((item) => item.value === customCategoryOnce)
      ? customCategoryOnce
      : "";

  if (!list.some((item) => item.value === selectedCategory) && !customIsActive) {
    selectedCategory = list[0]?.value || "";
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

  categoryInput.value = selectedCategory;
}

function renderPaymentButtons() {
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

  paymentInput.value = selectedPayment;
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
  totalIncomeEl.textContent = money(stats.income);
  totalExpenseEl.textContent = money(stats.expense);
  totalBalanceEl.textContent = money(stats.balance);
  totalCountEl.textContent = String(stats.count);
}

function renderHistory() {
  if (movements.length === 0) {
    historyList.innerHTML = '<div class="empty">Todavía no hay movimientos cargados.</div>';
    return;
  }

  historyList.innerHTML = "";

  movements.forEach((movement) => {
    const item = document.createElement("div");
    item.className = `movement ${movement.type}`;
    item.innerHTML = `
      <div class="chips">
        <span class="chip ${movement.type}">${movement.type === "ingreso" ? "Ingreso" : "Gasto"}</span>
        <span class="chip">${movement.category}</span>
        <span class="chip">${movement.paymentMethod}</span>
        <span class="chip">${dateDisplay(movement.fecha)}</span>
      </div>
      <strong class="desc">${movement.description}</strong>
      <div class="movement-actions">
        <div class="amount ${movement.type}">
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
  populateMonthFilter();
  renderTypeButtons();
  renderCategoryButtons();
  renderPaymentButtons();
  renderSummary();
  renderHistory();
}

function setPage(page) {
  const isAdd = page === "gastos";
  pageGastos.classList.toggle("active", isAdd);
  pageResumen.classList.toggle("active", !isAdd);

  topLinks.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });
}

function resetForm() {
  editingId = null;
  customCategoryOnce = "";
  descriptionInput.value = "";
  amountInput.value = "";
  dateInput.value = todayISO();
  activeType = "gasto";
  selectedCategory = categoriesByType.gasto[0]?.value || "";
  selectedPayment = paymentMethods[0]?.value || "Efectivo";
  movementTypeInput.value = "gasto";
  categoryInput.value = selectedCategory;
  paymentInput.value = selectedPayment;
  renderAll();
}

function startEdit(movement) {
  editingId = movement.id;
  descriptionInput.value = movement.description;
  amountInput.value = movement.amount;
  dateInput.value = dateForInput(movement.fecha);
  activeType = movement.type;
  selectedCategory = movement.category;
  selectedPayment = movement.paymentMethod;
  movementTypeInput.value = movement.type;
  categoryInput.value = movement.category;
  paymentInput.value = movement.paymentMethod;
  renderAll();
  setPage("gastos");
}

async function deleteMovement(id) {
  if (!confirm("¿Eliminar este movimiento?")) return;

  const { error } = await supabase.from("movimientos").delete().eq("id", id);
  if (error) {
    alert(error.message);
    return;
  }

  if (editingId === id) resetForm();
  await refreshData();
}

function exportExcel() {
  if (typeof XLSX === "undefined") {
    alert("No se pudo cargar la librería de Excel.");
    return;
  }

  const rows = movements.map((m) => ({
    Fecha: dateDisplay(m.fecha),
    Tipo: m.type === "ingreso" ? "Ingreso" : "Gasto",
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

  XLSX.writeFile(wb, `gestor-de-gastos-${todayISO()}.xlsx`);
}

async function refreshData() {
  await loadMovements();
  renderAll();
}

async function bootstrap() {
  if (bootstrapped) return;
  bootstrapped = true;
  dateInput.value = todayISO();
  await loadReferenceData();
  await refreshData();
  selectedCategory = getSortedCategories(activeType)[0]?.value || selectedCategory;
  selectedPayment = paymentMethods[0]?.value || selectedPayment;
  renderAll();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = Number(amountInput.value);

  if (!description || !amount || amount <= 0) return;

  const payload = {
    fecha: dateInput.value || todayISO(),
    tipo: movementTypeInput.value,
    detalle: description,
    monto: amount,
    categoria: categoryInput.value,
    medio_pago: paymentInput.value
  };

  let error = null;

  if (editingId) {
    ({ error } = await supabase.from("movimientos").update(payload).eq("id", editingId));
  } else {
    ({ error } = await supabase.from("movimientos").insert([payload]));
  }

  if (error) {
    alert(error.message);
    return;
  }

  await refreshData();
  resetForm();
});

typeGroup.addEventListener("click", (e) => {
  const btn = e.target.closest(".icon-option");
  if (!btn) return;

  activeType = btn.dataset.value;
  movementTypeInput.value = activeType;
  const nextCategories = getSortedCategories(activeType);
  selectedCategory = nextCategories[0]?.value || "";
  renderAll();
});

categoryGroup.addEventListener("click", (e) => {
  const btn = e.target.closest(".icon-option");
  if (!btn) return;

  if (btn.dataset.value === "__custom__") {
    const value = prompt("Escribí la categoría excepcional");
    const cleanValue = value?.trim();

    if (!cleanValue) return;

    customCategoryOnce = cleanValue;
    selectedCategory = cleanValue;
    categoryInput.value = cleanValue;
    renderAll();
    return;
  }

  selectedCategory = btn.dataset.value;
  customCategoryOnce = "";
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
    const movement = movements.find((m) => String(m.id) === String(editBtn.dataset.edit));
    if (movement) startEdit(movement);
    customCategoryOnce = categoriesByType[activeType]?.some((c) => c.value === movement.category)
  ? ""
  : movement.category;
    return;
  }

  if (delBtn) {
    deleteMovement(delBtn.dataset.del);
  }
});

topLinks.forEach((btn) => {
  btn.addEventListener("click", () => setPage(btn.dataset.page));
});

exportExcelBtn.addEventListener("click", exportExcel);

dateInput.value = todayISO();
setPage("gastos");

await loadReferenceData();
await refreshData();
selectedCategory = getSortedCategories(activeType)[0]?.value || "";
selectedPayment = paymentMethods[0]?.value || "Efectivo";
renderAll();

const pageHistorial = document.getElementById("page-historial");
const historyMonthlyList = document.getElementById("historyMonthlyList");
const monthHistoryFilter = document.getElementById("monthHistoryFilter");
const typeHistoryFilter = document.getElementById("typeHistoryFilter");
const paymentHistoryFilter = document.getElementById("paymentHistoryFilter");
const categoryHistoryFilter = document.getElementById("categoryHistoryFilter");
const searchHistoryInput = document.getElementById("searchHistoryInput");
const sortHistoryFilter = document.getElementById("sortHistoryFilter");
const resetHistoryFilters = document.getElementById("resetHistoryFilters");

function getMovementDate(m) {
  return String(m.fecha ?? m.date ?? "").slice(0, 10);
}

function getMovementType(m) {
  return String(m.type ?? m.tipo ?? "");
}

function getMovementDescription(m) {
  return String(m.description ?? m.detalle ?? "");
}

function getMovementCategory(m) {
  return String(m.category ?? m.categoria ?? "");
}

function getMovementPayment(m) {
  return String(m.paymentMethod ?? m.medio_pago ?? "");
}

function getMovementAmount(m) {
  return Number(m.amount ?? m.monto ?? 0);
}

function monthKeyFromMovement(m) {
  const date = getMovementDate(m);
  return date ? date.slice(0, 7) : "";
}

function monthLabel(monthKey) {
  if (!monthKey) return "Sin fecha";
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(year, month - 1, 1);
  const label = d.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric"
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function computeStatsForList(list) {
  const income = list
    .filter((m) => getMovementType(m) === "ingreso")
    .reduce((sum, m) => sum + getMovementAmount(m), 0);

  const expense = list
    .filter((m) => getMovementType(m) === "gasto")
    .reduce((sum, m) => sum + getMovementAmount(m), 0);

  return {
    income,
    expense,
    balance: income - expense,
    count: list.length
  };
}

function setSelectValueIfExists(selectEl, value) {
  const exists = Array.from(selectEl.options).some((opt) => opt.value === value);
  selectEl.value = exists ? value : "all";
}

function populateHistoryFilters() {
  const currentMonth = monthHistoryFilter.value || "all";
  const currentType = typeHistoryFilter.value || "all";
  const currentPayment = paymentHistoryFilter.value || "all";
  const currentCategory = categoryHistoryFilter.value || "all";
  const currentSort = sortHistoryFilter.value || "newest";

  const months = [...new Set(movements.map(monthKeyFromMovement).filter(Boolean))]
    .sort((a, b) => b.localeCompare(a));

  monthHistoryFilter.innerHTML =
    `<option value="all">Todos los meses</option>` +
    months.map((key) => `<option value="${key}">${monthLabel(key)}</option>`).join("");

  monthHistoryFilter.value = currentMonth;

  const paymentValues = [...new Set(movements.map(getMovementPayment).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "es"));

  paymentHistoryFilter.innerHTML =
    `<option value="all">Todos los pagos</option>` +
    paymentValues.map((value) => `<option value="${value}">${value}</option>`).join("");

  setSelectValueIfExists(paymentHistoryFilter, currentPayment);

  const categoryValues = [...new Set(movements.map(getMovementCategory).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "es"));

  categoryHistoryFilter.innerHTML =
    `<option value="all">Todas las categorías</option>` +
    categoryValues.map((value) => `<option value="${value}">${value}</option>`).join("");

  setSelectValueIfExists(categoryHistoryFilter, currentCategory);

  typeHistoryFilter.value = currentType;
  sortHistoryFilter.value = currentSort;
}

function buildFilteredHistory() {
  let list = [...movements];

  if (monthHistoryFilter.value !== "all") {
    list = list.filter((m) => monthKeyFromMovement(m) === monthHistoryFilter.value);
  }

  if (typeHistoryFilter.value !== "all") {
    list = list.filter((m) => getMovementType(m) === typeHistoryFilter.value);
  }

  if (paymentHistoryFilter.value !== "all") {
    list = list.filter((m) => getMovementPayment(m) === paymentHistoryFilter.value);
  }

  if (categoryHistoryFilter.value !== "all") {
    list = list.filter((m) => getMovementCategory(m) === categoryHistoryFilter.value);
  }

  const term = searchHistoryInput.value.trim().toLowerCase();
  if (term) {
    list = list.filter((m) => {
      const haystack = [
        getMovementDescription(m),
        getMovementCategory(m),
        getMovementPayment(m),
        getMovementDate(m),
        getMovementType(m)
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }

  switch (sortHistoryFilter.value) {
    case "oldest":
      list.sort((a, b) => getMovementDate(a).localeCompare(getMovementDate(b)));
      break;
    case "amount_desc":
      list.sort((a, b) => getMovementAmount(b) - getMovementAmount(a));
      break;
    case "amount_asc":
      list.sort((a, b) => getMovementAmount(a) - getMovementAmount(b));
      break;
    case "newest":
    default:
      list.sort((a, b) => getMovementDate(b).localeCompare(getMovementDate(a)));
      break;
  }

  return list;
}

function createHistoryCard(movement) {
  const type = getMovementType(movement) === "ingreso" ? "ingreso" : "gasto";

  const card = document.createElement("div");
  card.className = `movement ${type}`;
  card.innerHTML = `
    <div class="chips">
      <span class="chip ${type}">${type === "ingreso" ? "Ingreso" : "Gasto"}</span>
      <span class="chip">${getMovementCategory(movement)}</span>
      <span class="chip">${getMovementPayment(movement)}</span>
      <span class="chip">${dateDisplay(getMovementDate(movement))}</span>
    </div>

    <strong class="desc">${getMovementDescription(movement)}</strong>

    <div class="movement-actions">
      <div class="amount ${type}">
        ${type === "ingreso" ? "+" : "-"} ${money(getMovementAmount(movement))}
      </div>
      <div class="btn-row">
        <button type="button" class="ghost" data-edit="${movement.id}">Editar</button>
        <button type="button" class="danger" data-del="${movement.id}">Borrar</button>
      </div>
    </div>
  `;
  return card;
}

function renderHistoryPage() {
  if (!historyMonthlyList) return;

  populateHistoryFilters();

  const filtered = buildFilteredHistory();

  if (filtered.length === 0) {
    historyMonthlyList.innerHTML = '<div class="empty">No hay movimientos con esos filtros.</div>';
    return;
  }

  const grouped = {};
  filtered.forEach((movement) => {
    const key = monthKeyFromMovement(movement) || "sin-fecha";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(movement);
  });

  const monthKeys = Object.keys(grouped).sort((a, b) => {
    if (a === "sin-fecha") return 1;
    if (b === "sin-fecha") return -1;
    return b.localeCompare(a);
  });

  historyMonthlyList.innerHTML = "";

  monthKeys.forEach((key) => {
    const items = grouped[key];
    const stats = computeStatsForList(items);

    const block = document.createElement("div");
    block.className = "month-block";
    block.innerHTML = `
      <div class="month-head">
        <div>
          <div class="month-title">${key === "sin-fecha" ? "Sin fecha" : monthLabel(key)}</div>
          <div class="muted">${items.length} movimientos</div>
        </div>
        <div class="month-balance">${money(stats.balance)}</div>
      </div>

      <div class="month-stats">
        <div class="mini-stat">
          <span>ingresos</span>
          <strong>${money(stats.income)}</strong>
        </div>
        <div class="mini-stat">
          <span>gastos</span>
          <strong>${money(stats.expense)}</strong>
        </div>
        <div class="mini-stat">
          <span>balance</span>
          <strong>${money(stats.balance)}</strong>
        </div>
      </div>

      <div class="list month-list"></div>
    `;

    const listEl = block.querySelector(".month-list");
    items.forEach((movement) => listEl.appendChild(createHistoryCard(movement)));

    historyMonthlyList.appendChild(block);
  });
}

function updateHistoryTabUI() {
  renderHistoryPage();
}

const originalSetPage = setPage;
setPage = function (page) {
  originalSetPage(page);

  if (page === "historial") {
    renderHistoryPage();
  }
};

const originalRenderAll = renderAll;
renderAll = function () {
  originalRenderAll();
  renderHistoryPage();
};

monthHistoryFilter?.addEventListener("change", renderHistoryPage);
typeHistoryFilter?.addEventListener("change", renderHistoryPage);
paymentHistoryFilter?.addEventListener("change", renderHistoryPage);
categoryHistoryFilter?.addEventListener("change", renderHistoryPage);
sortHistoryFilter?.addEventListener("change", renderHistoryPage);
searchHistoryInput?.addEventListener("input", renderHistoryPage);

resetHistoryFilters?.addEventListener("click", () => {
  monthHistoryFilter.value = "all";
  typeHistoryFilter.value = "all";
  paymentHistoryFilter.value = "all";
  categoryHistoryFilter.value = "all";
  searchHistoryInput.value = "";
  sortHistoryFilter.value = "newest";
  renderHistoryPage();
});
