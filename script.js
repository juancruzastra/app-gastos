const STORAGE_KEY = "app_gastos_v2";

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
    { value: "Salud", icon: "🩺" },
    { value: "Otros", icon: "🧾" }
  ],
  ingreso: [
    { value: "Sueldo", icon: "💰" },
    { value: "Transferencia", icon: "🏦" },
    { value: "Otro ingreso", icon: "➕" }
  ]
};

const paymentOptions = [
  { value: "Efectivo", icon: "💵" },
  { value: "Débito", icon: "💳" },
  { value: "Crédito", icon: "🪪" },
  { value: "Transferencia", icon: "🏦" },
  { value: "Mercado Pago", icon: "📲" },
  { value: "Otro", icon: "⋯" }
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

function setSelectedButton(group, value) {
  const buttons = group.querySelectorAll(".icon-option");
  buttons.forEach((btn) => {
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
    button.innerHTML = `${item.icon} ${item.value}`;

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
    button.innerHTML = `${item.icon} ${item.value}`;

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
    expenseList.innerHTML =
      '<div class="empty">Todavía no hay movimientos cargados.</div>';

    summary.innerHTML =
      '<div class="empty">Cargá movimientos para ver el resumen.</div>';

    totalBalance.textContent = "$0";
    totalCount.textContent = "0";
    return;
  }

  let balance = 0;
  let categories = {};

  expenseList.innerHTML = "";

  expenses.forEach((item, index) => {
    const sign = item.type === "ingreso" ? 1 : -1;
    const signedAmount = sign * item.amount;
    balance += signedAmount;

    const key = `${item.type}-${item.category}`;
    categories[key] = categories[key] || {
      label: item.category,
      type: item.type,
      total: 0
    };
    categories[key].total += signedAmount;

    const card = document.createElement("div");
    card.className = "expense";

    card.innerHTML = `
      <div>
        <div class="chips">
          <span class="chip">${item.type === "ingreso" ? "➕ Ingreso" : "➖ Gasto"}</span>
          <span class="chip">${item.category}</span>
          <span class="chip">${item.payment}</span>
          <span class="date">${item.date}</span>
        </div>
        <strong class="desc">${item.description}</strong>
      </div>

      <div class="expense-actions">
        <strong class="amount">${item.type === "ingreso" ? "+" : "-"} ${money(item.amount)}</strong>
        <div class="btn-row">
          <button class="danger" type="button" data-delete="${index}">Borrar</button>
        </div>
      </div>
    `;

    expenseList.appendChild(card);
  });

  totalBalance.textContent = money(balance);
  totalCount.textContent = expenses.length;

  summary.innerHTML = "";

  Object.values(categories).forEach((item) => {
    const row = document.createElement("div");
    row.className = "summary-item";
    row.innerHTML = `
      <span>${item.label} (${item.type === "ingreso" ? "Ingreso" : "Gasto"})</span>
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
});

clearButton.addEventListener("click", () => {
  if (confirm("¿Eliminar TODOS los movimientos?")) {
    expenses = [];
    save();
    render();
  }
});

renderTypeButtons();
renderCategoryButtons();
renderPaymentButtons();
render();
