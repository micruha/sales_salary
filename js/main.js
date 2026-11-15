// ================================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И КОНФИГУРАЦИЯ
// ================================================================
const CONFIG_CLOUD_URL = "https://script.google.com/macros/s/AKfycbyktok79zqXQXI3_3fNIoHPNtCG5u3gPaMGZGVWYOQHivdr5lMr3YZOvRa2_cxyL7SH/exec";

const masterEmployeeList = [
    { id: "emp00", name: "Администратор", isOnlyBase: false },
    { id: "emp01", name: "Михаил Кренник", isOnlyBase: false },
    { id: "emp02", name: "Игорь Кочергин", isOnlyBase: false },
    { id: "emp03", name: "Татьяна Мецкер", isOnlyBase: false },
    { id: "emp04", name: "Вадим Ливит", isOnlyBase: false },
    { id: "emp05", name: "Ринат Бекметов", isOnlyBase: false },
    { id: "emp06", name: "Владимир Дмитриенко", isOnlyBase: false },
    { id: "emp07", name: "Анастасия Зеленская", isOnlyBase: false },
    { id: "emp08", name: "Марат Валитов", isOnlyBase: false },
    { id: "emp09", name: "Александр Алтухов", isOnlyBase: false },
    { id: "emp10", name: "Григорий Ливит", isOnlyBase: false },
    { id: "emp11", name: "Никита Проскурин", isOnlyBase: false },
    { id: "emp12", name: "Алексей Проскурин", isOnlyBase: false },
    { id: "emp13", name: "Сотрудник 1", isOnlyBase: true },
    { id: "emp14", name: "Сотрудник 2", isOnlyBase: true },
    { id: "emp15", name: "Сотрудник 3", isOnlyBase: true }
];

let currentPoint = "Техносити";
let activeEmployees = [];
let history = [];
let baseSalaryGlobal = 10000;

const cloudIndicator = document.getElementById("cloud-indicator");
const cloudStatusText = document.getElementById("cloud-status-text");

let lastSuccessMqttTime = 0;

async function runCloud(action, payload) {
    payload.point = currentPoint;
    payload.action = action;
    try {
        const res = await fetch(CONFIG_CLOUD_URL, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify(payload)
        });
        const textData = await res.text();
        cloudIndicator.className = "cloud-dot cloud-online";
        cloudStatusText.textContent = "Облако онлайн";
        if (action === "get") {
            return JSON.parse(textData);
        }
        return { ok: true, text: textData };
    } catch (e) {
        cloudIndicator.className = "cloud-dot cloud-offline";
        cloudStatusText.textContent = "Облако офлайн (работаем локально)";
        return null;
    }
}

function checkShiftTimeBlock() {
    const now = new Date();
    const hours = now.getHours();
    if (hours < 7 || hours >= 23) {
        alert("Смену можно открыть только с 07:00 до 23:00 по времени вашего устройства.");
        return false;
    }
    return true;
}

async function checkInitialConnection() {
    const data = await runCloud("get");
    if (data) {
        cloudIndicator.className = "cloud-dot cloud-online";
        cloudStatusText.textContent = "Облако онлайн";
    
        if (data.info) {
            currentPoint = data.info.point || currentPoint;
            const selectedPointEl = document.getElementById("selected-point");
            if (selectedPointEl) selectedPointEl.value = currentPoint;
            activeEmployees = data.info.employees || [];
            history = data.info.operations || [];
            baseSalaryGlobal = 10000;
        }
    } else {
        // Облако офлайн - используем локальные данные
        cloudIndicator.className = "cloud-dot cloud-offline";
        cloudStatusText.textContent = "Облако офлайн (работаем локально)";
        // Используем masterEmployeeList в качестве базы сотрудников
        activeEmployees = masterEmployeeList.map(emp => ({
            id: emp.id,
            name: emp.name,
            isOnlyBase: !emp.isEditable
        }));
        history = [];
    }
    
    renderLiveEmployees();
    renderOperations();
    calculateTotals();
    updateSessionInfo();
}

const btnOpenShiftConfirm = document.getElementById("btn-open-shift-confirm");
const openEmpPool = document.getElementById("open-emp-pool");
const baseSalaryInput = document.getElementById("base-salary-input");
const gateShiftOpen = document.getElementById("gate-shift-open");

if (btnOpenShiftConfirm) {
    btnOpenShiftConfirm.addEventListener("click", async () => {
        if (!checkShiftTimeBlock()) return;
        if (!currentUser) return alert("Сначала войдите в систему.");
        
        const selectedCards = openEmpPool.querySelectorAll(".emp-card.active");
        if (selectedCards.length === 0) {
            return alert("Выберите хотя бы одного сотрудника для смены!");
        }
        
        const baseSalary = Number(baseSalaryInput.value) || 10000;
        
        activeEmployees = [];
        selectedCards.forEach(card => {
            const empId = card.dataset.id;
            const emp = masterEmployeeList.find(e => e.id === empId);
            if (emp) {
                activeEmployees.push({
                    id: emp.id,
                    name: emp.name,
                    isOnlyBase: emp.isOnlyBase,
                    baseSalary: baseSalary
                });
            }
        });
        
        shiftOwnerId = currentUser.id;
        localStorage.setItem("shift_owner_id", shiftOwnerId);
        localStorage.setItem("Sales_saved_point", currentPoint);
        
        gateShiftOpen.style.display = "none";
        mainTerminal.style.display = "grid";
        
        renderLiveEmployees();
        renderOperations();
        calculateTotals();
        updateSessionInfo();
    });
}