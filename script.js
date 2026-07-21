const STORAGE_KEY = "app_gastos_v1";

const form = document.getElementById("expenseForm");
const description = document.getElementById("description");
const amount = document.getElementById("amount");
const category = document.getElementById("category");
const paymentMethod = document.getElementById("paymentMethod");
const date = document.getElementById("date");

const expenseList = document.getElementById("expenseList");
const summary = document.getElementById("summary");
const totalAmount = document.getElementById("totalAmount");
const totalCount = document.getElementById("totalCount");
const clearButton = document.getElementById("clearButton");

date.value = new Date().toISOString().split("T")[0];

let expenses = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function money(value) {
    return value.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS"
    });
}

function render() {

    if (expenses.length === 0) {
        expenseList.innerHTML =
            '<div class="empty">Todavía no hay gastos cargados.</div>';

        summary.innerHTML =
            '<div class="empty">Cargá gastos para ver el resumen.</div>';

        totalAmount.textContent = "$0";
        totalCount.textContent = "0";
        return;
    }

    let total = 0;
    let categories = {};

    expenseList.innerHTML = "";

    expenses.forEach((gasto, index) => {

        total += gasto.amount;

        categories[gasto.category] =
            (categories[gasto.category] || 0) + gasto.amount;

        expenseList.innerHTML += `
            <div class="expense">

                <div>

                    <div class="chips">
                        <span class="chip">${gasto.category}</span>
                        <span class="chip">${gasto.payment}</span>
                        <span class="date">${gasto.date}</span>
                    </div>

                    <strong class="desc">${gasto.description}</strong>

                </div>

                <div class="expense-actions">

                    <strong class="amount">
                        ${money(gasto.amount)}
                    </strong>

                    <div class="btn-row">

                        <button class="danger"
                            onclick="deleteExpense(${index})">
                            Borrar
                        </button>

                    </div>

                </div>

            </div>
        `;

    });

    totalAmount.textContent = money(total);
    totalCount.textContent = expenses.length;

    summary.innerHTML = "";

    Object.keys(categories).forEach(cat => {

        summary.innerHTML += `
            <div class="summary-item">
                <span>${cat}</span>
                <strong>${money(categories[cat])}</strong>
            </div>
        `;

    });

}

form.addEventListener("submit", function(e){

    e.preventDefault();

    expenses.unshift({

        description: description.value,
        amount: Number(amount.value),
        category: category.value,
        payment: paymentMethod.value,
        date: date.value

    });

    save();
    render();

    form.reset();

    date.value = new Date().toISOString().split("T")[0];

});

function deleteExpense(index){

    if(confirm("¿Eliminar este gasto?")){

        expenses.splice(index,1);

        save();
        render();

    }

}

clearButton.addEventListener("click",()=>{

    if(confirm("¿Eliminar TODOS los gastos?")){

        expenses=[];

        save();
        render();

    }

});

render();
