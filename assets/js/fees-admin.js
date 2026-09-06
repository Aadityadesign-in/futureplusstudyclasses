/* =========================================================
   FUTURE PLUS STUDY Classes
   ADMIN FEE MANAGEMENT
   ========================================================= */

const db = window.supabaseClient;

let students = [];
let fees = [];
let editingFeeId = null;


/* =========================================================
   SHORTCUTS
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}

function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
}

function setValue(id, value) {
    const el = $(id);
    if (el) el.value = value ?? "";
}

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

function formatMoney(value) {
    const number = Number(value || 0);

    return "₹" + number.toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}


/* =========================================================
   ADMIN CHECK
   ========================================================= */

async function checkAdmin() {

    if (!db) {
        alert("Supabase connection not found.");
        return false;
    }

    const {
        data: { user },
        error: userError
    } = await db.auth.getUser();

    if (userError || !user) {
        window.location.href = "../login.html";
        return false;
    }

    const { data: profile, error } = await db
        .from("profiles")
        .select("id, full_name, role, status")
        .eq("id", user.id)
        .single();

    if (error || !profile) {
        alert("Profile not found.");
        await db.auth.signOut();
        window.location.href = "../login.html";
        return false;
    }

    if (
        profile.role !== "admin" ||
        profile.status !== "approved"
    ) {
        alert("Access denied. Admin only.");
        await db.auth.signOut();
        window.location.href = "../login.html";
        return false;
    }

    return true;
}


/* =========================================================
   LOAD APPROVED STUDENTS
   ========================================================= */

async function loadStudents() {

    const { data, error } = await db
        .from("profiles")
        .select("id, full_name, email, phone, class_name")
        .eq("role", "student")
        .eq("status", "approved")
        .order("full_name", { ascending: true });

    if (error) {
        console.error("Students error:", error);
        alert("Students load nahi ho paaye.");
        return;
    }

    students = data || [];

    populateStudentSelect();
}


/* =========================================================
   STUDENT DROPDOWN
   ========================================================= */

function populateStudentSelect() {

    const select = $("studentId");

    if (!select) return;

    select.innerHTML = `
        <option value="">Select Student</option>
    `;

    students.forEach(student => {

        const option = document.createElement("option");

        option.value = student.id;

        option.textContent =
            `${student.full_name || "Unnamed"}`
            + (student.class_name
                ? ` — ${student.class_name}`
                : "");

        select.appendChild(option);
    });
}


/* =========================================================
   LOAD FEES
   ========================================================= */

async function loadFees() {

    const { data, error } = await db
        .from("fees")
        .select(`
            id,
            student_id,
            fee_type,
            amount,
            paid_amount,
            due_date,
            status,
            note,
            created_at,
            updated_at,
            profiles:student_id (
                id,
                full_name,
                email,
                phone,
                class_name
            )
        `)
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error("Fees load error:", error);

        const tbody = $("feesTableBody");

        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align:center;">
                        Failed to load fees.
                    </td>
                </tr>
            `;
        }

        return;
    }

    fees = data || [];

    renderFees();
    updateStats();
}


/* =========================================================
   RENDER FEES TABLE
   ========================================================= */

function renderFees() {

    const tbody = $("feesTableBody");

    if (!tbody) return;

    const searchInput =
        $("searchInput") ||
        $("feeSearch");

    const statusFilter =
        $("statusFilter") ||
        $("feeStatusFilter");

    const search = (
        searchInput?.value || ""
    ).toLowerCase().trim();

    const selectedStatus =
        statusFilter?.value || "all";

    let filteredFees = [...fees];


    /* SEARCH */

    if (search) {

        filteredFees = filteredFees.filter(fee => {

            const studentName =
                fee.profiles?.full_name || "";

            const feeType =
                fee.fee_type || "";

            const phone =
                fee.profiles?.phone || "";

            const email =
                fee.profiles?.email || "";

            return (
                studentName.toLowerCase().includes(search) ||
                feeType.toLowerCase().includes(search) ||
                phone.toLowerCase().includes(search) ||
                email.toLowerCase().includes(search)
            );
        });
    }


    /* STATUS FILTER */

    if (selectedStatus !== "all") {

        filteredFees = filteredFees.filter(
            fee => fee.status === selectedStatus
        );
    }


    /* EMPTY */

    if (!filteredFees.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center; padding:30px;">
                    No fee records found.
                </td>
            </tr>
        `;

        return;
    }


    /* TABLE */

    tbody.innerHTML = filteredFees.map(fee => {

        const student =
            fee.profiles?.full_name || "Unknown Student";

        const className =
            fee.profiles?.class_name || "-";

        const phone =
            fee.profiles?.phone || "";

        const amount =
            Number(fee.amount || 0);

        const paid =
            Number(fee.paid_amount || 0);

        const due =
            Math.max(amount - paid, 0);

        const note =
            fee.note || "-";

        const dueDate =
            fee.due_date
                ? new Date(
                    fee.due_date + "T00:00:00"
                ).toLocaleDateString("en-IN")
                : "-";


        let statusClass = "";

        if (fee.status === "paid") {
            statusClass = "green";
        }
        else if (fee.status === "partial") {
            statusClass = "orange";
        }
        else if (fee.status === "overdue") {
            statusClass = "red";
        }
        else {
            statusClass = "blue";
        }


        const statusText =
            fee.status
                ? fee.status.charAt(0).toUpperCase()
                  + fee.status.slice(1)
                : "Pending";


        return `
            <tr>

                <td>
                    <strong>
                        ${escapeHTML(student)}
                    </strong>
                    <br>
                    <small>
                        ${escapeHTML(className)}
                    </small>
                    ${
                        phone
                            ? `<br><small>${escapeHTML(phone)}</small>`
                            : ""
                    }
                </td>

                <td>
                    ${escapeHTML(fee.fee_type || "-")}
                </td>

                <td>
                    <strong>
                        ${formatMoney(amount)}
                    </strong>
                </td>

                <td>
                    <span class="green">
                        ${formatMoney(paid)}
                    </span>
                </td>

                <td>
                    <span class="${due > 0 ? "orange" : "green"}">
                        ${formatMoney(due)}
                    </span>
                </td>

                <td>
                    ${dueDate}
                </td>

                <td>
                    <span class="status-badge ${statusClass}">
                        ${statusText}
                    </span>
                </td>

                <td>
                    ${escapeHTML(note)}
                </td>

                <td>

                    <button
                        type="button"
                        class="btn btn-small"
                        onclick="editFee('${fee.id}')">
                        ✏️ Edit
                    </button>

                    <button
                        type="button"
                        class="btn btn-small danger"
                        onclick="deleteFee('${fee.id}')">
                        🗑️ Delete
                    </button>

                </td>

            </tr>
        `;

    }).join("");
}


/* =========================================================
   UPDATE DASHBOARD STATS
   ========================================================= */

function updateStats() {

    let totalFee = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let totalOverdue = 0;


    fees.forEach(fee => {

        const amount =
            Number(fee.amount || 0);

        const paid =
            Number(fee.paid_amount || 0);

        const due =
            Math.max(amount - paid, 0);


        totalFee += amount;

        totalPaid += paid;

        totalDue += due;


        if (fee.status === "overdue") {
            totalOverdue += due;
        }
    });


    setText(
        "totalFee",
        formatMoney(totalFee)
    );

    setText(
        "totalPaid",
        formatMoney(totalPaid)
    );

    setText(
        "totalDue",
        formatMoney(totalDue)
    );

    setText(
        "totalOverdue",
        formatMoney(totalOverdue)
    );
}


/* =========================================================
   OPEN ADD MODAL
   ========================================================= */

function openAddFeeModal() {

    editingFeeId = null;

    setText(
        "modalTitle",
        "➕ Add Fee"
    );

    const form = $("feeForm");

    if (form) {
        form.reset();
    }


    setText(
        "previewAmount",
        "₹0"
    );

    setText(
        "previewPaid",
        "₹0"
    );

    setText(
        "previewDue",
        "₹0"
    );


    const dueDate = $("dueDate");

    if (dueDate) {

        const today =
            new Date().toISOString().split("T")[0];

        dueDate.value = today;
    }


    showFeeModal();
}


/* =========================================================
   SHOW MODAL
   ========================================================= */

function showFeeModal() {

    const modal =
        $("feeModal") ||
        $("feeModalContainer");

    if (!modal) return;

    modal.classList.add("active");

    modal.style.display = "flex";
}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeFeeModal() {

    const modal =
        $("feeModal") ||
        $("feeModalContainer");

    if (!modal) return;

    modal.classList.remove("active");

    modal.style.display = "none";

    editingFeeId = null;
}


/* =========================================================
   EDIT FEE
   ========================================================= */

function editFee(id) {

    const fee = fees.find(
        item => String(item.id) === String(id)
    );

    if (!fee) {
        alert("Fee record not found.");
        return;
    }


    editingFeeId = fee.id;


    setText(
        "modalTitle",
        "✏️ Edit Fee"
    );


    setValue(
        "studentId",
        fee.student_id
    );

    setValue(
        "feeType",
        fee.fee_type
    );

    setValue(
        "amount",
        fee.amount
    );

    setValue(
        "paidAmount",
        fee.paid_amount
    );

    setValue(
        "dueDate",
        fee.due_date
    );

    setValue(
        "note",
        fee.note
    );


    updateAmountPreview();

    showFeeModal();
}


/* =========================================================
   AMOUNT PREVIEW
   ========================================================= */

function updateAmountPreview() {

    const amount =
        Number(
            $("amount")?.value || 0
        );

    const paid =
        Number(
            $("paidAmount")?.value || 0
        );

    const due =
        Math.max(amount - paid, 0);


    setText(
        "previewAmount",
        formatMoney(amount)
    );

    setText(
        "previewPaid",
        formatMoney(paid)
    );

    setText(
        "previewDue",
        formatMoney(due)
    );
}


/* =========================================================
   SAVE FEE
   ========================================================= */

async function saveFee(event) {

    if (event) {
        event.preventDefault();
    }


    const studentId =
        $("studentId")?.value;

    const feeType =
        $("feeType")?.value.trim();

    const amount =
        Number(
            $("amount")?.value || 0
        );

    const paidAmount =
        Number(
            $("paidAmount")?.value || 0
        );

    const dueDate =
        $("dueDate")?.value || null;

    const note =
        $("note")?.value.trim() || null;


    /* VALIDATION */

    if (!studentId) {
        alert("Please select a student.");
        return;
    }

    if (!feeType) {
        alert("Please enter fee type.");
        return;
    }

    if (amount < 0) {
        alert("Amount cannot be negative.");
        return;
    }

    if (paidAmount < 0) {
        alert("Paid amount cannot be negative.");
        return;
    }

    if (paidAmount > amount) {
        alert("Paid amount total fee se zyada nahi ho sakta.");
        return;
    }


    const saveButton =
        $("saveFeeBtn");

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";
    }


    try {

        /* =================================================
           UPDATE
           ================================================= */

        if (editingFeeId) {

            const { error } = await db
                .from("fees")
                .update({
                    student_id: studentId,
                    fee_type: feeType,
                    amount: amount,
                    paid_amount: paidAmount,
                    due_date: dueDate,
                    note: note
                })
                .eq("id", editingFeeId);


            if (error) {
                throw error;
            }

            alert("Fee updated successfully.");
        }


        /* =================================================
           INSERT
           ================================================= */

        else {

            const { error } = await db
                .from("fees")
                .insert({
                    student_id: studentId,
                    fee_type: feeType,
                    amount: amount,
                    paid_amount: paidAmount,
                    due_date: dueDate,
                    note: note
                });


            if (error) {
                throw error;
            }

            alert("Fee added successfully.");
        }


        closeFeeModal();

        await loadFees();
    }


    catch (error) {

        console.error(
            "Save fee error:",
            error
        );

        alert(
            "Fee save nahi ho paayi.\n\n" +
            error.message
        );
    }


    finally {

        if (saveButton) {

            saveButton.disabled = false;

            saveButton.textContent =
                editingFeeId
                    ? "Update Fee"
                    : "Save Fee";
        }
    }
}


/* =========================================================
   DELETE FEE
   ========================================================= */

async function deleteFee(id) {

    const fee = fees.find(
        item => String(item.id) === String(id)
    );

    if (!fee) return;


    const studentName =
        fee.profiles?.full_name ||
        "this student";


    const confirmed =
        confirm(
            `Delete fee record for ${studentName}?\n\n` +
            `This action cannot be undone.`
        );


    if (!confirmed) {
        return;
    }


    const { error } = await db
        .from("fees")
        .delete()
        .eq("id", id);


    if (error) {

        console.error(
            "Delete fee error:",
            error
        );

        alert(
            "Fee delete nahi ho paayi.\n\n" +
            error.message
        );

        return;
    }


    alert("Fee deleted successfully.");

    await loadFees();
}


/* =========================================================
   FILTER EVENTS
   ========================================================= */

function setupFilters() {

    const searchInput =
        $("searchInput") ||
        $("feeSearch");

    const statusFilter =
        $("statusFilter") ||
        $("feeStatusFilter");


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            renderFees
        );
    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            renderFees
        );
    }
}


/* =========================================================
   REFRESH BUTTON
   ========================================================= */

function setupRefresh() {

    const refreshBtn =
        $("refreshBtn");

    if (!refreshBtn) return;


    refreshBtn.addEventListener(
        "click",
        async () => {

            refreshBtn.disabled = true;

            refreshBtn.textContent =
                "Loading...";

            await loadStudents();

            await loadFees();

            refreshBtn.disabled = false;

            refreshBtn.textContent =
                "↻ Refresh";
        }
    );
}


/* =========================================================
   MODAL EVENTS
   ========================================================= */

function setupModalEvents() {

    const addButton =
        $("addFeeBtn");

    if (addButton) {

        addButton.addEventListener(
            "click",
            openAddFeeModal
        );
    }


    const closeButtons = [

        $("closeModalBtn"),

        $("cancelBtn"),

        $("closeFeeModal"),

        $("cancelFeeBtn"),

        $("closeModal")
    ];


    closeButtons.forEach(button => {

        if (!button) return;

        button.addEventListener(
            "click",
            closeFeeModal
        );
    });


    const modal =
        $("feeModal") ||
        $("feeModalContainer");


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (event.target === modal) {
                    closeFeeModal();
                }
            }
        );
    }


    const form =
        $("feeForm");


    if (form) {

        form.addEventListener(
            "submit",
            saveFee
        );
    }


    const amount =
        $("amount");

    const paidAmount =
        $("paidAmount");


    if (amount) {

        amount.addEventListener(
            "input",
            updateAmountPreview
        );
    }


    if (paidAmount) {

        paidAmount.addEventListener(
            "input",
            updateAmountPreview
        );
    }
}


/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogout() {

    const logoutBtn =
        $("logoutBtn");

    if (!logoutBtn) return;


    logoutBtn.addEventListener(
        "click",
        async () => {

            const confirmed =
                confirm(
                    "Are you sure you want to logout?"
                );

            if (!confirmed) {
                return;
            }


            await db.auth.signOut();

            window.location.href =
                "../login.html";
        }
    );
}


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initFeesAdmin() {

    const isAdmin =
        await checkAdmin();

    if (!isAdmin) {
        return;
    }


    await loadStudents();

    await loadFees();


    setupFilters();

    setupModalEvents();

    setupRefresh();

    setupLogout();
}


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.openAddFeeModal =
    openAddFeeModal;

window.closeFeeModal =
    closeFeeModal;

window.editFee =
    editFee;

window.deleteFee =
    deleteFee;

window.updateAmountPreview =
    updateAmountPreview;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initFeesAdmin
);
