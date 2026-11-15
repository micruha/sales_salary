// ================================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И КОНФИГУРАЦИЯ
// ================================================================
const CONFIG_CLOUD_URL = "https://script.google.com/macros/s/AKfycbyktok79zqXQXI3_3fNIoHPNtCG5u3gPaMGZGVWYOQHivdr5lMr3YZOvRa2_cxyL7SH/exec";

const masterEmployeeList = [
    { id: "emp00", name: "Администратор", isEditable: false },
    { id: "emp01", name: "Михаил Кренник", isEditable: false },
    { id: "emp02", name: "Игорь Кочергин", isEditable: false },
    { id: "emp03", name: "Татьяна Мецкер", isEditable: false },
    { id: "emp04", name: "Вадим Ливит", isEditable: false },
    { id: "emp05", name: "Ринат Бекметов", isEditable: false },
    { id: "emp06", name: "Владимир Дмитриенко", isEditable: false },
    { id: "emp07", name: "Анастасия Зеленская", isEditable: false },
    { id: "emp08", name: "Марат Валитов", isEditable: false },
    { id: "emp09", name: "Александр Алтухов", isEditable: false },
    { id: "emp10", name: "Григорий Ливит", isEditable: false },
    { id: "emp11", name: "Никита Проскурин", isEditable: false },
    { id: "emp12", name: "Алексей Проскурин", isEditable: false },
    { id: "emp13", name: "Сотрудник 1", isEditable: true },
    { id: "emp14", name: "Сотрудник 2", isEditable: true },
    { id: "emp15", name: "Сотрудник 3", isEditable: true }
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
    if (!data) {
        cloudStatusText.textContent = "Ошибка связи с облаком, работаем локально.";
        return;
    }
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
    renderLiveEmployees();
    renderOperations();
    calculateTotals();
}