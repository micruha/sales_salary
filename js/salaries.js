// ================================================================
// ЗАРПЛАТЫ И ЗАКРЫТИЕ СМЕНЫ
// ================================================================
const btnTriggerCloseShift = document.getElementById("btn-trigger-close-shift");
const btnTriggerAddEmp = document.getElementById("btn-trigger-add-emp");
const btnCloseShiftFinal = document.getElementById("btn-close-shift-final");
const btnCancelCloseShift = document.getElementById("btn-cancel-close-shift");
const modalCloseShift = document.getElementById("modal-close-shift");
const salaryTableBody = document.getElementById("salary-table-body");
const modalCashDrawer = document.getElementById("modal-cash-drawer");

if (btnTriggerCloseShift) {
    btnTriggerCloseShift.addEventListener("click", () => {
        if (!currentUser) {
            btnTriggerCloseShift.style.display = "none";
            return;
        }
        if (shiftOwnerId !== currentUser.id) {
            const owner = users.find(u => u.id === shiftOwnerId);
            const ownerName = owner ? owner.name : "Неизвестно";
            return alert("Эту смену открыл " + ownerName + ". Закрывать смену и печатать отчёт может только он.");
        }
        let calc = calculateTotals();
        salaryTableBody.innerHTML = "";
        activeEmployees.forEach((emp, index) => {
            let bonusAmount = emp.isOnlyBase ? 0 : calc.perHeadBonus;
            let basePart = emp.isOnlyBase ? emp.baseSalary : (calc.minPayout || 10000);
            let exactPay = basePart + bonusAmount;
            let totalPayRounded = Math.round(exactPay / 100) * 100;
            let row = document.createElement("tr");
            row.innerHTML = "<td><b>" + emp.name + "</b></td><td><span class=\"emp-status-text " + (emp.isOnlyBase ? "status-lbl-base" : "status-lbl-both") + "\">" + (emp.isOnlyBase ? "Только ставка" : "Ставка + %") + "</span></td><td><input type=\"number\" class=\"edit-base-salary\" data-index=\"" + index + "\" value=\"" + emp.baseSalary + "\" step=\"500\"></td><td><input type=\"number\" class=\"edit-bonus-salary\" data-index=\"" + index + "\" value=\"" + bonusAmount + "\" step=\"500\" " + (emp.isOnlyBase ? "disabled style=\"opacity:0.3;\"" : "") + "></td><td><b class=\"row-total\">" + totalPayRounded + "</b> тг.</td>";
            salaryTableBody.appendChild(row);
        });
        let totalStaffPayout = 0;
        activeEmployees.forEach(emp => {
            if (emp.isOnlyBase) {
                totalStaffPayout += emp.baseSalary;
            } else {
                totalStaffPayout += (calc.minPayout || 10000) + calc.perHeadBonus;
            }
        });
        let cashDrawerLeft = calc.totalCash - totalStaffPayout;
        if (modalCashDrawer) modalCashDrawer.textContent = (cashDrawerLeft < 0 ? 0 : cashDrawerLeft).toLocaleString() + " тг.";
        salaryTableBody.querySelectorAll("input").forEach(input => {
            input.addEventListener("input", () => {
                let rows = salaryTableBody.querySelectorAll("tr");
                let newStaffTotal = 0;
                rows.forEach(r => {
                    let b = Number(r.querySelector(".edit-base-salary").value) || 0;
                    let bn = Number(r.querySelector(".edit-bonus-salary").value) || 0;
                    let rTotal = Math.round((b + bn) / 100) * 100;
                    r.querySelector(".row-total").textContent = rTotal;
                    newStaffTotal += (b + bn);
                });
                let currentLeft = calc.totalCash - newStaffTotal;
                if (modalCashDrawer) modalCashDrawer.textContent = (currentLeft < 0 ? 0 : currentLeft).toLocaleString() + " тг.";
            });
        });
        modalCloseShift.style.display = "flex";
    });
}

const btnCancelCloseShiftEl = document.getElementById("btn-cancel-close-shift");
if (btnCancelCloseShiftEl) {
    btnCancelCloseShiftEl.addEventListener("click", () => { modalCloseShift.style.display = "none"; });
}

if (btnCloseShiftFinal) {
    btnCloseShiftFinal.addEventListener("click", async () => {
        if (!confirm("Окончательно закрыть смену?")) return;
        let calc = calculateTotals();
        let finalSalariesList = [];
        let rows = salaryTableBody.querySelectorAll("tr");
        let totalPayoutCash = 0;
        let totalStaffPayout = 0;
        activeEmployees.forEach((emp, index) => {
            let b = Number(rows[index].querySelector(".edit-base-salary").value) || 0;
            let bn = Number(rows[index].querySelector(".edit-bonus-salary").value) || 0;
            let finalRounded = Math.round((b + bn) / 100) * 100;
            totalPayoutCash += finalRounded;
            totalStaffPayout += finalRounded;
            finalSalariesList.push({ name: emp.name, isOnlyBase: emp.isOnlyBase, baseSalary: b, calculatedBonus: bn, finalTotal: finalRounded });
        });
        let res = await runCloud("closeShift", {
            finalSalariesList: finalSalariesList,
            totalCashInDrawer: calc.totalCash - totalStaffPayout,
            totals: { totalBonus: calc.totalBonus, perEmpBonus: calc.perHeadBonus }
        });
        localStorage.removeItem("Sales_saved_point");
        localStorage.removeItem("shift_owner_id");
        shiftOwnerId = null;
        modalCloseShift.style.display = "none";
        const mainTerminal = document.getElementById("main-terminal");
        if (mainTerminal) mainTerminal.style.display = "none";
        const gatePointSelect = document.getElementById("gate-point-select");
        if (gatePointSelect) gatePointSelect.style.display = "flex";
        history = [];
        activeEmployees = [];
    });
}