const STORAGE_KEY = "app_gastos_v3";

const form = document.getElementById("expenseForm");
const description = document.getElementById("description");
const amount = document.getElementById("amount");
const date = document.getElementById("date");
const movementType = document.getElementById("movementType");
const categoryInput = document.getElementById("category");
const paymentInput = document.getElementById("paymentMethod");

const expenseList = document.getElementById("expenseList");
const summary = document.getElementById("summary");
const totalBalance = document.getElementById("totalBalance");
const totalCount = document.getElementById("totalCount");
const clearButton = document.getElementById("clearButton");

const pageGastos = document.getElementById("page-gastos");
const pageResumen = document.getElementById("page-resumen");
const topLinks = document.querySelectorAll(".toplink");

const typeGroup = document.getElementById("typeGroup");
const categoryGroup = document.getElementById("categoryGroup");
const paymentGroup = document.getElementById("paymentGroup");

date.value = new Date().toISOString().split("T")[0];

const categoryOptions = {
  gasto: [
    { value: "Comida", icon: "🍔" },
    { value: "Transporte", icon: "🚌" },
    { value: "Casa", icon: "🏠" },
    { value: "Trabajo", icon: "🧰" },
    { value: "Salud", icon: "🩺" }
  ],
  ingreso: [
    { value: "Sueldo", icon: "💰" },
    { value: "Transferencia", icon: "🏦" },
    { value: "Otro ingreso", icon: "➕" },
    { value: "Ajuste", icon: "🧾" },
    { value: "Extra", icon: "⭐" }
  ]
};

const paymentOptions = [
  { value: "Efectivo", icon: "💵" },
  { value: "Débito", icon: "💳" },
  { value: "Crédito", icon: "🪪" },
  { value: "Transferencia", icon: "🏦" }
];

let expenses = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function money(value) {
  return Number(value || 0).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS"
  });
}

function setPage(page) {
  const isGastos = page === "gastos";
  pageGastos.classList.toggle("active", isGastos);
  pageResumen.classList.toggle("active", !isGastos);

  topLinks.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.page === page);
  });
}

function setSelectedButton(group, value) {
  group.querySelectorAll(".icon-option").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.value === value);
  });
}

function renderCategoryButtons() {
  categoryGroup.innerHTML = "";
  const type = movementType.value;
  const options = categoryOptions[type];

  options.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `icon-option ${index === 0 ? "selected" : ""}`;
    button.dataset.value = item.value;
    button.textContent = item.icon;

    button.addEventListener("click", () => {
      setSelectedButton(categoryGroup, item.value);
      categoryInput.value = item.value;
    });

    categoryGroup.appendChild(button);
  });

  categoryInput.value = options[0].value;
}

function renderPaymentButtons() {
  paymentGroup.innerHTML = "";

  paymentOptions.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `icon-option ${index === 0 ? "selected" : ""}`;
    button.dataset.value = item.value;
    button.textContent = item.icon;

    button.addEventListener("click", () => {
      setSelectedButton(paymentGroup, item.value);
      paymentInput.value = item.value;
    });

    paymentGroup.appendChild(button);
  });

  paymentInput.value = paymentOptions[0].value;
}

function renderTypeButtons() {
  typeGroup.querySelectorAll(".icon-option").forEach((button) => {
    button.addEventListener("click", () => {
      const newType = button.dataset.value;
      movementType.value = newType;
      setSelectedButton(typeGroup, newType);
      renderCategoryButtons();
    });
  });
}

function render() {
  if (expenses.length === 0) {
    expenseList.innerHTML = '<div class="empty">Todavía no hay movimientos cargados.</div>';
    summary.innerHTML = '<div class="empty">Cargá movimientos para ver el desglose.</div>';
    totalBalance.textContent = "$0";
    totalCount.textContent = "0";
    return;
  }

  let balance = 0;
  const groups = {};

  expenseList.innerHTML = "";

  expenses.forEach((item, index) => {
    const sign = item.type === "ingreso" ? 1 : -1;
    const signedAmount = sign * item.amount;
    balance += signedAmount;

    const key = `${item.type}-${item.category}`;
    if (!groups[key]) {
      groups[key] = {
        label: item.category,
        type: item.type,
        total: 0
      };
    }
    groups[key].total += signedAmount;

    const card = document.createElement("div");
    card.className = "expense";

    card.innerHTML = `
      <div class="chips">
        <span class="chip">${item.type === "ingreso" ? "ingreso" : "gasto"}</span>
        <span class="chip">${item.category}</span>
        <span class="chip">${item.payment}</span>
        <span class="chip">${item.date}</span>
      </div>
      <strong class="desc">${item.description}</strong>
      <div class="expense-actions">
        <strong class="amount">${item.type === "ingreso" ? "+" : "-"} ${money(item.amount)}</strong>
        <button class="danger" type="button" data-delete="${index}">borrar</button>
      </div>
    `;

    expenseList.appendChild(card);
  });

  totalBalance.textContent = money(balance);
  totalCount.textContent = expenses.length;

  summary.innerHTML = "";

  Object.values(groups).forEach((item) => {
    const row = document.createElement("div");
    row.className = "summary-item";
    row.innerHTML = `
      <span>${item.label} (${item.type === "ingreso" ? "ingreso" : "gasto"})</span>
      <strong>${money(item.total)}</strong>
    `;
    summary.appendChild(row);
  });

  document.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.delete);
      if (confirm("¿Eliminar este movimiento?")) {
        expenses.splice(index, 1);
        save();
        render();
      }
    });
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const cleanDescription = description.value.trim();
  const cleanAmount = Number(amount.value);

  if (!cleanDescription || !cleanAmount || cleanAmount <= 0) return;

  expenses.unshift({
    description: cleanDescription,
    amount: cleanAmount,
    category: categoryInput.value,
    payment: paymentInput.value,
    type: movementType.value,
    date: date.value || new Date().toISOString().split("T")[0]
  });

  save();
  render();

  description.value = "";
  amount.value = "";
  date.value = new Date().toISOString().split("T")[0];

  renderCategoryButtons();
  renderPaymentButtons();
  setPage("resumen");
});

clearButton.addEventListener("click", () => {
  if (confirm("¿Eliminar TODOS los movimientos?")) {
    expenses = [];
    save();
    render();
  }
});

topLinks.forEach((btn) => {
  btn.addEventListener("click", () => setPage(btn.dataset.page));
});

renderTypeButtons();
renderCategoryButtons();
renderPaymentButtons();
render();
setPage("gastos");
