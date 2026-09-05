const db = window.supabaseClient;

let currentUser = null;
let editingAssignmentId = null;

let students = [];
let courses = [];
let batches = [];
let assignments = [];


// ========================================
// HELPER
// ========================================

function escapeHTML(value) {

    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
}


function formatDate(date) {

    if (!date) return "-";

    const d = new Date(date + "T00:00:00");

    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


function showMessage(message) {

    alert(message);
}


// ========================================
// ADMIN CHECK
// ========================================

async function checkAdmin() {

    const {
        data: { user },
        error
    } = await db.auth.getUser();

    if (error || !user) {

        location.href = "../login.html";

        return false;
    }

    currentUser = user;


    const {
        data: profile,
        error: profileError
    } = await db
        .from("profiles")
        .select("id, full_name, role, status")
        .eq("id", user.id)
        .single();


    if (
        profileError ||
        !profile ||
        profile.role !== "admin" ||
        profile.status !== "approved"
    ) {

        alert("Admin access required.");

        location.href = "../student/dashboard.html";

        return false;
    }


    return true;
}


// ========================================
// LOAD STUDENTS
// ========================================

async function loadStudents() {

    const {
        data,
        error
    } = await db
        .from("profiles")
        .select("id, full_name, phone, email, class_name")
        .eq("role", "student")
        .eq("status", "approved")
        .order("full_name");


    if (error) {

        console.error(error);

        showMessage("Students load nahi ho paaye.");

        return;
    }


    students = data || [];

    renderStudentDropdown();
}


function renderStudentDropdown() {

    const select = document.getElementById("studentId");

    if (!select) return;


    select.innerHTML = `
        <option value="">Select Student</option>
    `;


    students.forEach(student => {

        const option = document.createElement("option");

        option.value = student.id;

        option.textContent =
            `${student.full_name || "Unnamed"}`
            + ` — ${student.class_name || "No Class"}`
            + `${student.phone ? " — " + student.phone : ""}`;

        select.appendChild(option);

    });

}


// ========================================
// LOAD COURSES
// ========================================

async function loadCourses() {

    const {
        data,
        error
    } = await db
        .from("courses")
        .select("*")
        .eq("status", "active")
        .order("name");


    if (error) {

        console.error(error);

        return;
    }


    courses = data || [];

    renderCourseDropdown();
}


function renderCourseDropdown() {

    const select = document.getElementById("courseId");

    if (!select) return;


    select.innerHTML = `
        <option value="">Select Course</option>
    `;


    courses.forEach(course => {

        const option = document.createElement("option");

        option.value = course.id;

        option.textContent = course.name;

        select.appendChild(option);

    });

}


// ========================================
// LOAD BATCHES
// ========================================

async function loadBatches() {

    const {
        data,
        error
    } = await db
        .from("batches")
        .select("*")
        .eq("status", "active")
        .order("name");


    if (error) {

        console.error(error);

        return;
    }


    batches = data || [];

    renderBatchDropdown();
}


function renderBatchDropdown() {

    const select = document.getElementById("batchId");

    if (!select) return;


    select.innerHTML = `
        <option value="">Select Batch</option>
    `;


    batches.forEach(batch => {

        const option = document.createElement("option");

        option.value = batch.id;

        option.textContent =
            `${batch.name}`
            + `${batch.class_name ? " — " + batch.class_name : ""}`
            + `${batch.timing ? " — " + batch.timing : ""}`;

        select.appendChild(option);

    });

}


// ========================================
// LOAD ASSIGNMENTS
// ========================================

async function loadAssignments() {

    const tbody =
        document.getElementById("assignmentsTableBody");


    if (tbody) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="loading">
                    Loading assignments...
                </td>
            </tr>
        `;
    }


    const {
        data,
        error
    } = await db
        .from("assignments")
        .select(`
            *,
            student:student_id (
                id,
                full_name,
                phone,
                email,
                class_name
            ),
            course:course_id (
                id,
                name
            ),
            batch:batch_id (
                id,
                name,
                class_name,
                timing,
                teacher_name
            )
        `)
        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error("Assignments error:", error);

        if (tbody) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty">
                        Assignment table load nahi ho paayi.<br>
                        <small>${escapeHTML(error.message)}</small>
                    </td>
                </tr>
            `;
        }

        return;
    }


    assignments = data || [];

    renderAssignments();

    updateStats();
}


// ========================================
// GET NESTED OBJECT
// ========================================

function getNested(value) {

    if (Array.isArray(value)) {

        return value[0] || null;
    }

    return value || null;
}


// ========================================
// RENDER ASSIGNMENTS
// ========================================

function renderAssignments() {

    const tbody =
        document.getElementById("assignmentsTableBody");


    if (!tbody) return;


    const search =
        (document.getElementById("searchInput")?.value || "")
        .trim()
        .toLowerCase();


    const status =
        document.getElementById("statusFilter")?.value || "all";


    const filtered =
        assignments.filter(item => {

            const student =
                getNested(item.student);

            const course =
                getNested(item.course);

            const batch =
                getNested(item.batch);


            const searchable = [

                item.title,

                item.assignment_title,

                item.description,

                student?.full_name,

                student?.phone,

                student?.email,

                student?.class_name,

                course?.name,

                batch?.name

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const searchMatch =
                !search || searchable.includes(search);


            const statusMatch =
                status === "all"
                || item.status === status;


            return searchMatch && statusMatch;

        });


    if (!filtered.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty">
                    📝 No assignments found.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        filtered.map(item => {

            const student =
                getNested(item.student);

            const course =
                getNested(item.course);

            const batch =
                getNested(item.batch);


            const title =
                item.title ||
                item.assignment_title ||
                "Untitled Assignment";


            const statusClass =
                item.status === "active"
                ? "badge-active"
                : "badge-inactive";


            return `

                <tr>

                    <td>

                        <strong>
                            ${escapeHTML(title)}
                        </strong>

                        ${
                            item.description
                            ? `
                                <br>
                                <small style="color:#6b7280;">
                                    ${escapeHTML(
                                        item.description.length > 70
                                        ? item.description.substring(0, 70) + "..."
                                        : item.description
                                    )}
                                </small>
                            `
                            : ""
                        }

                    </td>


                    <td>

                        ${escapeHTML(
                            student?.full_name || "Unknown"
                        )}

                        <br>

                        <small style="color:#6b7280;">
                            ${escapeHTML(
                                student?.class_name || ""
                            )}
                        </small>

                    </td>


                    <td>
                        ${escapeHTML(
                            course?.name || "-"
                        )}
                    </td>


                    <td>

                        ${escapeHTML(
                            batch?.name || "-"
                        )}

                        ${
                            batch?.timing
                            ? `
                                <br>
                                <small style="color:#6b7280;">
                                    ${escapeHTML(batch.timing)}
                                </small>
                            `
                            : ""
                        }

                    </td>


                    <td>
                        ${formatDate(item.due_date)}
                    </td>


                    <td>

                        <span class="badge ${statusClass}">
                            ${escapeHTML(
                                item.status || "active"
                            )}
                        </span>

                    </td>


                    <td>

                        <div class="actions">

                            <button
                                class="action-btn edit-btn"
                                onclick="editAssignment('${item.id}')">
                                ✏️ Edit
                            </button>

                            <button
                                class="action-btn delete-btn"
                                onclick="deleteAssignment('${item.id}')">
                                🗑 Delete
                            </button>

                        </div>

                    </td>

                </tr>

            `;

        }).join("");

}


// ========================================
// STATS
// ========================================

function updateStats() {

    const total =
        assignments.length;


    const active =
        assignments.filter(
            item => item.status === "active"
        ).length;


    const inactive =
        assignments.filter(
            item => item.status === "inactive"
        ).length;


    const uniqueStudents =
        new Set(
            assignments
                .map(item => item.student_id)
                .filter(Boolean)
        ).size;


    document.getElementById("totalAssignments").textContent =
        total;


    document.getElementById("activeAssignments").textContent =
        active;


    document.getElementById("inactiveAssignments").textContent =
        inactive;


    document.getElementById("assignedStudents").textContent =
        uniqueStudents;

}


// ========================================
// OPEN ADD MODAL
// ========================================

function openAddModal() {

    editingAssignmentId = null;


    document.getElementById("modalTitle").textContent =
        "➕ Add Assignment";


    document.getElementById("assignmentForm").reset();


    document.getElementById("saveAssignmentBtn").textContent =
        "Save Assignment";


    document.getElementById("assignmentModal")
        .classList.add("show");

}


// ========================================
// EDIT ASSIGNMENT
// ========================================

function editAssignment(id) {

    const assignment =
        assignments.find(
            item => String(item.id) === String(id)
        );


    if (!assignment) {

        showMessage("Assignment nahi mila.");

        return;
    }


    editingAssignmentId =
        assignment.id;


    document.getElementById("modalTitle").textContent =
        "✏️ Edit Assignment";


    document.getElementById("studentId").value =
        assignment.student_id || "";


    document.getElementById("assignmentTitle").value =
        assignment.title ||
        assignment.assignment_title ||
        "";


    document.getElementById("description").value =
        assignment.description || "";


    document.getElementById("courseId").value =
        assignment.course_id || "";


    document.getElementById("batchId").value =
        assignment.batch_id || "";


    document.getElementById("dueDate").value =
        assignment.due_date || "";


    document.getElementById("status").value =
        assignment.status || "active";


    document.getElementById("saveAssignmentBtn").textContent =
        "Update Assignment";


    document.getElementById("assignmentModal")
        .classList.add("show");

}


// ========================================
// CLOSE MODAL
// ========================================

function closeModal() {

    document.getElementById("assignmentModal")
        .classList.remove("show");

    editingAssignmentId = null;

}


// ========================================
// SAVE ASSIGNMENT
// ========================================

async function saveAssignment(event) {

    event.preventDefault();


    const studentId =
        document.getElementById("studentId").value;


    const title =
        document.getElementById("assignmentTitle").value.trim();


    const description =
        document.getElementById("description").value.trim();


    const courseId =
        document.getElementById("courseId").value;


    const batchId =
        document.getElementById("batchId").value;


    const dueDate =
        document.getElementById("dueDate").value;


    const status =
        document.getElementById("status").value;


    if (!studentId) {

        showMessage("Student select karo.");

        return;
    }


    if (!title) {

        showMessage("Assignment title enter karo.");

        return;
    }


    const button =
        document.getElementById("saveAssignmentBtn");


    button.disabled = true;

    button.textContent =
        editingAssignmentId
        ? "Updating..."
        : "Saving...";


    const payload = {

        student_id: studentId,

        title: title,

        description:
            description || null,

        course_id:
            courseId
            ? Number(courseId)
            : null,

        batch_id:
            batchId
            ? Number(batchId)
            : null,

        due_date:
            dueDate || null,

        status:
            status || "active"

    };


    try {

        let result;


        if (editingAssignmentId) {

            result =
                await db
                    .from("assignments")
                    .update(payload)
                    .eq("id", editingAssignmentId);

        } else {

            result =
                await db
                    .from("assignments")
                    .insert(payload);

        }


        if (result.error) {

            console.error(result.error);

            showMessage(
                "Assignment save nahi hua:\n"
                + result.error.message
            );

            return;
        }


        showMessage(
            editingAssignmentId
            ? "Assignment successfully updated ✅"
            : "Assignment successfully added ✅"
        );


        closeModal();

        await loadAssignments();

    }

    catch (error) {

        console.error(error);

        showMessage(
            "Something went wrong:\n"
            + error.message
        );

    }

    finally {

        button.disabled = false;

        button.textContent =
            editingAssignmentId
            ? "Update Assignment"
            : "Save Assignment";

    }

}


// ========================================
// DELETE ASSIGNMENT
// ========================================

async function deleteAssignment(id) {

    const assignment =
        assignments.find(
            item => String(item.id) === String(id)
        );


    if (!assignment) return;


    const title =
        assignment.title ||
        assignment.assignment_title ||
        "this assignment";


    const confirmed =
        confirm(
            `Delete "${title}"?\n\n`
            + `Ye assignment permanently delete ho jayega.`
        );


    if (!confirmed) return;


    const {
        error
    } = await db
        .from("assignments")
        .delete()
        .eq("id", id);


    if (error) {

        console.error(error);

        showMessage(
            "Delete failed:\n"
            + error.message
        );

        return;
    }


    showMessage(
        "Assignment deleted successfully ✅"
    );


    await loadAssignments();

}


// ========================================
// EVENTS
// ========================================

function setupEvents() {

    document
        .getElementById("addAssignmentBtn")
        ?.addEventListener(
            "click",
            openAddModal
        );


    document
        .getElementById("closeModalBtn")
        ?.addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById("cancelBtn")
        ?.addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById("assignmentForm")
        ?.addEventListener(
            "submit",
            saveAssignment
        );


    document
        .getElementById("searchInput")
        ?.addEventListener(
            "input",
            renderAssignments
        );


    document
        .getElementById("statusFilter")
        ?.addEventListener(
            "change",
            renderAssignments
        );


    document
        .getElementById("refreshBtn")
        ?.addEventListener(
            "click",
            async () => {

                await loadAssignments();

            }
        );


    document
        .getElementById("logoutBtn")
        ?.addEventListener(
            "click",
            logout
        );


    document
        .getElementById("assignmentModal")
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target.id ===
                    "assignmentModal"
                ) {

                    closeModal();

                }

            }
        );

}


// ========================================
// LOGOUT
// ========================================

async function logout() {

    await db.auth.signOut();

    location.href =
        "../login.html";

}


// ========================================
// INIT
// ========================================

async function init() {

    if (!db) {

        alert(
            "Supabase client load nahi hua. "
            + "supabase.js check karo."
        );

        return;
    }


    const isAdmin =
        await checkAdmin();


    if (!isAdmin) return;


    setupEvents();


    await Promise.all([
        loadStudents(),
        loadCourses(),
        loadBatches(),
        loadAssignments()
    ]);

}


// ========================================
// GLOBAL FUNCTIONS
// ========================================

window.openAddModal =
    openAddModal;

window.closeModal =
    closeModal;

window.editAssignment =
    editAssignment;

window.deleteAssignment =
    deleteAssignment;


init();