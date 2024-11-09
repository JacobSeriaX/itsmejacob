// script.js

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDYx7vno6DfAyuR7hXUG3ra5OtSLn7O2xA",
    authDomain: "itsme-jacob.firebaseapp.com",
    projectId: "itsme-jacob",
    storageBucket: "itsme-jacob.appspot.com",
    messagingSenderId: "471763923722",
    appId: "1:471763923722:web:e897221a414424223240f3"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Получение элементов из DOM
const transactionForm = document.getElementById('transaction-form');
const typeInput = document.getElementById('type');
const categoryInput = document.getElementById('category');
const amountInput = document.getElementById('amount');
const dateInput = document.getElementById('date');
const transactionsTableBody = document.querySelector('#transactions-table tbody');
const summaryDiv = document.getElementById('summary');

// Функция для получения текущей даты по часовому поясу Самарканда
function getCurrentSamarkandDate() {
    const options = { timeZone: 'Asia/Samarkand' };
    const formatter = new Intl.DateTimeFormat('sv-SE', { ...options, year: 'numeric', month: '2-digit', day: '2-digit' });
    const formattedDate = formatter.format(new Date());
    return formattedDate;
}

// Установка текущей даты по Самарканду при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    dateInput.value = getCurrentSamarkandDate();
    renderSummary();
});

// Обработчик отправки формы
transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const type = typeInput.value;
    const category = categoryInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const date = dateInput.value;

    if (category === '' || isNaN(amount) || date === '') {
        alert('Пожалуйста, заполните все поля корректно.');
        return;
    }

    const newTransaction = { type, category, amount, date };

    // Добавление транзакции в Firebase
    const transactionsRef = database.ref('transactions');
    transactionsRef.push(newTransaction, (error) => {
        if (error) {
            console.error('Ошибка при добавлении транзакции:', error);
            alert('Произошла ошибка при добавлении транзакции.');
        } else {
            // Очистка формы
            transactionForm.reset();
            dateInput.value = getCurrentSamarkandDate();
        }
    });
});

// Прослушивание изменений в базе данных и обновление UI в реальном времени
database.ref('transactions').on('value', (snapshot) => {
    const transactionsData = snapshot.val();
    renderTransactions(transactionsData);
    renderSummary(transactionsData);
});

// Функция для добавления транзакции в таблицу
function addTransactionToTable(transaction, key) {
    const tr = document.createElement('tr');

    const typeTd = document.createElement('td');
    typeTd.textContent = transaction.type === 'income' ? 'Доход' : 'Расход';
    typeTd.classList.add(transaction.type === 'income' ? 'income' : 'expense');
    tr.appendChild(typeTd);

    const categoryTd = document.createElement('td');
    categoryTd.textContent = transaction.category;
    tr.appendChild(categoryTd);

    const amountTd = document.createElement('td');
    amountTd.textContent = `${transaction.amount.toFixed(2)} ₽`;
    tr.appendChild(amountTd);

    const dateTd = document.createElement('td');
    dateTd.textContent = transaction.date;
    tr.appendChild(dateTd);

    const actionsTd = document.createElement('td');
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Удалить';
    deleteBtn.classList.add('delete-btn');
    deleteBtn.addEventListener('click', () => deleteTransaction(key));
    actionsTd.appendChild(deleteBtn);
    tr.appendChild(actionsTd);

    transactionsTableBody.appendChild(tr);
}

// Функция для отображения всех транзакций
function renderTransactions(transactionsData) {
    transactionsTableBody.innerHTML = '';
    if (transactionsData) {
        Object.keys(transactionsData).forEach(key => {
            const transaction = transactionsData[key];
            addTransactionToTable(transaction, key);
        });
    }
}

// Функция для удаления транзакции
function deleteTransaction(key) {
    if (confirm('Вы уверены, что хотите удалить эту транзакцию?')) {
        const transactionRef = database.ref('transactions/' + key);
        transactionRef.remove((error) => {
            if (error) {
                console.error('Ошибка при удалении транзакции:', error);
                alert('Произошла ошибка при удалении транзакции.');
            }
        });
    }
}

// Функция для отображения сводки
function renderSummary(transactionsData) {
    const currentDateSamarkand = new Date().toLocaleString('en-US', { timeZone: 'Asia/Samarkand' });
    const currentMonth = new Date(currentDateSamarkand).getMonth();
    const currentYear = new Date(currentDateSamarkand).getFullYear();

    let totalIncome = 0;
    let totalExpense = 0;
    const categories = {};

    if (transactionsData) {
        Object.values(transactionsData).forEach(transaction => {
            const transactionDate = new Date(transaction.date);
            if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
                if (transaction.type === 'income') {
                    totalIncome += transaction.amount;
                } else {
                    totalExpense += transaction.amount;
                }

                if (categories[transaction.category]) {
                    categories[transaction.category] += transaction.amount;
                } else {
                    categories[transaction.category] = transaction.amount;
                }
            }
        });
    }

    let summaryHTML = `
        <div class="summary-item"><strong>Общий Доход:</strong> <span class="income">${totalIncome.toFixed(2)} Сум</span></div>
        <div class="summary-item"><strong>Общие Расходы:</strong> <span class="expense">${totalExpense.toFixed(2)} Сум</span></div>
        <div class="summary-item"><strong>Баланс:</strong> <span class="balance">${ (totalIncome - totalExpense).toFixed(2) } Сум</span></div>
        <h3>Расходы по Категориям:</h3>
    `;

    for (const [category, amount] of Object.entries(categories)) {
        summaryHTML += `<div class="summary-item"><strong>${category}:</strong> ${amount.toFixed(2)} Сум</div>`;
    }

    summaryDiv.innerHTML = summaryHTML;
}
