/* =========================================================
   FUTURE PLUS STUDY CLASSES
   STUDENT DASHBOARD
   ========================================================= */

"use strict";


/* =========================================================
   GLOBALS
   ========================================================= */

let db = null;
let currentUser = null;
let currentProfile = null;


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    try {

        db = window.supabaseClient;

        if (!db) {
            showGlobalError(
                "Supabase client नहीं मिला। supabase.js check करें।"
            );
            return;
        }

        await initializeStudentDashboard();

    } catch (error) {

        console.error(
            "Student dashboard initialization error:",
            error
        );

        showGlobalError(
            "Dashboard load नहीं हो पाया। कृपया page refresh करें।"
        );

    }

});


/* =========================================================
   MAIN INITIALIZATION
   ========================================================= */

async function initializeStudentDashboard() {

    const {
        data,
        error
    } = await db.auth.getUser();

    if (error) {

        console.error("Auth error:", error);

        window.location.href = "../login.html";

        return;
    }


    currentUser = data?.user;


    if (!currentUser) {

        window.location.href = "../login.html";

        return;
    }


    await loadDashboard();

}


/* =========================================================
   LOAD EVERYTHING
   ========================================================= */

async function loadDashboard() {

    try {

        showPageLoading();

        await loadStudentProfile();

        await Promise.all([
            loadAssignments(),
            loadAttendance(),
            loadFees(),
            loadStudentMaterials(),
            loadNotices()
        ]);

        hidePageLoading();

    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

        hidePageLoading();

    }

}


/* =========================================================
   STUDENT PROFILE
   ========================================================= */

async function loadStudentProfile() {

    const {
        data: profile,
        error
    } = await db
        .from("profiles")
        .select(`
            id,
            full_name,
            phone,
            email,
            class_name,
            role,
            status,
            created_at
        `)
        .eq("id", currentUser.id)
        .maybeSingle();


    if (error) {

        console.error(
            "Profile error:",
            error
        );

        return;
    }


    currentProfile = profile;


    if (!profile) {

        console.warn(
            "Student profile not found."
        );

        return;
    }


    const name =
        profile.full_name ||
        currentUser.email?.split("@")[0] ||
        "Student";


    const studentClass =
        profile.class_name ||
        "Class not assigned";


    const email =
        profile.email ||
        currentUser.email ||
        "—";


    setText(
        "studentName",
        name
    );

    setText(
        "studentTopName",
        name
    );

    setText(
        "studentClass",
        `Class: ${studentClass}`
    );

    setText(
        "studentEmail",
        email
    );


    const avatar =
        name
            .trim()
            .charAt(0)
            .toUpperCase() || "S";


    setText(
        "studentAvatar",
        avatar
    );


    setText(
        "accountStatus",
        formatStatus(profile.status)
    );

}


/* =========================================================
   ASSIGNMENTS
   ========================================================= */

async function loadAssignments() {

    const container =
        document.getElementById(
            "assignmentsContainer"
        );


    if (!container) return;


    container.innerHTML = loadingHTML();


    try {

        const {
            data: assignments,
            error
        } = await db
            .from("assignments")
            .select(`
                id,
                student_id,
                course_id,
                batch_id,
                title,
                description,
                due_date,
                status,
                created_at
            `)
            .eq(
                "student_id",
                currentUser.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            console.error(
                "Assignments error:",
                error
            );

            container.innerHTML =
                errorHTML(
                    "Assignments load नहीं हो सके।"
                );

            return;
        }


        const list =
            assignments || [];


        setText(
            "assignmentCount",
            list.length
        );

        setText(
            "assignmentBadge",
            list.length
        );


        if (!list.length) {

            container.innerHTML =
                emptyHTML(
                    "📝",
                    "अभी कोई assignment नहीं है।",
                    "Admin ने अभी आपके लिए कोई assignment add नहीं किया है।"
                );

            return;
        }


        container.innerHTML =
            `<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                ${list
                    .map(
                        assignmentCard
                    )
                    .join("")}
            </div>`;

    } catch (error) {

        console.error(
            "Assignments exception:",
            error
        );

        container.innerHTML =
            errorHTML(
                "Assignments load करने में error आया।"
            );
    }

}


/* =========================================================
   ASSIGNMENT CARD
   ========================================================= */

function assignmentCard(item) {

    const title =
        escapeHTML(
            item.title ||
            "Untitled Assignment"
        );


    const description =
        escapeHTML(
            item.description ||
            "No description available."
        );


    const status =
        normalizeStatus(
            item.status ||
            "assigned"
        );


    const dueDate =
        item.due_date
            ? formatDate(item.due_date)
            : "No due date";


    const statusUI =
        assignmentStatusUI(
            status
        );


    return `
        <article
            class="assignment-card border border-slate-200 rounded-2xl p-5 bg-white"
        >

            <div class="flex items-start justify-between gap-4">

                <div class="min-w-0">

                    <h4 class="font-bold text-slate-900 text-base">
                        ${title}
                    </h4>

                    <p class="text-sm text-slate-500 mt-2 leading-6">
                        ${description}
                    </p>

                </div>

                ${statusUI}

            </div>


            <div
                class="mt-5 flex flex-wrap items-center justify-between gap-3"
            >

                <div class="text-sm">

                    <span class="text-slate-400">
                        Due:
                    </span>

                    <span class="font-semibold text-slate-700">
                        ${dueDate}
                    </span>

                </div>

            </div>

        </article>
    `;
}


/* =========================================================
   ATTENDANCE
   ========================================================= */

async function loadAttendance() {

    const container =
        document.getElementById(
            "attendanceContainer"
        );


    if (!container) return;


    container.innerHTML = loadingHTML();


    try {

        const {
            data: attendance,
            error
        } = await db
            .from("attendance")
            .select(`
                id,
                student_id,
                attendance_date,
                status,
                created_at
            `)
            .eq(
                "student_id",
                currentUser.id
            )
            .order(
                "attendance_date",
                {
                    ascending: false
                }
            );


        if (error) {

            console.error(
                "Attendance error:",
                error
            );

            container.innerHTML =
                errorHTML(
                    "Attendance load नहीं हो सकी।"
                );

            return;
        }


        const list =
            attendance || [];


        const total =
            list.length;


        const present =
            list.filter(
                item =>
                    String(
                        item.status
                    ).toLowerCase() ===
                    "present"
            ).length;


        const absent =
            list.filter(
                item =>
                    String(
                        item.status
                    ).toLowerCase() ===
                    "absent"
            ).length;


        const percentage =
            total > 0
                ? Math.round(
                    (present / total) *
                    100
                )
                : 0;


        setText(
            "attendancePercentage",
            `${percentage}%`
        );

        setText(
            "attendanceBigPercentage",
            `${percentage}%`
        );

        setText(
            "attendanceSummary",
            `${present} present / ${total} total`
        );


        const progress =
            document.getElementById(
                "attendanceProgress"
            );


        if (progress) {

            progress.style.width =
                `${percentage}%`;

        }


        if (!list.length) {

            container.innerHTML =
                emptyHTML(
                    "📅",
                    "Attendance अभी available नहीं है।",
                    "Admin ने अभी आपकी attendance mark नहीं की है।"
                );

            return;
        }


        container.innerHTML = `

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">

                <div class="rounded-xl bg-slate-50 p-4">
                    <p class="text-xs text-slate-500">
                        Total
                    </p>

                    <p class="text-xl font-bold mt-1">
                        ${total}
                    </p>
                </div>


                <div class="rounded-xl bg-green-50 p-4">
                    <p class="text-xs text-green-600">
                        Present
                    </p>

                    <p class="text-xl font-bold text-green-700 mt-1">
                        ${present}
                    </p>
                </div>


                <div class="rounded-xl bg-red-50 p-4">
                    <p class="text-xs text-red-600">
                        Absent
                    </p>

                    <p class="text-xl font-bold text-red-700 mt-1">
                        ${absent}
                    </p>
                </div>

            </div>


            <div class="table-wrap">

                <table>

                    <thead>

                        <tr>

                            <th>
                                Date
                            </th>

                            <th>
                                Status
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        ${list
                            .map(
                                attendanceRow
                            )
                            .join("")}

                    </tbody>

                </table>

            </div>
        `;

    } catch (error) {

        console.error(
            "Attendance exception:",
            error
        );

        container.innerHTML =
            errorHTML(
                "Attendance load करने में error आया।"
            );
    }

}


/* =========================================================
   ATTENDANCE ROW
   ========================================================= */

function attendanceRow(item) {

    const status =
        String(
            item.status || ""
        ).toLowerCase();


    const isPresent =
        status === "present";


    return `
        <tr>

            <td>
                ${formatDate(
                    item.attendance_date
                )}
            </td>

            <td>

                <span
                    class="
                        inline-flex
                        items-center
                        px-3
                        py-1
                        rounded-full
                        text-xs
                        font-bold
                        ${
                            isPresent
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                        }
                    "
                >
                    ${
                        isPresent
                            ? "✓ Present"
                            : "✕ Absent"
                    }
                </span>

            </td>

        </tr>
    `;
}


/* =========================================================
   FEES
   ========================================================= */

async function loadFees() {

    const container =
        document.getElementById(
            "feesContainer"
        );


    if (!container) return;


    container.innerHTML = loadingHTML();


    try {

        /*
         * IMPORTANT:
         * This uses the existing fees table.
         * If your existing fees columns are different,
         * the error will be shown in console instead of
         * breaking the whole dashboard.
         */

        const {
            data: fees,
            error
        } = await db
            .from("fees")
            .select("*")
            .eq(
                "student_id",
                currentUser.id
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            console.error(
                "Fees error:",
                error
            );

            container.innerHTML =
                errorHTML(
                    "Fees load नहीं हो सकी।"
                );

            return;
        }


        const list =
            fees || [];


        let total =
            0;

        let paid =
            0;

        let due =
            0;


        list.forEach(
            fee => {

                total +=
                    toNumber(
                        fee.total_amount ??
                        fee.amount ??
                        fee.total_fee
                    );


                paid +=
                    toNumber(
                        fee.paid_amount ??
                        fee.paid ??
                        fee.amount_paid
                    );


                due +=
                    toNumber(
                        fee.due_amount ??
                        fee.due ??
                        fee.amount_due
                    );

            }
        );


        /*
         * If due amount is not directly stored,
         * calculate it.
         */

        if (
            due === 0 &&
            total > paid
        ) {

            due =
                total - paid;

        }


        setText(
            "totalFees",
            formatCurrency(total)
        );

        setText(
            "paidFees",
            formatCurrency(paid)
        );

        setText(
            "dueFees",
            formatCurrency(due)
        );

        setText(
            "feeDue",
            formatCurrency(due)
        );


        if (!list.length) {

            container.innerHTML =
                emptyHTML(
                    "💰",
                    "Fee record अभी available नहीं है।",
                    "Admin ने अभी आपकी fee entry add नहीं की है।"
                );

            return;
        }


        container.innerHTML = `

            <div class="table-wrap">

                <table>

                    <thead>

                        <tr>

                            <th>
                                Fee
                            </th>

                            <th>
                                Total
                            </th>

                            <th>
                                Paid
                            </th>

                            <th>
                                Due
                            </th>

                            <th>
                                Status
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        ${list
                            .map(
                                feeRow
                            )
                            .join("")}

                    </tbody>

                </table>

            </div>
        `;

    } catch (error) {

        console.error(
            "Fees exception:",
            error
        );

        container.innerHTML =
            errorHTML(
                "Fees load करने में error आया।"
            );
    }

}


/* =========================================================
   FEE ROW
   ========================================================= */

function feeRow(fee) {

    const total =
        toNumber(
            fee.total_amount ??
            fee.amount ??
            fee.total_fee
        );


    const paid =
        toNumber(
            fee.paid_amount ??
            fee.paid ??
            fee.amount_paid
        );


    let due =
        toNumber(
            fee.due_amount ??
            fee.due ??
            fee.amount_due
        );


    if (
        due === 0 &&
        total > paid
    ) {

        due =
            total - paid;

    }


    const status =
        String(
            fee.status ||
            (due > 0
                ? "due"
                : "paid")
        ).toLowerCase();


    const statusClass =
        status === "paid"
            ? "bg-green-100 text-green-700"
            : "bg-orange-100 text-orange-700";


    return `
        <tr>

            <td class="font-semibold">
                ${escapeHTML(
                    fee.fee_type ||
                    fee.type ||
                    fee.name ||
                    "Fee"
                )}
            </td>

            <td>
                ${formatCurrency(total)}
            </td>

            <td class="text-green-700 font-semibold">
                ${formatCurrency(paid)}
            </td>

            <td class="text-orange-700 font-semibold">
                ${formatCurrency(due)}
            </td>

            <td>

                <span
                    class="inline-flex px-3 py-1 rounded-full text-xs font-bold ${statusClass}"
                >
                    ${capitalize(status)}
                </span>

            </td>

        </tr>
    `;
}


/* =========================================================
   STUDY MATERIALS
   ========================================================= */

async function loadStudentMaterials() {

    const container =
        document.getElementById(
            "materialsContainer"
        );


    if (!container) return;


    container.innerHTML =
        loadingHTML();


    try {

        const {
            data: materials,
            error
        } = await db
            .from("study_materials")
            .select(`
                id,
                title,
                description,
                subject,
                class_name,
                file_type,
                file_url,
                status,
                created_at
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            console.error(
                "Study materials error:",
                error
            );

            container.innerHTML =
                errorHTML(
                    "Study Material load नहीं हो पाया।"
                );

            return;
        }


        const activeMaterials =
            (materials || []).filter(
                material =>
                    String(
                        material.status ||
                        ""
                    )
                    .trim()
                    .toLowerCase() ===
                    "active"
            );


        /*
         * Class filtering
         *
         * IMPORTANT:
         * We only hide material if class is clearly
         * different. "12", "12th", "Class 12",
         * "12th PCM" etc. will match.
         */

        const studentClass =
            currentProfile?.class_name ||
            "";


        const filteredMaterials =
            activeMaterials.filter(
                material =>
                    classMatches(
                        material.class_name,
                        studentClass
                    )
            );


        /*
         * If no class information is available,
         * show active materials instead of hiding
         * everything.
         */

        const finalMaterials =
            studentClass.trim()
                ? filteredMaterials
                : activeMaterials;


        setText(
            "materialCount",
            finalMaterials.length
        );

        setText(
            "materialBadge",
            finalMaterials.length
        );


        if (!finalMaterials.length) {

            container.innerHTML =
                emptyHTML(
                    "📚",
                    "अभी Study Material available नहीं है।",
                    "आपकी class के लिए admin ने अभी material add नहीं किया है।"
                );

            return;
        }


        container.innerHTML = `

            <div
                class="
                    grid
                    grid-cols-1
                    sm:grid-cols-2
                    xl:grid-cols-3
                    gap-4
                "
            >

                ${finalMaterials
                    .map(
                        materialCard
                    )
                    .join("")}

            </div>
        `;

    } catch (error) {

        console.error(
            "Study material exception:",
            error
        );

        container.innerHTML =
            errorHTML(
                "Study Material load करने में error आया।"
            );
    }

}


/* =========================================================
   MATERIAL CARD
   ========================================================= */

function materialCard(material) {

    const title =
        escapeHTML(
            material.title ||
            "Study Material"
        );


    const subject =
        escapeHTML(
            material.subject ||
            "Study Material"
        );


    const description =
        escapeHTML(
            material.description ||
            "Learning material"
        );


    const type =
        String(
            material.file_type ||
            "link"
        )
        .trim()
        .toLowerCase();


    const url =
        safeURL(
            material.file_url
        );


    const icon =
        materialIcon(type);


    const button =
        url
            ? `
                <a
                    href="${url}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        w-full
                        px-4
                        py-3
                        rounded-xl
                        bg-blue-600
                        hover:bg-blue-700
                        text-white
                        text-sm
                        font-semibold
                        transition
                    "
                >
                    🔗 Open Material
                </a>
            `
            : `
                <button
                    disabled
                    class="
                        w-full
                        px-4
                        py-3
                        rounded-xl
                        bg-slate-100
                        text-slate-400
                        text-sm
                        font-semibold
                        cursor-not-allowed
                    "
                >
                    Link Not Available
                </button>
            `;


    return `
        <article
            class="
                material-card
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-5
                flex
                flex-col
            "
        >

            <div class="flex items-start gap-4">

                <div
                    class="
                        w-12
                        h-12
                        rounded-xl
                        bg-purple-100
                        flex
                        items-center
                        justify-center
                        text-2xl
                        flex-shrink-0
                    "
                >
                    ${icon}
                </div>


                <div class="min-w-0">

                    <h4
                        class="font-bold text-slate-900 leading-5"
                    >
                        ${title}
                    </h4>

                    <p
                        class="
                            text-xs
                            text-purple-600
                            font-semibold
                            mt-1
                        "
                    >
                        ${subject}
                    </p>

                </div>

            </div>


            <p
                class="
                    text-sm
                    text-slate-500
                    leading-6
                    mt-4
                    flex-1
                "
            >
                ${description}
            </p>


            <div
                class="
                    flex
                    items-center
                    justify-between
                    mt-4
                    mb-4
                "
            >

                <span
                    class="
                        px-2.5
                        py-1
                        rounded-full
                        bg-slate-100
                        text-slate-600
                        text-xs
                        font-bold
                    "
                >
                    ${type.toUpperCase()}
                </span>


                <span
                    class="text-xs text-slate-400"
                >
                    ${formatDate(
                        material.created_at
                    )}
                </span>

            </div>


            ${button}

        </article>
    `;
}


/* =========================================================
   NOTICES
   ========================================================= */

async function loadNotices() {

    const container =
        document.getElementById(
            "noticesContainer"
        );


    if (!container) return;


    container.innerHTML =
        loadingHTML();


    try {

        const {
            data: notices,
            error
        } = await db
            .from("notices")
            .select(`
                id,
                title,
                message,
                audience,
                class_name,
                status,
                created_at
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            console.error(
                "Notices error:",
                error
            );

            container.innerHTML =
                errorHTML(
                    "Notices load नहीं हो सके।"
                );

            return;
        }


        const studentClass =
            currentProfile?.class_name ||
            "";


        const list =
            (notices || []).filter(
                notice => {

                    const status =
                        String(
                            notice.status ||
                            ""
                        )
                        .trim()
                        .toLowerCase();


                    if (
                        status &&
                        status !== "active"
                    ) {
                        return false;
                    }


                    const audience =
                        String(
                            notice.audience ||
                            "all"
                        )
                        .trim()
                        .toLowerCase();


                    if (
                        audience === "all" ||
                        audience === "all students" ||
                        audience === "students"
                    ) {
                        return true;
                    }


                    if (
                        audience === "class"
                    ) {

                        return classMatches(
                            notice.class_name,
                            studentClass
                        );

                    }


                    return classMatches(
                        notice.class_name,
                        studentClass
                    );

                }
            );


        if (!list.length) {

            container.innerHTML =
                emptyHTML(
                    "📢",
                    "अभी कोई notice नहीं है।",
                    "Institute ने अभी कोई notice publish नहीं किया है।"
                );

            return;
        }


        container.innerHTML = `

            <div class="space-y-4">

                ${list
                    .map(
                        noticeCard
                    )
                    .join("")}

            </div>
        `;

    } catch (error) {

        console.error(
            "Notices exception:",
            error
        );

        container.innerHTML =
            errorHTML(
                "Notices load करने में error आया।"
            );
    }

}


/* =========================================================
   NOTICE CARD
   ========================================================= */

function noticeCard(notice) {

    const title =
        escapeHTML(
            notice.title ||
            "Notice"
        );


    const message =
        escapeHTML(
            notice.message ||
            ""
        );


    const audience =
        escapeHTML(
            notice.audience ||
            "All Students"
        );


    return `
        <article
            class="
                notice-card
                rounded-2xl
                border
                border-blue-100
                bg-blue-50/50
                p-5
            "
        >

            <div
                class="
                    flex
                    flex-col
                    sm:flex-row
                    sm:items-start
                    sm:justify-between
                    gap-3
                "
            >

                <div>

                    <div class="flex items-center gap-2">

                        <span class="text-xl">
                            📢
                        </span>

                        <h4
                            class="
                                font-bold
                                text-slate-900
                            "
                        >
                            ${title}
                        </h4>

                    </div>

                    <p
                        class="
                            text-sm
                            text-slate-600
                            mt-3
                            leading-7
                        "
                    >
                        ${message}
                    </p>

                </div>


                <div
                    class="
                        flex
                        flex-col
                        sm:items-end
                        gap-1
                        text-xs
                    "
                >

                    <span
                        class="
                            px-2.5
                            py-1
                            rounded-full
                            bg-blue-100
                            text-blue-700
                            font-bold
                        "
                    >
                        ${audience}
                    </span>

                    <span class="text-slate-400">
                        ${formatDate(
                            notice.created_at
                        )}
                    </span>

                </div>

            </div>

        </article>
    `;
}


/* =========================================================
   CLASS MATCHING
   ========================================================= */

function classMatches(
    materialClass,
    studentClass
) {

    const material =
        normalizeClass(
            materialClass
        );


    const student =
        normalizeClass(
            studentClass
        );


    /*
     * Blank / All means visible to everyone.
     */

    if (
        !material ||
        material === "all"
    ) {
        return true;
    }


    if (
        !student
    ) {
        return true;
    }


    /*
     * Exact normalized match.
     */

    if (
        material === student
    ) {
        return true;
    }


    /*
     * Class 11 / 11th / Class 11
     * Class 12 / 12th / Class 12
     */

    if (
        material === "11" &&
        student === "11"
    ) {
        return true;
    }


    if (
        material === "12" &&
        student === "12"
    ) {
        return true;
    }


    /*
     * Handles values like:
     *
     * 12th PCM
     * Class 12 PCM
     * 12 Science
     */

    if (
        material.includes("11") &&
        student.includes("11")
    ) {
        return true;
    }


    if (
        material.includes("12") &&
        student.includes("12")
    ) {
        return true;
    }


    return false;
}


function normalizeClass(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    let text =
        String(value)
            .trim()
            .toLowerCase();


    if (
        !text
    ) {
        return "";
    }


    if (
        text.includes("all")
    ) {
        return "all";
    }


    /*
     * Find 11 or 12 anywhere in the text.
     */

    const match =
        text.match(
            /\b(11|12)(?:th|st|nd|rd)?\b/
        );


    if (
        match
    ) {
        return match[1];
    }


    text =
        text
            .replace(
                /class|standard|std/gi,
                ""
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();


    return text;
}


/* =========================================================
   UI HELPERS
   ========================================================= */

function loadingHTML() {

    return `
        <div class="flex flex-col items-center justify-center py-10">

            <div class="loader"></div>

            <p class="text-sm text-slate-400 mt-3">
                Loading...
            </p>

        </div>
    `;
}


function emptyHTML(
    icon,
    title,
    description
) {

    return `
        <div class="empty-state">

            <div class="empty-icon">
                ${icon}
            </div>

            <h4
                class="font-bold text-slate-700"
            >
                ${escapeHTML(title)}
            </h4>

            <p
                class="
                    text-sm
                    text-slate-400
                    mt-2
                    max-w-md
                    mx-auto
                    leading-6
                "
            >
                ${escapeHTML(description)}
            </p>

        </div>
    `;
}


function errorHTML(message) {

    return `
        <div
            class="
                rounded-2xl
                bg-red-50
                border
                border-red-100
                p-5
                text-center
            "
        >

            <div class="text-2xl">
                ⚠️
            </div>

            <p
                class="
                    text-sm
                    text-red-700
                    font-semibold
                    mt-2
                "
            >
                ${escapeHTML(message)}
            </p>

            <button
                onclick="loadDashboard()"
                class="
                    mt-4
                    px-4
                    py-2
                    rounded-xl
                    bg-red-600
                    hover:bg-red-700
                    text-white
                    text-sm
                    font-semibold
                "
            >
                Try Again
            </button>

        </div>
    `;
}


/* =========================================================
   GLOBAL ERROR
   ========================================================= */

function showGlobalError(message) {

    console.error(message);

    const body =
        document.body;


    if (!body) return;


    const div =
        document.createElement(
            "div"
        );


    div.className =
        "fixed inset-0 z-[9999] bg-slate-950/70 flex items-center justify-center p-5";


    div.innerHTML = `

        <div
            class="
                bg-white
                rounded-2xl
                p-6
                max-w-md
                w-full
                text-center
            "
        >

            <div class="text-4xl">
                ⚠️
            </div>

            <h2
                class="
                    font-bold
                    text-lg
                    mt-3
                "
            >
                Dashboard Error
            </h2>

            <p
                class="
                    text-sm
                    text-slate-500
                    mt-2
                "
            >
                ${escapeHTML(message)}
            </p>

            <button
                onclick="location.reload()"
                class="
                    mt-5
                    px-5
                    py-3
                    bg-blue-600
                    hover:bg-blue-700
                    text-white
                    rounded-xl
                    font-semibold
                "
            >
                Refresh Page
            </button>

        </div>

    `;


    body.appendChild(div);
}


/* =========================================================
   LOADING STATE
   ========================================================= */

function showPageLoading() {

    /*
     * Individual sections already have loaders.
     * So we intentionally don't block the entire page.
     */

}


function hidePageLoading() {

}


/* =========================================================
   STATUS HELPERS
   ========================================================= */

function assignmentStatusUI(
    status
) {

    const normalized =
        normalizeStatus(
            status
        );


    let classes =
        "bg-blue-100 text-blue-700";


    let label =
        "Assigned";


    if (
        normalized === "completed" ||
        normalized === "complete" ||
        normalized === "submitted"
    ) {

        classes =
            "bg-green-100 text-green-700";

        label =
            "Completed";

    } else if (
        normalized === "pending"
    ) {

        classes =
            "bg-orange-100 text-orange-700";

        label =
            "Pending";

    } else if (
        normalized === "overdue"
    ) {

        classes =
            "bg-red-100 text-red-700";

        label =
            "Overdue";

    }


    return `
        <span
            class="
                inline-flex
                px-3
                py-1
                rounded-full
                text-xs
                font-bold
                ${classes}
            "
        >
            ${label}
        </span>
    `;
}


function normalizeStatus(value) {

    return String(
        value || ""
    )
        .trim()
        .toLowerCase()
        .replace(
            /\s+/g,
            "_"
        );
}


function formatStatus(value) {

    if (!value) {
        return "Pending";
    }

    return capitalize(
        String(value)
    );
}


/* =========================================================
   MATERIAL ICON
   ========================================================= */

function materialIcon(type) {

    const map = {

        pdf: "📕",
        doc: "📘",
        docx: "📘",
        ppt: "📙",
        pptx: "📙",
        xls: "📗",
        xlsx: "📗",
        txt: "📄",
        image: "🖼️",
        jpg: "🖼️",
        jpeg: "🖼️",
        png: "🖼️",
        webp: "🖼️",
        video: "🎥",
        mp4: "🎥",
        link: "🔗"

    };


    return map[type] || "📄";
}


/* =========================================================
   DATE
   ========================================================= */

function formatDate(value) {

    if (!value) {
        return "—";
    }


    try {

        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return String(value);
        }


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    } catch {

        return String(value);

    }

}


/* =========================================================
   CURRENCY
   ========================================================= */

function formatCurrency(value) {

    const number =
        Number(value) || 0;


    return (
        "₹" +
        number.toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 2
            }
        )
    );
}


/* =========================================================
   NUMBER
   ========================================================= */

function toNumber(value) {

    const number =
        Number(value);


    if (
        Number.isFinite(number)
    ) {
        return number;
    }


    return 0;
}


/* =========================================================
   SAFE URL
   ========================================================= */

function safeURL(value) {

    if (!value) {
        return "";
    }


    try {

        const url =
            new URL(
                String(value),
                window.location.href
            );


        if (
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ) {
            return "";
        }


        return escapeAttribute(
            url.href
        );

    } catch {

        return "";

    }

}


/* =========================================================
   HTML ESCAPING
   ========================================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


function escapeAttribute(value) {

    return escapeHTML(
        value
    );
}


/* =========================================================
   TEXT SETTER
   ========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (
        element
    ) {

        element.textContent =
            value ?? "";

    }

}


/* =========================================================
   CAPITALIZE
   ========================================================= */

function capitalize(value) {

    const text =
        String(value || "");


    if (!text) {
        return "";
    }


    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutStudent() {

    try {

        const {
            error
        } = await db.auth.signOut();


        if (error) {

            console.error(
                "Logout error:",
                error
            );

            alert(
                "Logout नहीं हो पाया।"
            );

            return;
        }


        window.location.href =
            "../login.html";

    } catch (error) {

        console.error(
            "Logout exception:",
            error
        );

        window.location.href =
            "../login.html";
    }

}


/*
 * Compatibility aliases
 */

window.logoutStudent =
    logoutStudent;

window.studentLogout =
    logoutStudent;

window.logout =
    logoutStudent;


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.loadDashboard =
    loadDashboard;

window.loadStudentMaterials =
    loadStudentMaterials;


/* =========================================================
   CONSOLE
   ========================================================= */

console.log(
    "Future Plus Student Dashboard loaded successfully."
);
