document.addEventListener("DOMContentLoaded", async () => {

    const supabase = window.supabaseClient;


    // -----------------------------
    // Check Supabase
    // -----------------------------

    if (!supabase) {

        console.error("Supabase client not found.");

        alert(
            "Supabase connection not found."
        );

        return;
    }



    // -----------------------------
    // Get Logged In User
    // -----------------------------

    const {
        data: { user },
        error: authError
    } = await supabase.auth.getUser();


    if (authError || !user) {

        console.error(
            "Authentication error:",
            authError
        );

        window.location.href =
            "../login.html";

        return;
    }



    // -----------------------------
    // Load Student Profile
    // -----------------------------

    const {
        data: profile,
        error: profileError
    } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();


    if (profileError) {

        console.error(
            "Profile load error:",
            profileError
        );

        alert(
            "Unable to load student profile."
        );

        return;
    }


    if (!profile) {

        alert(
            "Student profile not found."
        );

        return;
    }



    // -----------------------------
    // Role Check
    // -----------------------------

    if (profile.role === "admin") {

        window.location.href =
            "../admin/dashboard.html";

        return;
    }



    if (
        profile.role !== "student"
        ||
        profile.status !== "approved"
    ) {

        alert(
            "Your account is pending or not approved yet."
        );

        await supabase.auth.signOut();

        window.location.href =
            "../login.html";

        return;
    }



    // -----------------------------
    // Helper Function
    // -----------------------------

    function setText(id, value) {

        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        element.textContent =
            value || "—";
    }



    // -----------------------------
    // Show Profile
    // -----------------------------

    setText(
        "welcomeName",
        profile.full_name || "Student"
    );


    setText(
        "profileName",
        profile.full_name
    );


    setText(
        "profileEmail",
        profile.email || user.email
    );


    setText(
        "profilePhone",
        profile.phone
    );


    setText(
        "profileClass",
        profile.class_name
    );


    setText(
        "profileStatus",
        profile.status
    );


    setText(
        "courseClass",
        profile.class_name
    );



    // -----------------------------
    // Load Student Assignment
    // -----------------------------

    const {
        data: assignment,
        error: assignmentError
    } = await supabase
        .from("student_assignments")
        .select(`
            id,
            status,

            courses (
                id,
                name,
                description
            ),

            batches (
                id,
                name,
                class_name,
                timing,
                teacher_name
            )
        `)
        .eq(
            "student_id",
            user.id
        )
        .eq(
            "status",
            "active"
        )
        .maybeSingle();



    if (assignmentError) {

        console.error(
            "Assignment load error:",
            assignmentError
        );

    }



    // -----------------------------
    // Assignment Found
    // -----------------------------

    if (assignment) {


        // Supabase relation sometimes
        // object or array return kar sakta hai

        const course =
            Array.isArray(
                assignment.courses
            )
                ? assignment.courses[0]
                : assignment.courses;


        const batch =
            Array.isArray(
                assignment.batches
            )
                ? assignment.batches[0]
                : assignment.batches;



        setText(
            "courseName",
            course?.name ||
            "Course Not Assigned"
        );


        setText(
            "courseClass",
            profile.class_name ||
            batch?.class_name
        );


        setText(
            "courseBatch",
            batch?.name ||
            "Not Assigned"
        );


        setText(
            "courseTiming",
            batch?.timing
        );


        setText(
            "courseTeacher",
            batch?.teacher_name
        );


        setText(
            "assignmentStatus",
            "Assigned"
        );



    } else {


        // -----------------------------
        // No Assignment
        // -----------------------------

        setText(
            "courseName",
            "Course Not Assigned"
        );


        setText(
            "courseBatch",
            "Not Assigned"
        );


        setText(
            "courseTiming",
            "—"
        );


        setText(
            "courseTeacher",
            "—"
        );


        setText(
            "assignmentStatus",
            "Not Assigned"
        );

    }
// =================================
// LOAD STUDENT NOTICES
// =================================

async function loadStudentNotices() {

    const {
        data: notices,
        error
    } = await supabase
        .from("notices")
        .select("*")
        .eq(
            "status",
            "active"
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        )
        .limit(10);


    if (error) {

        console.error(
            "Notice loading error:",
            error
        );

        return;
    }


    const container =
        document.getElementById(
            "noticesContainer"
        );


    if (!container) {
        return;
    }


    // Class filtering

    const filteredNotices =
        (notices || []).filter(
            notice => {

                if (
                    notice.audience ===
                    "all"
                ) {

                    return true;
                }


                if (
                    notice.audience ===
                    "class"
                ) {

                    return (
                        notice.class_name ===
                        profile.class_name
                    );

                }


                return false;

            }
        );



    if (!filteredNotices.length) {

        container.innerHTML = `

            <div class="notice-box">

                <h4>
                    No New Notices
                </h4>

                <p>
                    There are currently
                    no announcements for you.
                </p>

            </div>

        `;

        return;
    }



    container.innerHTML =
        filteredNotices
            .map(notice => {

                const date =
                    new Date(
                        notice.created_at
                    )
                    .toLocaleDateString(
                        "en-IN"
                    );


                return `

                    <div
                        class="notice-box"
                        style="margin-bottom:12px;"
                    >

                        <h4>
                            ${escapeHTML(
                                notice.title
                            )}
                        </h4>

                        <p>
                            ${escapeHTML(
                                notice.message
                            )}
                        </p>

                        <small>
                            ${date}
                        </small>

                    </div>

                `;

            })
            .join("");

}



// =================================
// ESCAPE HTML
// =================================

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value ?? "";

    return div.innerHTML;
}
// =================================
// LOAD STUDENT ATTENDANCE
// =================================

async function loadStudentAttendance() {

    const {
        data: attendance,
        error
    } = await supabase
        .from("attendance")
        .select(`
            id,
            attendance_date,
            status
        `)
        .eq(
            "student_id",
            user.id
        )
        .order(
            "attendance_date",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Attendance loading error:",
            error
        );

        return;
    }


    const records =
        attendance || [];


    // =================================
    // CALCULATE STATS
    // =================================

    const total =
        records.length;


    const present =
        records.filter(
            record =>
                record.status === "present"
        ).length;


    const absent =
        records.filter(
            record =>
                record.status === "absent"
        ).length;


    const percentage =
        total > 0
            ? Math.round(
                (present / total) * 100
            )
            : 0;



    // =================================
    // UPDATE STATS
    // =================================

    setText(
        "totalClasses",
        total
    );


    setText(
        "studentPresent",
        present
    );


    setText(
        "studentAbsent",
        absent
    );


    setText(
        "attendancePercentage",
        percentage + "%"
    );



    // =================================
    // ATTENDANCE MESSAGE
    // =================================

    const message =
        document.getElementById(
            "attendanceMessage"
        );


    if (message) {

        if (total === 0) {

            message.textContent =
                "No attendance records yet.";

        } else if (percentage >= 75) {

            message.textContent =
                "Your attendance is good.";

        } else {

            message.textContent =
                "Your attendance is below 75%.";

        }

    }



    // =================================
    // HISTORY
    // =================================

    const history =
        document.getElementById(
            "attendanceHistory"
        );


    if (!history) {
        return;
    }


    if (!records.length) {

        history.innerHTML = `

            <tr>

                <td
                    colspan="2"
                    style="
                        padding:15px;
                        color:#6b7280;
                    "
                >
                    No attendance records found.
                </td>

            </tr>

        `;

        return;
    }



    history.innerHTML =
        records
            .map(record => {

                const date =
                    new Date(
                        record.attendance_date +
                        "T00:00:00"
                    )
                    .toLocaleDateString(
                        "en-IN",
                        {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                        }
                    );


                const status =
                    record.status ===
                    "present";


                return `

                    <tr>

                        <td
                            style="
                                padding:12px;
                                border-bottom:1px solid #eee;
                            "
                        >
                            ${date}
                        </td>


                        <td
                            style="
                                padding:12px;
                                border-bottom:1px solid #eee;
                                font-weight:600;
                            "
                        >

                            ${
                                status
                                    ? `
                                        <span
                                            class="present-text"
                                        >
                                            ✓ Present
                                        </span>
                                    `
                                    : `
                                        <span
                                            class="absent-text"
                                        >
                                            ✕ Absent
                                        </span>
                                    `
                            }

                        </td>

                    </tr>

                `;

            })
            .join("");

}


// =================================
// LOAD ATTENDANCE
// =================================

await loadStudentAttendance();


await loadStudentNotices();


    // -----------------------------
    // Logout
    // -----------------------------

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );


    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            async () => {

                const {
                    error
                } =
                    await supabase.auth.signOut();


                if (error) {

                    console.error(
                        "Logout error:",
                        error
                    );

                    alert(
                        "Logout failed."
                    );

                    return;
                }


                window.location.href =
                    "../login.html";

            }
        );

    }


});
// =================================
// LOAD STUDENT FEES
// =================================

async function loadStudentFees() {

    const {
        data: fees,
        error
    } = await supabase

        .from("fees")

        .select(`
            id,
            fee_type,
            amount,
            paid_amount,
            due_date,
            status,
            note,
            created_at
        `)

        .eq(
            "student_id",
            user.id
        )

        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Fees loading error:",
            error
        );

        return;

    }


    const records =
        fees || [];


    // =================================
    // CALCULATE TOTALS
    // =================================

    let total =
        0;

    let paid =
        0;


    records.forEach(fee => {

        total +=
            Number(
                fee.amount || 0
            );

        paid +=
            Number(
                fee.paid_amount || 0
            );

    });


    const due =
        Math.max(
            total - paid,
            0
        );


    // =================================
    // UPDATE SUMMARY
    // =================================

    setText(
        "myTotalFee",
        formatCurrency(total)
    );


    setText(
        "myPaidFee",
        formatCurrency(paid)
    );


    setText(
        "myDueFee",
        formatCurrency(due)
    );


    let overallStatus =
        "—";


    if (records.length) {

        if (due <= 0) {

            overallStatus =
                "Paid";

        } else {

            const hasOverdue =
                records.some(
                    fee =>
                        fee.status ===
                        "overdue"
                );


            const hasPartial =
                records.some(
                    fee =>
                        fee.status ===
                        "partial"
                );


            if (hasOverdue) {

                overallStatus =
                    "Overdue";

            } else if (hasPartial) {

                overallStatus =
                    "Partial";

            } else {

                overallStatus =
                    "Pending";

            }

        }

    }


    setText(
        "myFeeStatus",
        overallStatus
    );


    // =================================
    // HISTORY
    // =================================

    const history =
        document.getElementById(
            "feesHistory"
        );


    if (!history) {

        return;

    }


    if (!records.length) {

        history.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="
                        padding:20px;
                        color:#6b7280;
                        text-align:center;
                    "
                >
                    No fee records found.

                </td>

            </tr>

        `;

        return;

    }


    history.innerHTML =
        records
            .map(fee => {

                const amount =
                    Number(
                        fee.amount || 0
                    );


                const paidAmount =
                    Number(
                        fee.paid_amount || 0
                    );


                const dueAmount =
                    Math.max(
                        amount -
                        paidAmount,
                        0
                    );


                return `

                    <tr>

                        <td
                            style="
                                padding:12px;
                                border-bottom:1px solid #eee;
                                font-weight:600;
                            "
                        >
                            ${escapeHTML(
                                fee.fee_type
                            )}
                        </td>


                        <td
                            style="
                                padding:12px;
                                border-bottom:1px solid #eee;
                            "
                        >
                            ${formatCurrency(
                                amount
                            )}
                        </td>


                        <td
                            style="
                                padding:12px;
                                border-bottom:1px solid #eee;
                                color:#16a34a;
                                font-weight:600;
                            "
                        >
                            ${formatCurrency(
                                paidAmount
                            )}
                        </td>


                        <td
                            style="
                                padding:12px;
                                border-bottom:1px solid #eee;
                                color:#dc2626;
                                font-weight:600;
                            "
                        >
                            ${formatCurrency(
                                dueAmount
                            )}
                        </td>


                        <td
                            style="
                                padding:12px;
                                border-bottom:1px solid #eee;
                            "
                        >

                            <span
                                class="badge"
                                style="
                                    background:#f1f5f9;
                                    padding:5px 9px;
                                    border-radius:20px;
                                    font-size:12px;
                                    text-transform:capitalize;
                                "
                            >
                                ${escapeHTML(
                                    fee.status ||
                                    "pending"
                                )}
                            </span>

                        </td>


                        <td
                            style="
                                padding:12px;
                                border-bottom:1px solid #eee;
                            "
                        >
                            ${
                                fee.due_date
                                    ? new Date(
                                        fee.due_date +
                                        "T00:00:00"
                                      ).toLocaleDateString(
                                        "en-IN",
                                        {
                                            day:"2-digit",
                                            month:"short",
                                            year:"numeric"
                                        }
                                      )
                                    : "—"
                            }
                        </td>

                    </tr>

                `;

            })
            .join("");

}


// =================================
// CURRENCY FORMAT
// =================================

function formatCurrency(amount) {

    return "₹" +
        Number(
            amount || 0
        ).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        );

}

// ========================================
// STUDY MATERIALS
// ========================================

async function loadStudentMaterials() {

    const container =
        document.getElementById("materialsContainer");

    if (!container) return;


    container.innerHTML = `
        <div class="notice-box">
            <p>Loading study materials...</p>
        </div>
    `;


    const { data: materials, error } = await supabase
        .from("study_materials")
        .select(`
            id,
            title,
            subject,
            class_name,
            description,
            file_url,
            file_type,
            status,
            created_at
        `)
        .eq("status", "active")
        .order("created_at", {
            ascending: false
        })
        .limit(50);


    if (error) {

        console.error("Study materials error:", error);

        container.innerHTML = `
            <div class="notice-box">
                <p>
                    Unable to load study materials.
                </p>
            </div>
        `;

        return;
    }


    /*
       Student की class के हिसाब से materials filter होंगे.

       Example:

       Student class = 12th PCM

       दिखेगा:
       - 12th PCM
       - All
       - खाली class_name वाले materials
    */

    const studentClass =
        String(profile.class_name || "")
            .trim()
            .toLowerCase();


    const filteredMaterials =
        (materials || []).filter(material => {

            const materialClass =
                String(material.class_name || "")
                    .trim()
                    .toLowerCase();


            // सभी students के लिए
            if (!materialClass) {
                return true;
            }


            // Exact class match
            return materialClass === studentClass;

        });


    if (filteredMaterials.length === 0) {

        container.innerHTML = `
            <div class="notice-box">
                <p>
                    📚 अभी आपकी class के लिए कोई study material available नहीं है।
                </p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        filteredMaterials.map(material => {

            let typeIcon = "📄";


            if (material.file_type === "pdf") {
                typeIcon = "📕";
            }

            else if (material.file_type === "document") {
                typeIcon = "📝";
            }

            else if (material.file_type === "image") {
                typeIcon = "🖼️";
            }

            else if (material.file_type === "link") {
                typeIcon = "🔗";
            }


            return `
                <div class="material-card">

                    <h4>
                        ${typeIcon}
                        ${escapeHTML(material.title)}
                    </h4>


                    <div class="material-meta">

                        ${
                            material.subject
                                ? `
                                    <span class="material-tag">
                                        📘 ${escapeHTML(material.subject)}
                                    </span>
                                  `
                                : ""
                        }


                        ${
                            material.class_name
                                ? `
                                    <span class="material-tag">
                                        🎓 ${escapeHTML(material.class_name)}
                                    </span>
                                  `
                                :
                                `
                                    <span class="material-tag">
                                        👥 All Students
                                    </span>
                                `
                        }


                        <span class="material-tag">
                            ${escapeHTML(
                                String(material.file_type || "file")
                                    .toUpperCase()
                            )}
                        </span>

                    </div>


                    ${
                        material.description
                            ? `
                                <p class="material-description">
                                    ${escapeHTML(material.description)}
                                </p>
                              `
                            : ""
                    }


                    <a
                        href="${escapeHTML(material.file_url)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="material-open"
                    >
                        📖 Open Material
                    </a>

                </div>
            `;

        }).join("");
}
await loadStudentAttendance();
await loadStudentFees();
await loadStudentMaterials();
await loadStudentNotices();