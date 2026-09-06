// ==================================================
// FUTURE PLUS STUDY CLASSES
// PROFESSIONAL ADMIN DASHBOARD
// ==================================================

let allStudents = [];
let allAdmissions = [];
let currentAdminProfile = null;


// ==================================================
// ELEMENTS
// ==================================================

const studentTableBody = document.getElementById("studentTableBody");
const admissionTableBody = document.getElementById("admissionTableBody");

const totalStudents = document.getElementById("totalStudents");
const pendingStudents = document.getElementById("pendingStudents");
const approvedStudents = document.getElementById("approvedStudents");
const approvedStudentsMini = document.getElementById("approvedStudentsMini");
const rejectedStudents = document.getElementById("rejectedStudents");

const totalAdmissions = document.getElementById("totalAdmissions");
const pendingAdmissions = document.getElementById("pendingAdmissions");
const pendingAdmissionsMini = document.getElementById("pendingAdmissionsMini");
const approvedAdmissions = document.getElementById("approvedAdmissions");

const totalAssignments = document.getElementById("totalAssignments");
const todayAttendance = document.getElementById("todayAttendance");
const totalFeesRecords = document.getElementById("totalFeesRecords");
const totalMaterials = document.getElementById("totalMaterials");
const totalNotices = document.getElementById("totalNotices");

const studentSearch = document.getElementById("studentSearch");
const logoutBtn = document.getElementById("logoutBtn");
const adminError = document.getElementById("adminError");
const adminName = document.getElementById("adminName");
const currentDate = document.getElementById("currentDate");
const refreshBtn = document.getElementById("refreshBtn");

const adminSidebar = document.getElementById("adminSidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const menuBtn = document.getElementById("menuBtn");
const toast = document.getElementById("toast");


// ==================================================
// HELPERS
// ==================================================

function normalizeStatus(value, fallback = "pending") {
    const result = String(value || fallback).trim().toLowerCase();
    return result || fallback;
}


function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function showAdminError(message) {

    if (!adminError) return;

    adminError.textContent = message;
    adminError.style.display = "block";
}


function hideAdminError() {

    if (!adminError) return;

    adminError.textContent = "";
    adminError.style.display = "none";
}


function showToast(message) {

    if (!toast) return;

    toast.textContent = message;
    toast.style.display = "block";

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.style.display = "none";
    }, 2500);
}


function formatTodayForDatabase() {

    const now = new Date();

    const year = now.getFullYear();

    const month =
        String(now.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(now.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function setCurrentDate() {

    if (!currentDate) return;

    currentDate.textContent =
        new Intl.DateTimeFormat("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }).format(new Date());
}


// ==================================================
// SIDEBAR
// ==================================================

function openSidebar() {

    if (!adminSidebar || !sidebarOverlay)
        return;

    adminSidebar.classList.add("open");

    sidebarOverlay.classList.add("show");

    document.body.classList.add("sidebar-open");
}


function closeSidebar() {

    if (!adminSidebar || !sidebarOverlay)
        return;

    adminSidebar.classList.remove("open");

    sidebarOverlay.classList.remove("show");

    document.body.classList.remove("sidebar-open");
}


if (menuBtn) {

    menuBtn.addEventListener(
        "click",
        openSidebar
    );
}


if (sidebarOverlay) {

    sidebarOverlay.addEventListener(
        "click",
        closeSidebar
    );
}


document
    .querySelectorAll(".sidebar .nav-link")
    .forEach(link => {

        link.addEventListener(
            "click",
            () => {

                if (window.innerWidth <= 900) {
                    closeSidebar();
                }

            }
        );

    });


window.addEventListener(
    "resize",
    () => {

        if (window.innerWidth > 900) {
            closeSidebar();
        }

    }
);


// ==================================================
// ADMIN SECURITY CHECK
// ==================================================

async function checkAdmin() {

    try {

        const {
            data: {
                user
            },
            error: userError
        } =
            await supabaseClient.auth.getUser();


        if (userError || !user) {

            window.location.href =
                "../login.html";

            return false;
        }


        const {
            data: profile,
            error: profileError
        } =
            await supabaseClient
                .from("profiles")
                .select(
                    "id, full_name, email, role, status"
                )
                .eq("id", user.id)
                .single();


        if (profileError || !profile) {

            console.error(
                "Admin profile error:",
                profileError
            );

            await supabaseClient.auth.signOut();

            window.location.href =
                "../login.html";

            return false;
        }


        const role =
            normalizeStatus(
                profile.role,
                ""
            );


        const status =
            normalizeStatus(
                profile.status,
                ""
            );


        if (
            role !== "admin" ||
            status !== "approved"
        ) {

            await supabaseClient.auth.signOut();

            window.location.href =
                "../login.html";

            return false;
        }


        currentAdminProfile =
            profile;


        if (adminName) {

            adminName.textContent =
                profile.full_name ||
                "Admin";

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


        allStudents =
            data || [];


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
            (
                error.message ||
                "Unknown error"
            )
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
                normalizeStatus(
                    student.status
                ) === "pending"
        ).length;


    const approved =
        allStudents.filter(
            student =>
                normalizeStatus(
                    student.status
                ) === "approved"
        ).length;


    const rejected =
        allStudents.filter(
            student =>
                normalizeStatus(
                    student.status
                ) === "rejected"
        ).length;


    if (totalStudents) {

        totalStudents.textContent =
            total;

    }


    if (pendingStudents) {

        pendingStudents.textContent =
            pending;

    }


    if (approvedStudents) {

        approvedStudents.textContent =
            approved;

    }


    if (approvedStudentsMini) {

        approvedStudentsMini.textContent =
            approved;

    }


    if (rejectedStudents) {

        rejectedStudents.textContent =
            rejected;

    }

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
                    normalizeStatus(
                        student.status
                    );


                const validStatusClasses = [
                    "pending",
                    "approved",
                    "rejected"
                ];


                const statusClass =
                    validStatusClasses.includes(
                        status
                    )
                        ? status
                        : "pending";


                let actions = "";


                if (status === "pending") {

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


                else if (
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


                else if (
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


                else {

                    actions =
                        `<span style="color:#94a3b8;">—</span>`;

                }


                return `

                    <tr>

                        <td>
                            ${escapeHTML(
                                student.full_name ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                student.email ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                student.phone ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                student.class_name ||
                                "-"
                            )}
                        </td>

                        <td>

                            <span
                                class="status ${statusClass}"
                            >
                                ${escapeHTML(
                                    status.toUpperCase()
                                )}
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


        showToast(
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
            (
                error.message ||
                "Unknown error"
            )
        );

    }

}


window.updateStudentStatus =
    updateStudentStatus;


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

                            (
                                student.full_name ||
                                ""
                            )
                                .toLowerCase()
                                .includes(search)

                            ||

                            (
                                student.email ||
                                ""
                            )
                                .toLowerCase()
                                .includes(search)

                            ||

                            (
                                student.phone ||
                                ""
                            )
                                .toLowerCase()
                                .includes(search)

                            ||

                            (
                                student.class_name ||
                                ""
                            )
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
            (
                error.message ||
                "Unknown error"
            )
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
                normalizeStatus(
                    admission.status
                ) === "pending"
        ).length;


    const approved =
        allAdmissions.filter(
            admission =>
                normalizeStatus(
                    admission.status
                ) === "approved"
        ).length;


    if (totalAdmissions) {

        totalAdmissions.textContent =
            total;

    }


    if (pendingAdmissions) {

        pendingAdmissions.textContent =
            pending;

    }


    if (pendingAdmissionsMini) {

        pendingAdmissionsMini.textContent =
            pending;

    }


    if (approvedAdmissions) {

        approvedAdmissions.textContent =
            approved;

    }

}


// ==================================================
// RENDER ADMISSIONS
// ==================================================

function renderAdmissions(admissions) {

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


    const latestAdmissions =
        admissions.slice(
            0,
            10
        );


    admissionTableBody.innerHTML =
        latestAdmissions
            .map(admission => {

                const status =
                    normalizeStatus(
                        admission.status
                    );


                const validStatusClasses = [
                    "pending",
                    "approved",
                    "rejected",
                    "contacted"
                ];


                const statusClass =
                    validStatusClasses.includes(
                        status
                    )
                        ? status
                        : "pending";


                const studentName =
                    admission.student_name ||
                    admission.full_name ||
                    "-";


                return `

                    <tr>

                        <td>
                            ${escapeHTML(
                                studentName
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                admission.phone ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                admission.class_name ||
                                "-"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                admission.course ||
                                "-"
                            )}
                        </td>

                        <td>

                            <span
                                class="status ${statusClass}"
                            >
                                ${escapeHTML(
                                    status.toUpperCase()
                                )}
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


    const studentName =
        admission.student_name ||
        admission.full_name ||
        "-";


    const message = `

Student Name:
${studentName}

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


window.viewAdmission =
    viewAdmission;


// ==================================================
// EXTRA DASHBOARD METRICS
// ==================================================

async function countTableRows(
    tableName
) {

    const {
        count,
        error
    } =
        await supabaseClient
            .from(tableName)
            .select(
                "*",
                {
                    count: "exact",
                    head: true
                }
            );


    if (error) {
        throw error;
    }


    return count || 0;
}


async function countTodayAttendance() {

    const {
        count,
        error
    } =
        await supabaseClient
            .from("attendance")
            .select(
                "*",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "attendance_date",
                formatTodayForDatabase()
            );


    if (error) {
        throw error;
    }


    return count || 0;
}


function setMetric(
    element,
    value
) {

    if (!element)
        return;


    element.textContent =
        Number.isFinite(value)
            ? value
            : 0;
}


async function loadDashboardMetrics() {

    const metricJobs = [

        {
            key: "assignments",

            element:
                totalAssignments,

            job: () =>
                countTableRows(
                    "assignments"
                )
        },


        {
            key: "attendance",

            element:
                todayAttendance,

            job: () =>
                countTodayAttendance()
        },


        {
            key: "fees",

            element:
                totalFeesRecords,

            job: () =>
                countTableRows(
                    "fees"
                )
        },


        {
            key: "materials",

            element:
                totalMaterials,

            job: () =>
                countTableRows(
                    "study_materials"
                )
        },


        {
            key: "notices",

            element:
                totalNotices,

            job: () =>
                countTableRows(
                    "notices"
                )
        }

    ];


    const results =
        await Promise.allSettled(
            metricJobs.map(
                item =>
                    item.job()
            )
        );


    results.forEach(
        (
            result,
            index
        ) => {

            const item =
                metricJobs[index];


            if (
                result.status ===
                "fulfilled"
            ) {

                setMetric(
                    item.element,
                    result.value
                );

            }

            else {

                console.warn(
                    `Dashboard metric "${item.key}" could not load:`,
                    result.reason
                );

                setMetric(
                    item.element,
                    0
                );

            }

        }
    );

}


// ==================================================
// REFRESH DASHBOARD
// ==================================================

async function refreshDashboard() {

    hideAdminError();


    if (refreshBtn) {

        refreshBtn.disabled =
            true;

        refreshBtn.textContent =
            "Refreshing...";

    }


    try {

        await Promise.all([

            loadStudents(),

            loadAdmissions(),

            loadDashboardMetrics()

        ]);


        showToast(
            "Dashboard refreshed."
        );

    }

    finally {

        if (refreshBtn) {

            refreshBtn.disabled =
                false;

            refreshBtn.textContent =
                "↻ Refresh";

        }

    }

}


if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        refreshDashboard
    );

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


            try {

                await supabaseClient
                    .auth
                    .signOut();

            }

            finally {

                window.location.href =
                    "../login.html";

            }

        }
    );

}


// ==================================================
// INITIALIZE ADMIN DASHBOARD
// ==================================================

(async function initAdminDashboard() {

    setCurrentDate();


    const isAdmin =
        await checkAdmin();


    if (!isAdmin) {
        return;
    }


    hideAdminError();


    await Promise.all([

        loadStudents(),

        loadAdmissions(),

        loadDashboardMetrics()

    ]);

})();
