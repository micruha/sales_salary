// ================================================================
// UI И ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ
// ================================================================
function renderOpenEmpPool() {
    const openEmpPool = document.getElementById("open-emp-pool");
    if (!openEmpPool) return;
    openEmpPool.innerHTML = "";
    masterEmployeeList.forEach(emp => {
        let card = document.createElement("div");
        card.className = "emp-card";
        card.dataset.id = emp.id;
        let isCurrentUser = currentUser && emp.id === currentUser.id;
        let nameContent = emp.isOnlyBase
            ? "<input type=\"text\" class=\"edit-name-input\" value=\"" + emp.name + "\" onclick=\"event.stopPropagation()\" onchange=\"updateTempName('" + emp.id + "', this.value)\">"
            : "<span class=\"emp-name-text\">" + emp.name + (isCurrentUser ? " <span style=\"color:#2ecc71;font-size:0.75rem;\">(Вы)</span>" : "") + "</span>";
        let toggleHTML = "";
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.alignItems = "center";
        card.style.textAlign = "center";
        if (emp.isOnlyBase) {
            toggleHTML = "<div class=\"mode-toggle\" onclick=\"event.stopPropagation()\"><label><input type=\"checkbox\" class=\"mode-chk\"> Только ставка</label></div>";
            card.style.justifyContent = "flex-start";
        } else {
            card.style.justifyContent = "center";
        }
        card.innerHTML = "<div class=\"emp-name\">" + nameContent + "</div>" + toggleHTML;
        if (isCurrentUser) {
            card.classList.add("active");
            card.style.pointerEvents = "none";
            card.style.opacity = "0.85";
            card.style.borderColor = "#2ecc71";
        } else {
            card.addEventListener("click", () => { card.classList.toggle("active"); });
        }
        openEmpPool.appendChild(card);
    });
}

function renderLiveEmployees() {
    const liveEmpContainer = document.getElementById("live-emp-container");
    if (!liveEmpContainer) return;
    liveEmpContainer.innerHTML = "";
    activeEmployees.forEach(emp => {
        let item = document.createElement("div");
        item.className = "live-emp-item";
        item.innerHTML = "<span>" + emp.name + "</span><span class=\"emp-status-text " + (emp.isOnlyBase ? "status-lbl-base" : "status-lbl-both") + "\">" + (emp.isOnlyBase ? "Только ставка" : "Ставка + %") + "</span>";
        liveEmpContainer.appendChild(item);
    });
}

async function enterToCurrentPoint() {
    const data = await runCloud("get");
    if (!data) return alert("Ошибка связи с таблицей Google");
    const savedPoint = localStorage.getItem("Sales_saved_point");
    currentPoint = savedPoint || (data.info && data.info.point) || "Техносити";
    const selectedPoint = document.getElementById("selected-point");
    if (selectedPoint) selectedPoint.value = currentPoint;
    activeEmployees = data.info && data.info.employees ? data.info.employees : [];
    history = data.info && data.info.operations ? data.info.operations : [];
    const gateShiftOpen = document.getElementById("gate-shift-open");
    const mainTerminal = document.getElementById("main-terminal");
    const gatePointSelect = document.getElementById("gate-point-select");
    if (gatePointSelect) gatePointSelect.style.display = "none";
    if (gateShiftOpen) gateShiftOpen.style.display = "none";
    if (mainTerminal) mainTerminal.style.display = "none";
    if (data.info && data.info.shift_owner_id) {
        shiftOwnerId = data.info.shift_owner_id;
        localStorage.setItem("shift_owner_id", shiftOwnerId);
    }
    if (activeEmployees.length > 0) {
        mainTerminal.style.display = "grid";
        renderLiveEmployees();
        renderOperations();
        calculateTotals();
        updateSessionInfo();
    } else {
        gateShiftOpen.style.display = "flex";
        renderOpenEmpPool();
        updateSessionInfo();
    }
}

function updateTempName(empId, newName) {
    const emp = masterEmployeeList.find(e => e.id === empId);
    if (emp) emp.name = newName;
}

function updateSessionInfo() {
    const info = document.getElementById("session-badges");
    if (!info) return;
    const ownerId = shiftOwnerId || localStorage.getItem("shift_owner_id") || null;
    const owner = users.find(u => u.id === ownerId);
    const ownerName = owner ? owner.name : "—";
    const meName = currentUser ? currentUser.name : "—";
    const pointName = currentPoint || "—";
    let html = "";
    if (currentUser && meName !== "—") {
        html += "<span class=\"session-badge user-badge\">р.м. " + meName + "</span>";
    }
    if (ownerId && ownerName !== "—") {
        html += "<span class=\"session-badge owner-badge\">о. " + ownerName + "</span>";
    }
    info.innerHTML = html;
}