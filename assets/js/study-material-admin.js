/* =========================================================
   FUTURE PLUS STUDY CLASSES
   ADMIN STUDY MATERIAL MANAGEMENT
   ========================================================= */

const db = window.supabaseClient;

let materials = [];
let editingMaterialId = null;


/* =========================================================
   HELPERS
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}

function setText(id, value) {
    const element = $(id);

    if (element) {
        element.textContent = value ?? "";
    }
}

function setValue(id, value) {
    const element = $(id);

    if (element) {
        element.value = value ?? "";
    }
}

function escapeHTML(value) {
    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
}

function formatDate(dateString) {

    if (!dateString) {
        return "-";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


/* =========================================================
   ADMIN CHECK
   ========================================================= */

async function checkAdmin() {

    if (!db) {

        alert(
            "Supabase connection not found."
        );

        return false;
    }


    const {
        data: { user },
        error: userError
    } = await db.auth.getUser();


    if (userError || !user) {

        window.location.href =
            "../login.html";

        return false;
    }


    const {
        data: profile,
        error
    } = await db
        .from("profiles")
        .select(
            "id, full_name, role, status"
        )
        .eq("id", user.id)
        .single();


    if (error || !profile) {

        alert(
            "Profile not found."
        );

        await db.auth.signOut();

        window.location.href =
            "../login.html";

        return false;
    }


    if (
        profile.role !== "admin" ||
        profile.status !== "approved"
    ) {

        alert(
            "Access denied. Admin only."
        );

        await db.auth.signOut();

        window.location.href =
            "../login.html";

        return false;
    }


    return true;
}


/* =========================================================
   LOAD MATERIALS
   ========================================================= */

async function loadMaterials() {

    const {
        data,
        error
    } = await db
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
            created_by,
            created_at,
            updated_at
        `)
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Materials load error:",
            error
        );


        const tbody =
            $("materialsTableBody");


        if (tbody) {

            tbody.innerHTML = `
                <tr>
                    <td
                        colspan="8"
                        class="empty-message"
                    >
                        Failed to load study materials.
                    </td>
                </tr>
            `;
        }


        return;
    }


    materials = data || [];


    renderMaterials();

    updateStats();
}


/* =========================================================
   RENDER MATERIALS
   ========================================================= */

function renderMaterials() {

    const tbody =
        $("materialsTableBody");


    if (!tbody) {
        return;
    }


    const searchInput =
        $("searchInput");


    const statusFilter =
        $("statusFilter");


    const typeFilter =
        $("typeFilter");


    const search =
        (
            searchInput?.value || ""
        )
        .toLowerCase()
        .trim();


    const selectedStatus =
        statusFilter?.value || "all";


    const selectedType =
        typeFilter?.value || "all";


    let filteredMaterials =
        [...materials];


    /* SEARCH */

    if (search) {

        filteredMaterials =
            filteredMaterials.filter(
                material => {

                    const title =
                        material.title || "";

                    const subject =
                        material.subject || "";

                    const className =
                        material.class_name || "";

                    const description =
                        material.description || "";


                    return (
                        title
                            .toLowerCase()
                            .includes(search)

                        ||

                        subject
                            .toLowerCase()
                            .includes(search)

                        ||

                        className
                            .toLowerCase()
                            .includes(search)

                        ||

                        description
                            .toLowerCase()
                            .includes(search)
                    );
                }
            );
    }


    /* STATUS */

    if (selectedStatus !== "all") {

        filteredMaterials =
            filteredMaterials.filter(
                material =>
                    material.status ===
                    selectedStatus
            );
    }


    /* TYPE */

    if (selectedType !== "all") {

        filteredMaterials =
            filteredMaterials.filter(
                material =>
                    material.file_type ===
                    selectedType
            );
    }


    /* EMPTY */

    if (!filteredMaterials.length) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="empty-message"
                >
                    No study materials found.
                </td>
            </tr>
        `;

        return;
    }


    /* TABLE */

    tbody.innerHTML =
        filteredMaterials
            .map(material => {


                const statusClass =
                    material.status === "active"
                        ? "green"
                        : "red";


                const statusText =
                    material.status === "active"
                        ? "Active"
                        : "Inactive";


                const type =
                    material.file_type || "link";


                const typeLabel =
                    type.charAt(0).toUpperCase()
                    + type.slice(1);


                return `
                    <tr>

                        <td>

                            <strong>
                                ${escapeHTML(
                                    material.title
                                )}
                            </strong>

                            ${
                                material.description
                                    ? `
                                        <br>
                                        <small>
                                            ${escapeHTML(
                                                material.description
                                            )}
                                        </small>
                                    `
                                    : ""
                            }

                        </td>


                        <td>
                            ${escapeHTML(
                                material.subject || "-"
                            )}
                        </td>


                        <td>
                            ${escapeHTML(
                                material.class_name || "-"
                            )}
                        </td>


                        <td>
                            ${escapeHTML(
                                typeLabel
                            )}
                        </td>


                        <td>

                            <span
                                class="
                                    status-badge
                                    ${statusClass}
                                "
                            >
                                ${statusText}
                            </span>

                        </td>


                        <td>

                            <a
                                href="${escapeHTML(
                                    material.file_url
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="btn btn-small"
                            >
                                🔗 Open
                            </a>

                        </td>


                        <td>
                            ${formatDate(
                                material.created_at
                            )}
                        </td>


                        <td>

                            <button
                                type="button"
                                class="btn btn-small"
                                onclick="editMaterial('${material.id}')"
                            >
                                ✏️ Edit
                            </button>


                            <button
                                type="button"
                                class="btn btn-small danger"
                                onclick="deleteMaterial('${material.id}')"
                            >
                                🗑️ Delete
                            </button>

                        </td>

                    </tr>
                `;

            })
            .join("");
}


/* =========================================================
   UPDATE STATS
   ========================================================= */

function updateStats() {

    const total =
        materials.length;


    const active =
        materials.filter(
            material =>
                material.status === "active"
        ).length;


    const inactive =
        materials.filter(
            material =>
                material.status === "inactive"
        ).length;


    const documents =
        materials.filter(
            material =>
                material.file_type === "pdf" ||
                material.file_type === "document"
        ).length;


    setText(
        "totalMaterials",
        total
    );


    setText(
        "activeMaterials",
        active
    );


    setText(
        "inactiveMaterials",
        inactive
    );


    setText(
        "documentMaterials",
        documents
    );
}


/* =========================================================
   OPEN ADD MODAL
   ========================================================= */

function openAddMaterialModal() {

    editingMaterialId = null;


    setText(
        "modalTitle",
        "➕ Add Study Material"
    );


    const form =
        $("materialForm");


    if (form) {
        form.reset();
    }


    setValue(
        "fileType",
        "pdf"
    );


    setValue(
        "status",
        "active"
    );


    showMaterialModal();
}


/* =========================================================
   SHOW MODAL
   ========================================================= */

function showMaterialModal() {

    const modal =
        $("materialModal");


    if (!modal) {
        return;
    }


    modal.classList.add(
        "active"
    );


    modal.style.display =
        "flex";
}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeMaterialModal() {

    const modal =
        $("materialModal");


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "active"
    );


    modal.style.display =
        "none";


    editingMaterialId = null;
}


/* =========================================================
   EDIT MATERIAL
   ========================================================= */

function editMaterial(id) {

    const material =
        materials.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!material) {

        alert(
            "Material record not found."
        );

        return;
    }


    editingMaterialId =
        material.id;


    setText(
        "modalTitle",
        "✏️ Edit Study Material"
    );


    setValue(
        "title",
        material.title
    );


    setValue(
        "subject",
        material.subject
    );


    setValue(
        "className",
        material.class_name
    );


    setValue(
        "description",
        material.description
    );


    setValue(
        "fileUrl",
        material.file_url
    );


    setValue(
        "fileType",
        material.file_type
    );


    setValue(
        "status",
        material.status
    );


    showMaterialModal();
}


/* =========================================================
   SAVE MATERIAL
   ========================================================= */

async function saveMaterial(event) {

    if (event) {
        event.preventDefault();
    }


    const title =
        $("title")?.value.trim();


    const subject =
        $("subject")?.value.trim() ||
        null;


    const className =
        $("className")?.value.trim() ||
        null;


    const description =
        $("description")?.value.trim() ||
        null;


    const fileUrl =
        $("fileUrl")?.value.trim();


    const fileType =
        $("fileType")?.value;


    const status =
        $("status")?.value;


    /* VALIDATION */

    if (!title) {

        alert(
            "Please enter material title."
        );

        return;
    }


    if (!fileUrl) {

        alert(
            "Please enter material URL."
        );

        return;
    }


    try {

        new URL(fileUrl);

    } catch (error) {

        alert(
            "Please enter a valid URL."
        );

        return;
    }


    if (
        ![
            "pdf",
            "document",
            "image",
            "link"
        ].includes(fileType)
    ) {

        alert(
            "Invalid material type."
        );

        return;
    }


    if (
        ![
            "active",
            "inactive"
        ].includes(status)
    ) {

        alert(
            "Invalid status."
        );

        return;
    }


    const saveButton =
        $("saveMaterialBtn");


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "Saving...";
    }


    try {

        /* =========================================
           UPDATE
           ========================================= */

        if (editingMaterialId) {

            const {
                error
            } = await db
                .from("study_materials")
                .update({

                    title: title,

                    subject: subject,

                    class_name: className,

                    description: description,

                    file_url: fileUrl,

                    file_type: fileType,

                    status: status

                })
                .eq(
                    "id",
                    editingMaterialId
                );


            if (error) {
                throw error;
            }


            alert(
                "Study material updated successfully."
            );
        }


        /* =========================================
           INSERT
           ========================================= */

        else {

            const {
                data: {
                    user
                }
            } = await db.auth.getUser();


            const {
                error
            } = await db
                .from("study_materials")
                .insert({

                    title: title,

                    subject: subject,

                    class_name: className,

                    description: description,

                    file_url: fileUrl,

                    file_type: fileType,

                    status: status,

                    created_by:
                        user?.id || null

                });


            if (error) {
                throw error;
            }


            alert(
                "Study material added successfully."
            );
        }


        closeMaterialModal();


        await loadMaterials();

    }


    catch (error) {

        console.error(
            "Save material error:",
            error
        );


        alert(
            "Study material save nahi ho paaya.\n\n"
            +
            error.message
        );

    }


    finally {

        if (saveButton) {

            saveButton.disabled =
                false;


            saveButton.textContent =
                editingMaterialId
                    ? "Update Material"
                    : "Save Material";
        }
    }
}


/* =========================================================
   DELETE MATERIAL
   ========================================================= */

async function deleteMaterial(id) {

    const material =
        materials.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!material) {
        return;
    }


    const confirmed =
        confirm(
            `Delete "${material.title}"?\n\n` +
            `This action cannot be undone.`
        );


    if (!confirmed) {
        return;
    }


    const {
        error
    } = await db
        .from("study_materials")
        .delete()
        .eq(
            "id",
            id
        );


    if (error) {

        console.error(
            "Delete material error:",
            error
        );


        alert(
            "Material delete nahi ho paaya.\n\n"
            +
            error.message
        );


        return;
    }


    alert(
        "Study material deleted successfully."
    );


    await loadMaterials();
}


/* =========================================================
   FILTER EVENTS
   ========================================================= */

function setupFilters() {

    const searchInput =
        $("searchInput");


    const statusFilter =
        $("statusFilter");


    const typeFilter =
        $("typeFilter");


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            renderMaterials
        );
    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            renderMaterials
        );
    }


    if (typeFilter) {

        typeFilter.addEventListener(
            "change",
            renderMaterials
        );
    }
}


/* =========================================================
   REFRESH
   ========================================================= */

function setupRefresh() {

    const refreshBtn =
        $("refreshBtn");


    if (!refreshBtn) {
        return;
    }


    refreshBtn.addEventListener(
        "click",
        async () => {

            refreshBtn.disabled =
                true;


            refreshBtn.textContent =
                "Loading...";


            await loadMaterials();


            refreshBtn.disabled =
                false;


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
        $("addMaterialBtn");


    if (addButton) {

        addButton.addEventListener(
            "click",
            openAddMaterialModal
        );
    }


    const closeButtons = [

        $("closeModalBtn"),

        $("cancelBtn"),

        $("closeMaterialModal"),

        $("cancelMaterialBtn"),

        $("closeModal")

    ];


    closeButtons.forEach(
        button => {

            if (!button) {
                return;
            }


            button.addEventListener(
                "click",
                closeMaterialModal
            );

        }
    );


    const modal =
        $("materialModal");


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    closeMaterialModal();
                }

            }
        );
    }


    const form =
        $("materialForm");


    if (form) {

        form.addEventListener(
            "submit",
            saveMaterial
        );
    }
}


/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogout() {

    const logoutBtn =
        $("logoutBtn");


    if (!logoutBtn) {
        return;
    }


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

async function initStudyMaterialAdmin() {

    const isAdmin =
        await checkAdmin();


    if (!isAdmin) {
        return;
    }


    await loadMaterials();


    setupFilters();

    setupRefresh();

    setupModalEvents();

    setupLogout();
}


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.openAddMaterialModal =
    openAddMaterialModal;

window.closeMaterialModal =
    closeMaterialModal;

window.editMaterial =
    editMaterial;

window.deleteMaterial =
    deleteMaterial;

window.saveMaterial =
    saveMaterial;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initStudyMaterialAdmin
);