// ================================================================
// АВТОРИЗАЦИЯ И ПРАВА ДОСТУПА
// ================================================================
const GLOBAL_PASSWORD_HASH = "fc46fc3ed1a3e16b054170c26ed5b2d9edddad4ce499bc343f25059f481ed642";

// Default employee passwords (hashes of "123456" - change as needed)
// These hashes are for password "123456" calculated with SHA-256
const DEFAULT_PASSWORD_HASH = "5f4dcc3b5aa765d61d8327deb882cf99";

const users = [
    { id: "emp00", name: "Администратор", passwordHash: DEFAULT_PASSWORD_HASH, isEditable: false },
    { id: "emp01", name: "Михаил Кренник", passwordHash: DEFAULT_PASSWORD_HASH, isEditable: false },
    { id: "emp02", name: "Игорь Кочергин", passwordHash: DEFAULT_PASSWORD_HASH, isEditable: false },
    { id: "emp03", name: "Татьяна Мецкер", passwordHash: DEFAULT_PASSWORD_HASH, isEditable: false },
    { id: "emp04", name: "Вадим Ливит", passwordHash: DEFAULT_PASSWORD_HASH, isEditable: false },
    { id: "emp05", name: "Ринат Бекметов", passwordHash: DEFAULT_PASSWORD_HASH, isEditable: false },
    { id: "emp06", name: "Владимир Дмитриенко", passwordHash: DEFAULT_PASSWORD_HASH, isEditable: false },
    { id: "emp07", name: "Анастасия Зеленская", passwordHash: DEFAULT_PASSWORD_HASH, isEditable: false },
    { id: "emp08", name: "Марат Валитов", passwordHash: DEFAULT_PASSWORD_HASH, isEditable: false },
    { id: "emp09", name: "Александр Алтухов", passwordHash: DEFAULT_PASSWORD_HASH, isEditable: false },
    { id: "emp10", name: "Григорий Ливит", passwordHash: DEFAULT_PASSWORD_HASH, isEditable: false },
    { id: "emp11", name: "Никита Проскурин", passwordHash: DEFAULT_PASSWORD_HASH, isEditable: false },
    { id: "emp12", name: "Алексей Проскурин", passwordHash: DEFAULT_PASSWORD_HASH, isEditable: false },
    { id: "emp13", name: "Сотрудник 1", passwordHash: DEFAULT_PASSWORD_HASH, isEditable: true },
    { id: "emp14", name: "Сотрудник 2", passwordHash: DEFAULT_PASSWORD_HASH, isEditable: true },
    { id: "emp15", name: "Сотрудник 3", passwordHash: DEFAULT_PASSWORD_HASH, isEditable: true }
];

let currentUser = null;
let shiftOwnerId = null;

async function sha256(str) {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getLockState(userId) {
    const lockUntil = Number(localStorage.getItem(`lockUntil_${userId}`) || 0);
    const failCount = Number(localStorage.getItem(`failCount_${userId}`) || 0);
    return { lockUntil, failCount };
}

function updateLoginUI() {
    if (!currentUser) return;
    const { lockUntil, failCount } = getLockState(currentUser.id);
    const now = Date.now();
    const loginLockTimer = document.getElementById("login-lock-timer");
    const btnLogin = document.getElementById("btn-login");
    const loginPassInput = document.getElementById("login-pass-input");
    const loginAttemptInfo = document.getElementById("login-attempt-info");
    if (!loginLockTimer) return;
    if (lockUntil > now) {
        const minutes = Math.ceil((lockUntil - now) / 60000);
        loginLockTimer.textContent = `Ввод заблокирован на ${minutes} мин. Попробуйте позже.`;
        loginLockTimer.style.display = "block";
        btnLogin.disabled = true;
        loginPassInput.disabled = true;
        loginAttemptInfo.textContent = "";
    } else {
        loginLockTimer.style.display = "none";
        btnLogin.disabled = false;
        loginPassInput.disabled = false;
        loginAttemptInfo.textContent = failCount > 0 ? `Осталось попыток: ${3 - failCount}` : "";
    }
}

function fillUserSelect() {
    const loginUserSelect = document.getElementById("login-user-select");
    if (!loginUserSelect) return;
    loginUserSelect.innerHTML = "";
    users.forEach(u => {
        const opt = document.createElement("option");
        opt.value = u.id;
        opt.textContent = u.name;
        loginUserSelect.appendChild(opt);
    });
}

function showLoginScreen() {
    const gateLogin = document.getElementById("gate-login");
    if (!gateLogin) return;
    gateLogin.style.display = "flex";
    fillUserSelect();
    const loginPassInput = document.getElementById("login-pass-input");
    if (loginPassInput) loginPassInput.value = "";
    const loginError = document.getElementById("login-error");
    if (loginError) loginError.style.display = "none";
    updateLoginUI();
    if (loginPassInput) loginPassInput.focus();
}

function logout() {
    currentUser = null;
    shiftOwnerId = null;
    localStorage.removeItem("shift_owner_id");
    sessionStorage.removeItem("current_user");
    const gateLogin = document.getElementById("gate-login");
    if (gateLogin) gateLogin.style.display = "flex";
    const gateShiftOpen = document.getElementById("gate-shift-open");
    if (gateShiftOpen) gateShiftOpen.style.display = "none";
    const mainTerminal = document.getElementById("main-terminal");
    if (mainTerminal) mainTerminal.style.display = "none";
    fillUserSelect();
    const loginPassInput = document.getElementById("login-pass-input");
    if (loginPassInput) loginPassInput.value = "";
    const loginError = document.getElementById("login-error");
    if (loginError) loginError.style.display = "none";
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) btnLogout.style.display = "none";
    updateLoginUI();
}

async function checkGlobalPasswordPrompt() {
    let passInput = prompt("Введите код доступа:");
    if (!passInput) return false;
    const hash = await sha256(passInput);
    if (hash === GLOBAL_PASSWORD_HASH) {
        sessionStorage.setItem("admin_passed", "true");
        return true;
    }
    alert("Программа закрыта на реконструкцию.");
    return false;
}

async function attemptUserLogin() {
    const loginUserSelect = document.getElementById("login-user-select");
    const loginPassInput = document.getElementById("login-pass-input");
    const loginError = document.getElementById("login-error");
    const loginAttemptInfo = document.getElementById("login-attempt-info");
    const loginLockTimer = document.getElementById("login-lock-timer");
    const btnLogin = document.getElementById("btn-login");
    if (!loginUserSelect || !loginPassInput) return;
    const userId = loginUserSelect.value;
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const { lockUntil, failCount } = getLockState(userId);
    const now = Date.now();
    if (lockUntil > now) {
        const minutes = Math.ceil((lockUntil - now) / 60000);
        loginLockTimer.textContent = `Ввод заблокирован на ${minutes} мин. Попробуйте позже.`;
        loginLockTimer.style.display = "block";
        return;
    }
    const pass = loginPassInput.value;
    if (!pass) { loginError.style.display = "block"; return; }
    const hash = await sha256(pass);
    if (hash === user.passwordHash) {
        localStorage.removeItem(`failCount_${userId}`);
        localStorage.removeItem(`lockUntil_${userId}`);
        loginError.style.display = "none";
        onUserLoggedIn(user);
    } else {
        const newCount = failCount + 1;
        if (newCount >= 3) {
            const lockUntil = now + 60 * 60 * 1000;
            setLockState(userId, 0, lockUntil);
            loginLockTimer.textContent = "Превышено число попыток. Ввод заблокирован на 1 час.";
            loginLockTimer.style.display = "block";
            btnLogin.disabled = true;
            loginPassInput.disabled = true;
        } else {
            setLockState(userId, newCount, 0);
            let msg = `Неверный пароль. Осталось попыток: ${3 - newCount}`;
            if (newCount === 2) msg += " Последняя попытка перед блокировкой на 1 час.";
            loginAttemptInfo.textContent = msg;
        }
        loginError.style.display = "block";
        loginPassInput.value = "";
    }
}

function initAuth() {
    const gatePasswordCheck = async () => {
        const savedUser = sessionStorage.getItem("current_user");
        if (savedUser && sessionStorage.getItem("admin_passed") === "true") {
            currentUser = JSON.parse(savedUser);
        } else {
            const passed = await checkGlobalPasswordPrompt();
            if (!passed) {
                document.documentElement.innerHTML = "<html style='background:#141414;'><body style='font-family:sans-serif; color:#f44336; text-align:center; padding-top:100px;'><h1>🚫 Программа закрыта на реконструкцию.</h1></body></html>";
                throw new Error("Блокировка доступа.");
            }
            showLoginScreen();
        }
        if (currentUser) {
            const user = users.find(u => u.id === currentUser.id);
            if (user) onUserLoggedIn(user);
        }
    };
    gatePasswordCheck();
}

function setupAuthListeners() {
    const btnGlobalPass = document.getElementById("btn-global-pass");
    const globalPassInput = document.getElementById("global-pass-input");
    const btnLogin = document.getElementById("btn-login");
    const loginPassInput = document.getElementById("login-pass-input");
    const btnLogout = document.getElementById("btn-logout");
    const loginUserSelect = document.getElementById("login-user-select");
    if (btnGlobalPass) btnGlobalPass.addEventListener("click", checkGlobalPasswordPrompt);
    if (globalPassInput) globalPassInput.addEventListener("keydown", e => { if (e.key === "Enter") checkGlobalPasswordPrompt(); });
    if (btnLogin) btnLogin.addEventListener("click", attemptUserLogin);
    if (loginPassInput) loginPassInput.addEventListener("keydown", e => { if (e.key === "Enter") attemptUserLogin(); });
    if (btnLogout) btnLogout.addEventListener("click", logout);
    if (loginUserSelect) loginUserSelect.addEventListener("change", () => {
        loginPassInput.value = "";
        const loginError = document.getElementById("login-error");
        if (loginError) loginError.style.display = "none";
        updateLoginUI();
    });
}
