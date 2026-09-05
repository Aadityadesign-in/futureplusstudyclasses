// ==================================================
// FUTURE PLUS STUDY Classes
// ADMIN DASHBOARD
// STUDENTS + ADMISSIONS
// ==================================================


// ==================================================
// GLOBAL DATA
// ==================================================

let allStudents = [];
let allAdmissions = [];


// ==================================================
// STUDENT ELEMENTS
// ==================================================

const studentTableBody =
    document.getElementById("studentTableBody");

const totalStudents =
    document.getElementById("totalStudents");

const pendingStudents =
    document.getElementById("pendingStudents");

const approvedStudents =
    document.getElementById("approvedStudents");

const rejectedStudents =
    document.getElementById("rejectedStudents");

const studentSearch =
    document.getElementById("studentSearch");


// ==================================================
// ADMISSION ELEMENTS
// ==================================================

const admissionTableBody =
    document.getElementById("admissionTableBody");

const totalAdmissions =
    document.getElementById("totalAdmissions");

const pendingAdmissions =
    document.getElementById("pendingAdmissions");

const approvedAdmissions =
    document.getElementById("approvedAdmissions");


// ==================================================
// COMMON ELEMENTS
// ==================================================

const logoutBtn =
    document.getElementById("logoutBtn");

const adminError =
    document.getElementById("adminError");


// ==================================================
// ERROR MESSAGE
// ==================================================

function showAdminError(message) {

    if (!adminError) return;

    adminError.textContent = message;

    adminError.style.display = "block";
}


// ==================================================
// HIDE ERROR
// ==================================================

function hideAdminError() {

    if (!adminError) return;

    adminError.textContent = "";

    adminError.style.display = "none";
}


// ==================================================
// CHECK ADMIN
// ==================================================

async function checkAdmin() {

    try {

        const {
            data: {
                user
            },
            error: sessionError
        } = await supabaseClient.auth.getUser();


        if (sessionError || !user) {

            window.location.href =
                "../login.html";

            return false;
        }


        const {
            data: profile,
            error
        } =
            await supabaseClient
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();


        if (error) {

            console.error(error);

            await supabaseClient.auth.signOut();

            window.location.href =
                "../login.html";

            return false;
        }


        if (
            profile.role !== "admin" ||
            profile.status !== "approved"
        ) {

            await supabaseClient.auth.signOut();

            window.location.href =
                "../login.html";

            return false;
        }


        return true;

    }

    catch (error) {

        console.error(
            "Admin check error:",
            error
        );

        window.location.href =
            "../login.html";

        return false;
    }
}


// ==================================================
// LOAD STUDENTS
// ==================================================

async function loadStudents() {

    if (studentTableBody) {

        studentTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading">
                    Loading students...
                </td>
            </tr>
        `;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("profiles")
                .select("*")
                .eq("role", "student")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            throw error;

        }


        allStudents = data || [];


        updateStudentStatistics();


        renderStudents(
            allStudents
        );


    }

    catch (error) {

        console.error(
            "Load students error:",
            error
        );


        showAdminError(
            "Students load नहीं हो सके: " +
            error.message
        );


        if (studentTableBody) {

            studentTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty">
                        Unable to load students.
                    </td>
                </tr>
            `;

        }

    }

}


// ==================================================
// STUDENT STATISTICS
// ==================================================

function updateStudentStatistics() {

    const total =
        allStudents.length;


    const pending =
        allStudents.filter(
            student =>
                student.status === "pending"
        ).length;


    const approved =
        allStudents.filter(
            student =>
                student.status === "approved"
        ).length;


    const rejected =
        allStudents.filter(
            student =>
                student.status === "rejected"
        ).length;


    if (totalStudents)
        totalStudents.textContent =
            total;


    if (pendingStudents)
        pendingStudents.textContent =
            pending;


    if (approvedStudents)
        approvedStudents.textContent =
            approved;


    if (rejectedStudents)
        rejectedStudents.textContent =
            rejected;

}


// ==================================================
// RENDER STUDENTS
// ==================================================

function renderStudents(students) {

    if (!studentTableBody)
        return;


    if (!students.length) {

        studentTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    No students found.
                </td>
            </tr>
        `;

        return;
    }


    studentTableBody.innerHTML =
        students
            .map(student => {

                const status =
                    student.status || "pending";


                let statusClass =
                    "pending";


                if (
                    status === "approved"
                ) {

                    statusClass =
                        "approved";

                }


                if (
                    status === "rejected"
                ) {

                    statusClass =
                        "rejected";

                }


                let actions = "";


                if (
                    status === "pending"
                ) {

                    actions = `

                        <button
                            class="action-btn approve-btn"
                            onclick="updateStudentStatus(
                                '${student.id}',
                                'approved'
                            )"
                        >
                            Approve
                        </button>

                        <button
                            class="action-btn reject-btn"
                            onclick="updateStudentStatus(
                                '${student.id}',
                                'rejected'
                            )"
                        >
                            Reject
                        </button>

                    `;

                }


                if (
                    status === "rejected"
                ) {

                    actions = `

                        <button
                            class="action-btn approve-btn"
                            onclick="updateStudentStatus(
                                '${student.id}',
                                'approved'
                            )"
                        >
                            Approve
                        </button>

                    `;

                }


                if (
                    status === "approved"
                ) {

                    actions = `

                        <button
                            class="action-btn reject-btn"
                            onclick="updateStudentStatus(
                                '${student.id}',
                                'rejected'
                            )"
                        >
                            Reject
                        </button>

                    `;

                }


                return `

                    <tr>

                        <td>
                            ${escapeHTML(
                                student.full_name || "-"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                student.email || "-"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                student.phone || "-"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                student.class_name || "-"
                            )}
                        </td>

                        <td>

                            <span
                                class="status ${statusClass}"
                            >
                                ${status.toUpperCase()}
                            </span>

                        </td>

                        <td>
                            ${actions}
                        </td>

                    </tr>

                `;

            })
            .join("");

}


// ==================================================
// UPDATE STUDENT STATUS
// ==================================================

async function updateStudentStatus(
    studentId,
    newStatus
) {

    const actionText =
        newStatus === "approved"
            ? "approve"
            : "reject";


    const confirmed =
        confirm(
            `क्या आप इस student को ${actionText} करना चाहते हैं?`
        );


    if (!confirmed)
        return;


    try {

        const {
            error
        } =
            await supabaseClient
                .from("profiles")
                .update({
                    status: newStatus
                })
                .eq(
                    "id",
                    studentId
                );


        if (error) {

            throw error;

        }


        await loadStudents();


        alert(
            newStatus === "approved"
                ? "Student approved successfully."
                : "Student rejected successfully."
        );

    }

    catch (error) {

        console.error(
            "Update status error:",
            error
        );


        alert(
            "Status update failed: " +
            error.message
        );

    }

}


// ==================================================
// STUDENT SEARCH
// ==================================================

if (studentSearch) {

    studentSearch.addEventListener(
        "input",
        function () {

            const search =
                this.value
                    .trim()
                    .toLowerCase();


            if (!search) {

                renderStudents(
                    allStudents
                );

                return;
            }


            const filtered =
                allStudents.filter(
                    student => {

                        return (

                            (student.full_name || "")
                                .toLowerCase()
                                .includes(search)

                            ||

                            (student.email || "")
                                .toLowerCase()
                                .includes(search)

                            ||

                            (student.phone || "")
                                .toLowerCase()
                                .includes(search)

                            ||

                            (student.class_name || "")
                                .toLowerCase()
                                .includes(search)

                        );

                    }
                );


            renderStudents(
                filtered
            );

        }
    );

}


// ==================================================
// LOAD ADMISSIONS
// ==================================================

async function loadAdmissions() {

    if (admissionTableBody) {

        admissionTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading">
                    Loading admissions...
                </td>
            </tr>
        `;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("admissions")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            throw error;

        }


        allAdmissions =
            data || [];


        updateAdmissionStatistics();


        renderAdmissions(
            allAdmissions
        );


    }

    catch (error) {

        console.error(
            "Load admissions error:",
            error
        );


        showAdminError(
            "Admissions load नहीं हो सके: " +
            error.message
        );


        if (admissionTableBody) {

            admissionTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty">
                        Unable to load admissions.
                    </td>
                </tr>
            `;

        }

    }

}


// ==================================================
// ADMISSION STATISTICS
// ==================================================

function updateAdmissionStatistics() {

    const total =
        allAdmissions.length;


    const pending =
        allAdmissions.filter(
            admission =>
                admission.status === "pending"
        ).length;


    const approved =
        allAdmissions.filter(
            admission =>
                admission.status === "approved"
        ).length;


    if (totalAdmissions)
        totalAdmissions.textContent =
            total;


    if (pendingAdmissions)
        pendingAdmissions.textContent =
            pending;


    if (approvedAdmissions)
        approvedAdmissions.textContent =
            approved;

}


// ==================================================
// RENDER ADMISSIONS
// ==================================================

function renderAdmissions(
    admissions
) {

    if (!admissionTableBody)
        return;


    if (!admissions.length) {

        admissionTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty">
                    No admission applications found.
                </td>
            </tr>
        `;

        return;
    }


    // Show latest 10 applications
    const latestAdmissions =
        admissions.slice(0, 10);


    admissionTableBody.innerHTML =
        latestAdmissions
            .map(admission => {

                const status =
                    admission.status ||
                    "pending";


                let statusClass =
                    "pending";


                if (
                    status === "approved"
                ) {

                    statusClass =
                        "approved";

                }


                if (
                    status === "rejected"
                ) {

                    statusClass =
                        "rejected";

                }


                if (
                    status === "contacted"
                ) {

                    statusClass =
                        "contacted";

                }


                return `

                    <tr>

                        <td>
                            ${escapeHTML(
                                admission.student_name || "-"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                admission.phone || "-"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                admission.class_name || "-"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                admission.course || "-"
                            )}
                        </td>

                        <td>

                            <span
                                class="status ${statusClass}"
                            >
                                ${status.toUpperCase()}
                            </span>

                        </td>

                        <td>

                            <button
                                class="action-btn view-btn"
                                onclick="viewAdmission(
                                    '${admission.id}'
                                )"
                            >
                                View
                            </button>

                        </td>

                    </tr>

                `;

            })
            .join("");

}


// ==================================================
// VIEW ADMISSION
// ==================================================

function viewAdmission(
    admissionId
) {

    const admission =
        allAdmissions.find(
            item =>
                String(item.id) ===
                String(admissionId)
        );


    if (!admission) {

        alert(
            "Admission application not found."
        );

        return;
    }


    const message = `

Student Name:
${admission.student_name || "-"}

Father Name:
${admission.father_name || "-"}

Phone:
${admission.phone || "-"}

Email:
${admission.email || "-"}

Class:
${admission.class_name || "-"}

Course:
${admission.course || "-"}

Address:
${admission.address || "-"}

Message:
${admission.message || "-"}

Status:
${admission.status || "pending"}

    `;


    alert(message);

}


// ==================================================
// LOGOUT
// ==================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async function () {

            const confirmed =
                confirm(
                    "क्या आप logout करना चाहते हैं?"
                );


            if (!confirmed)
                return;


            await supabaseClient.auth.signOut();


            window.location.href =
                "../login.html";

        }
    );

}


// ==================================================
// HTML ESCAPE
// ==================================================

function escapeHTML(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


// ==================================================
// INITIALIZE ADMIN DASHBOARD
// ==================================================

(async function initAdminDashboard() {

    const isAdmin =
        await checkAdmin();


    if (!isAdmin) {

        return;

    }


    // Load both sections
    await Promise.all([
        loadStudents(),
        loadAdmissions()
    ]);

})();
