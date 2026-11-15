// ================================================================
// ОПЕРАЦИИ (продажи, возвраты, расходы) И РАСЧЁТ ЗАРПЛАТЫ
// ================================================================
function calculateTotals() {
    let tSales = 0, tCash = 0, tCard = 0, sTotal = 0, sCash = 0, sCard = 0, tBonus = 0, tBonusWithheld = 0;
    history.forEach(op => {
        const c = Number(op.cash || 0), cd = Number(op.card || 0);
        if (op.type === "sale") {
            tSales += c + cd; tCash += c; tCard += cd;
            tBonus += Math.round((c + cd) * Number(op.bonus || 0) / 100);
        } else {
            sTotal += c + cd; sCash += c; sCard += cd;
            tBonusWithheld += Math.round((c + cd) * Number(op.bonus || 0) / 100);
        }
    });

    let bonusSharersCount = activeEmployees.filter(e => !e.isOnlyBase).length;
    let netBonus = tBonus - tBonusWithheld;

    const MIN_PAYOUT = 10000;
    const THRESHOLD_BASE = 6000;
    let threshold = bonusSharersCount > 0 ? (MIN_PAYOUT - THRESHOLD_BASE) * bonusSharersCount : 0;

    let perHeadBonus = 0;
    if (bonusSharersCount > 0 && netBonus > threshold) {
        let remainder = netBonus - threshold;
        perHeadBonus = Math.round(remainder / bonusSharersCount);
    }

    const totalSalesEl = document.getElementById("total-Sales");
    const totalCashEl = document.getElementById("total-cash");
    const totalCardEl = document.getElementById("total-card");
    const totalBonusPoolEl = document.getElementById("total-bonus-pool");
    const statTotalEl = document.getElementById("stat-total");
    const statCashEl = document.getElementById("stat-cash");
    const statCardEl = document.getElementById("stat-card");
    const statBonusWithheldEl = document.getElementById("stat-bonus-withheld");
    const bonusPerHeadEl = document.getElementById("bonus-per-head");

    if (totalSalesEl) totalSalesEl.textContent = tSales.toLocaleString() + " тг.";
    if (totalCashEl) totalCashEl.textContent = tCash.toLocaleString() + " тг.";
    if (totalCardEl) totalCardEl.textContent = tCard.toLocaleString() + " тг.";
    if (totalBonusPoolEl) totalBonusPoolEl.textContent = tBonus.toLocaleString() + " тг.";
    if (statTotalEl) statTotalEl.textContent = sTotal.toLocaleString() + " тг.";
    if (statCashEl) statCashEl.textContent = sCash.toLocaleString() + " тг.";
    if (statCardEl) statCardEl.textContent = sCard.toLocaleString() + " тг.";
    if (statBonusWithheldEl) statBonusWithheldEl.textContent = tBonusWithheld.toLocaleString() + " тг.";
    if (bonusPerHeadEl) bonusPerHeadEl.textContent = perHeadBonus.toLocaleString() + " тг. (" + bonusSharersCount + " чел.)";

    let salaries = activeEmployees.map(emp => {
        if (emp.isOnlyBase) return emp.baseSalary;
        if (netBonus <= threshold) return MIN_PAYOUT;
        return MIN_PAYOUT + perHeadBonus;
    });
    let allEqual = salaries.length > 0 && salaries.every(s => s === salaries[0]);
    const statSalaryPerHeadEl = document.getElementById("stat-salary-per-head");
    if (statSalaryPerHeadEl) {
        if (allEqual) statSalaryPerHeadEl.textContent = salaries[0].toLocaleString() + " тг.";
        else statSalaryPerHeadEl.textContent = "См. ведомость выплат";
    }

    let totalStaffPayout = 0;
    activeEmployees.forEach(emp => {
        if (emp.isOnlyBase) {
            totalStaffPayout += emp.baseSalary;
        } else if (netBonus <= threshold) {
            totalStaffPayout += MIN_PAYOUT;
        } else {
            totalStaffPayout += MIN_PAYOUT + perHeadBonus;
        }
    });
    const statSalaryTotalSumEl = document.getElementById("stat-salary-total-sum");
    if (statSalaryTotalSumEl) statSalaryTotalSumEl.textContent = totalStaffPayout.toLocaleString() + " тг.";

    let incassationCash = tCash - totalStaffPayout;
    const statIncassationCashEl = document.getElementById("stat-incassation-cash");
    if (statIncassationCashEl) {
        statIncassationCashEl.textContent = incassationCash.toLocaleString() + " тг.";
        statIncassationCashEl.style.color = incassationCash < 0 ? "#da3637" : "var(--success)";
    }

    return {
        totalSales: tSales,
        totalCash: tCash,
        totalCard: tCard,
        totalBonus: tBonus,
        perHeadBonus: perHeadBonus,
        bonusWithheld: tBonusWithheld,
        minPayout: MIN_PAYOUT,
        threshold: threshold,
        netBonus: netBonus
    };
}
async function addOperation(type) {
    const opTitle = document.getElementById("op-title");
    const opCash = document.getElementById("op-cash");
    const opCard = document.getElementById("op-card");
    const opBonusPct = document.getElementById("op-bonus-pct");
    const operationsContainer = document.getElementById("operations-container");

    let title = opTitle.value.trim();
    let cash = Number(opCash.value) || 0;
    let card = Number(opCard.value) || 0;

    if (!title || (cash <= 0 && card <= 0)) return alert("Введите наименование и сумму!");
    if (cash >= 1000000 || card >= 1000000) {
        return alert("Сумма по наличным или безналичным не может быть 1 000 000 тенге и более.\nМаксимально допустимая сумма — 999 999 тг.");
    }

    let opData = {
        id: "op_" + Date.now() + Math.random().toString(36).substr(2, 4),
        time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        title: title,
        cash: cash,
        card: card,
        bonus: Number(opBonusPct.value),
        type: type,
        userId: currentUser ? currentUser.id : null,
        userName: currentUser ? currentUser.name : "—"
    };

    history.push(opData);
    renderOperations();
    calculateTotals();
    await runCloud("addOperation", opData);

    opTitle.value = "";
    opCash.value = "0";
    opCard.value = "0";
}

window.deleteOp = async function (id, event) {
    if (event) event.stopPropagation();
    const op = history.find(o => o.id === id);
    if (op && op.userId && op.userId !== currentUser?.id) {
        return alert("Вы можете удалять только свои собственные операции!");
    }
    if (confirm("Удалить операцию?")) {
        history = history.filter(op => op.id !== id);
        renderOperations();
        calculateTotals();
        await runCloud("deleteOperation", { id: id });
    }
};

function renderOperations() {
    const operationsContainer = document.getElementById("operations-container");
    if (!operationsContainer) return;
    operationsContainer.innerHTML = "";
    history.forEach(op => {
        let item = document.createElement("div");
        item.className = "op-item type-" + op.type + (op.userId === currentUser?.id ? " own-op" : "");
        let details = op.cash > 0 ? "Наличные: " + op.cash.toLocaleString() + " тг." : "";
        if (op.card > 0) details += (details ? " | " : "") + "Безнал: " + op.card.toLocaleString() + " тг.";
        let bonusText = "<span style=\"color:var(--warn);font-size:0.75rem;\">Мотивация: " + op.bonus + "%</span>";
        let timeShort = (op.time || "").match(/\d{2}:\d{2}/)?.[0] || "--:--";
        let userNameHtml = op.userName ? "<div class=\"op-user\">" + op.userName + "</div>" : "";
        let isOwn = op.userId === currentUser?.id;
        let delBtn = isOwn ? "<button class=\"btn-delete-op\" onclick=\"deleteOp('" + op.id + "', event)\">Удалить</button>" : "";
        item.innerHTML = "<div class=\"op-info\"><span style=\"font-weight:bold;\">" + op.title + "</span>" + userNameHtml + "<span class=\"op-meta\">" + timeShort + " | " + details + "</span>" + bonusText + "</div><div class=\"op-right\"><span>" + (op.type === "sale" ? "+" : "-") + ((op.cash || 0) + (op.card || 0)).toLocaleString() + " тг.</span>" + delBtn + "</div>";
        operationsContainer.appendChild(item);
    });
}