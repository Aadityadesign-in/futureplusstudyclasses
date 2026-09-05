// ==========================================
// Future Plus Study Classes
// Admin Admission Management
// ==========================================

let allAdmissions = [];


// ------------------------------------------
// CHECK ADMIN
// ------------------------------------------

async function checkAdmin() {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error || !user) {

        window.location.href = "../login.html";
        return false;

    }


    const {
        data: profile,
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .select("role, status")
        .eq("id", user.id)
        .single();


    if (
        profileError ||
        !profile ||
        profile.role !== "admin" ||
        profile.status !== "approved"
    ) {

        alert("Admin access only.");

        window.location.href =
            "../student/dashboard.html";

        return false;

    }

    return true;
}


// ------------------------------------------
// LOAD ADMISSIONS
// ------------------------------------------

async function loadAdmissions() {

    const {
        data,
        error
    } = await supabaseClient
        .from("admissions")
        .select("*")
        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error(
            "Admission loading error:",
            error
        );

        document.getElementById(
            "admissionTableBody"
        ).innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="empty"
                >
                    Failed to load applications.
                </td>

            </tr>

        `;

        return;

    }


    allAdmissions = data || [];

    updateStats();

    filterAdmissions();

}


// ------------------------------------------
// STATISTICS
// ------------------------------------------

function updateStats() {

    const total = allAdmissions.length;

    const pending =
        allAdmissions.filter(
            item => item.status === "pending"
        ).length;

    const contacted =
        allAdmissions.filter(
            item => item.status === "contacted"
        ).length;

    const approved =
        allAdmissions.filter(
            item => item.status === "approved"
        ).length;

    const rejected =
        allAdmissions.filter(
            item => item.status === "rejected"
        ).length;


    document.getElementById(
        "totalAdmissions"
    ).textContent = total;

    document.getElementById(
        "pendingAdmissions"
    ).textContent = pending;

    document.getElementById(
        "contactedAdmissions"
    ).textContent = contacted;

    document.getElementById(
        "approvedAdmissions"
    ).textContent = approved;

    document.getElementById(
        "rejectedAdmissions"
    ).textContent = rejected;

}


// ------------------------------------------
// FILTER + SEARCH
// ------------------------------------------

function filterAdmissions() {

    const search =
        document.getElementById(
            "searchAdmission"
        ).value
        .toLowerCase()
        .trim();


    const status =
        document.getElementById(
            "statusFilter"
        ).value;


    const filtered =
        allAdmissions.filter(item => {

            const searchableText = `

                ${item.student_name || ""}
                ${item.father_name || ""}
                ${item.phone || ""}
                ${item.email || ""}
                ${item.class_name || ""}
                ${item.course || ""}

            `.toLowerCase();


            const searchMatch =
                searchableText.includes(search);


            const statusMatch =
                !status ||
                item.status === status;


            return (
                searchMatch &&
                statusMatch
            );

        });


    renderAdmissions(filtered);

}


// ------------------------------------------
// RENDER TABLE
// ------------------------------------------

function renderAdmissions(admissions) {

    const tbody =
        document.getElementById(
            "admissionTableBody"
        );


    if (!admissions.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="empty"
                >
                    No admission applications found.
                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML =
        admissions.map(item => {

            const date =
                item.created_at
                    ? new Date(
                        item.created_at
                    ).toLocaleDateString(
                        "en-IN"
                    )
                    : "-";


            return `

                <tr>

                    <td>

                        <strong>
                            ${escapeHtml(
                                item.student_name
                            )}
                        </strong>

                        ${
                            item.email
                            ? `
                            <br>
                            <small>
                                ${escapeHtml(
                                    item.email
                                )}
                            </small>
                            `
                            : ""
                        }

                    </td>


                    <td>

                        ${escapeHtml(
                            item.father_name || "-"
                        )}

                    </td>


                    <td>

                        ${escapeHtml(
                            item.phone || "-"
                        )}

                    </td>


                    <td>

                        ${escapeHtml(
                            item.class_name || "-"
                        )}

                    </td>


                    <td>

                        ${escapeHtml(
                            item.course || "-"
                        )}

                    </td>


                    <td>

                        <span
                            class="
                                status
                                ${item.status}
                            "
                        >

                            ${escapeHtml(
                                item.status || "pending"
                            )}

                        </span>

                    </td>


                    <td>

                        ${date}

                    </td>


                    <td>

                        <button
                            class="
                                action-btn
                                contact-btn
                            "
                            onclick="
                                updateAdmissionStatus(
                                    '${item.id}',
                                    'contacted'
                                )
                            "
                        >
                            Contacted
                        </button>


                        <button
                            class="
                                action-btn
                                approve-btn
                            "
                            onclick="
                                updateAdmissionStatus(
                                    '${item.id}',
                                    'approved'
                                )
                            "
                        >
                            Approve
                        </button>


                        <button
                            class="
                                action-btn
                                reject-btn
                            "
                            onclick="
                                updateAdmissionStatus(
                                    '${item.id}',
                                    'rejected'
                                )
                            "
                        >
                            Reject
                        </button>


                        <button
                            class="
                                action-btn
                                delete-btn
                            "
                            onclick="
                                deleteAdmission(
                                    '${item.id}'
                                )
                            "
                        >
                            Delete
                        </button>

                    </td>

                </tr>

            `;

        }).join("");

}


// ------------------------------------------
// UPDATE STATUS
// ------------------------------------------

async function updateAdmissionStatus(
    id,
    status
) {

    const {
        error
    } = await supabaseClient
        .from("admissions")
        .update({
            status: status
        })
        .eq("id", id);


    if (error) {

        console.error(error);

        alert(
            "Status update nahi hua."
        );

        return;

    }


    await loadAdmissions();

}


// ------------------------------------------
// DELETE APPLICATION
// ------------------------------------------

async function deleteAdmission(id) {

    const confirmed =
        confirm(
            "Kya aap is admission application ko delete karna chahte hain?"
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } = await supabaseClient
        .from("admissions")
        .delete()
        .eq("id", id);


    if (error) {

        console.error(error);

        alert(
            "Application delete nahi hua."
        );

        return;

    }


    await loadAdmissions();

}


// ------------------------------------------
// LOGOUT
// ------------------------------------------

async function logout() {

    await supabaseClient.auth.signOut();

    window.location.href =
        "../login.html";

}


// ------------------------------------------
// HTML ESCAPE
// ------------------------------------------

function escapeHtml(value) {

    if (value === null ||
        value === undefined) {

        return "";

    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ------------------------------------------
// EVENTS
// ------------------------------------------

document.getElementById(
    "searchAdmission"
).addEventListener(
    "input",
    filterAdmissions
);


document.getElementById(
    "statusFilter"
).addEventListener(
    "change",
    filterAdmissions
);


document.getElementById(
    "logoutBtn"
).addEventListener(
    "click",
    logout
);


// ------------------------------------------
// START APP
// ------------------------------------------

async function init() {

    const admin =
        await checkAdmin();

    if (!admin) {
        return;
    }

    await loadAdmissions();

}


init();