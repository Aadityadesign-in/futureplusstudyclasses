document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const supabase =
            window.supabaseClient;


        if (!supabase) {

            alert(
                "Supabase connection not found."
            );

            return;
        }



        // =================================
        // CHECK LOGIN
        // =================================

        const {
            data: { user }
        } =
            await supabase.auth.getUser();


        if (!user) {

            window.location.href =
                "../login.html";

            return;
        }



        // =================================
        // CHECK ADMIN
        // =================================

        const {
            data: profile,
            error: profileError
        } =
            await supabase
                .from("profiles")
                .select(
                    "role,status"
                )
                .eq(
                    "id",
                    user.id
                )
                .maybeSingle();


        if (
            profileError ||
            !profile ||
            profile.role !== "admin" ||
            profile.status !== "approved"
        ) {

            alert(
                "Admin access required."
            );

            window.location.href =
                "../login.html";

            return;
        }



        // =================================
        // ELEMENTS
        // =================================

        const modal =
            document.getElementById(
                "noticeModal"
            );

        const table =
            document.getElementById(
                "noticesTable"
            );

        const audience =
            document.getElementById(
                "noticeAudience"
            );

        const classGroup =
            document.getElementById(
                "classGroup"
            );



        // =================================
        // LOAD NOTICES
        // =================================

        async function loadNotices() {

            const {
                data,
                error
            } =
                await supabase
                    .from("notices")
                    .select("*")
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    );


            if (error) {

                console.error(error);

                table.innerHTML = `
                    <tr>
                        <td colspan="5">
                            Failed to load notices.
                        </td>
                    </tr>
                `;

                return;
            }


            const notices =
                data || [];


            // Stats

            document.getElementById(
                "totalNotices"
            ).textContent =
                notices.length;


            document.getElementById(
                "activeNotices"
            ).textContent =
                notices.filter(
                    n =>
                        n.status === "active"
                ).length;


            document.getElementById(
                "inactiveNotices"
            ).textContent =
                notices.filter(
                    n =>
                        n.status === "inactive"
                ).length;



            if (!notices.length) {

                table.innerHTML = `
                    <tr>
                        <td colspan="5">
                            No notices found.
                        </td>
                    </tr>
                `;

                return;
            }



            table.innerHTML =
                notices
                    .map(notice => {

                        const date =
                            new Date(
                                notice.created_at
                            )
                            .toLocaleDateString(
                                "en-IN"
                            );


                        const audienceText =
                            notice.audience ===
                            "class"

                                ? `Class: ${
                                    notice.class_name ||
                                    "—"
                                }`

                                : "All Students";


                        return `

                            <tr>

                                <td>

                                    <strong>
                                        ${
                                            escapeHTML(
                                                notice.title
                                            )
                                        }
                                    </strong>

                                </td>


                                <td>
                                    ${audienceText}
                                </td>


                                <td>

                                    <span
                                        class="badge ${
                                            notice.status
                                        }"
                                    >
                                        ${
                                            notice.status
                                        }
                                    </span>

                                </td>


                                <td>
                                    ${date}
                                </td>


                                <td>

                                    <button
                                        class="action-btn edit-btn"
                                        onclick="editNotice(${notice.id})"
                                    >
                                        Edit
                                    </button>


                                    <button
                                        class="action-btn delete-btn"
                                        onclick="deleteNotice(${notice.id})"
                                    >
                                        Delete
                                    </button>

                                </td>

                            </tr>

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
        // OPEN ADD MODAL
        // =================================

        document
            .getElementById(
                "addNoticeBtn"
            )
            .addEventListener(
                "click",
                () => {

                    document.getElementById(
                        "modalTitle"
                    ).textContent =
                        "Add Notice";


                    document.getElementById(
                        "noticeId"
                    ).value = "";


                    document.getElementById(
                        "noticeTitle"
                    ).value = "";


                    document.getElementById(
                        "noticeMessage"
                    ).value = "";


                    document.getElementById(
                        "noticeAudience"
                    ).value = "all";


                    document.getElementById(
                        "noticeClass"
                    ).value = "";


                    document.getElementById(
                        "noticeStatus"
                    ).value = "active";


                    classGroup.style.display =
                        "none";


                    modal.style.display =
                        "flex";

                }
            );



        // =================================
        // AUDIENCE CHANGE
        // =================================

        audience.addEventListener(
            "change",
            () => {

                if (
                    audience.value ===
                    "class"
                ) {

                    classGroup.style.display =
                        "block";

                } else {

                    classGroup.style.display =
                        "none";

                }

            }
        );



        // =================================
        // CANCEL
        // =================================

        document
            .getElementById(
                "cancelBtn"
            )
            .addEventListener(
                "click",
                () => {

                    modal.style.display =
                        "none";

                }
            );



        // =================================
        // SAVE NOTICE
        // =================================

        document
            .getElementById(
                "saveBtn"
            )
            .addEventListener(
                "click",
                async () => {

                    const id =
                        document.getElementById(
                            "noticeId"
                        ).value;


                    const title =
                        document.getElementById(
                            "noticeTitle"
                        ).value.trim();


                    const message =
                        document.getElementById(
                            "noticeMessage"
                        ).value.trim();


                    const audienceValue =
                        document.getElementById(
                            "noticeAudience"
                        ).value;


                    const className =
                        document.getElementById(
                            "noticeClass"
                        ).value.trim();


                    const status =
                        document.getElementById(
                            "noticeStatus"
                        ).value;



                    if (!title) {

                        alert(
                            "Please enter notice title."
                        );

                        return;
                    }


                    if (!message) {

                        alert(
                            "Please enter notice message."
                        );

                        return;
                    }



                    const noticeData = {

                        title,

                        message,

                        audience:
                            audienceValue,

                        class_name:
                            audienceValue === "class"
                                ? className
                                : null,

                        status

                    };



                    let error;



                    if (id) {

                        const result =
                            await supabase
                                .from("notices")
                                .update(
                                    noticeData
                                )
                                .eq(
                                    "id",
                                    id
                                );

                        error =
                            result.error;

                    } else {

                        const result =
                            await supabase
                                .from("notices")
                                .insert(
                                    noticeData
                                );

                        error =
                            result.error;

                    }



                    if (error) {

                        console.error(
                            error
                        );

                        alert(
                            "Unable to save notice."
                        );

                        return;
                    }



                    alert(
                        id
                            ? "Notice updated successfully."
                            : "Notice added successfully."
                    );


                    modal.style.display =
                        "none";


                    loadNotices();

                }
            );



        // =================================
        // EDIT NOTICE
        // =================================

        window.editNotice =
            async function(id) {

                const {
                    data,
                    error
                } =
                    await supabase
                        .from("notices")
                        .select("*")
                        .eq(
                            "id",
                            id
                        )
                        .maybeSingle();


                if (error || !data) {

                    alert(
                        "Notice not found."
                    );

                    return;
                }



                document.getElementById(
                    "modalTitle"
                ).textContent =
                    "Edit Notice";


                document.getElementById(
                    "noticeId"
                ).value =
                    data.id;


                document.getElementById(
                    "noticeTitle"
                ).value =
                    data.title;


                document.getElementById(
                    "noticeMessage"
                ).value =
                    data.message;


                document.getElementById(
                    "noticeAudience"
                ).value =
                    data.audience;


                document.getElementById(
                    "noticeClass"
                ).value =
                    data.class_name || "";


                document.getElementById(
                    "noticeStatus"
                ).value =
                    data.status;



                if (
                    data.audience ===
                    "class"
                ) {

                    classGroup.style.display =
                        "block";

                } else {

                    classGroup.style.display =
                        "none";

                }


                modal.style.display =
                    "flex";

            };



        // =================================
        // DELETE NOTICE
        // =================================

        window.deleteNotice =
            async function(id) {

                const confirmDelete =
                    confirm(
                        "Are you sure you want to delete this notice?"
                    );


                if (!confirmDelete) {
                    return;
                }



                const {
                    error
                } =
                    await supabase
                        .from("notices")
                        .delete()
                        .eq(
                            "id",
                            id
                        );


                if (error) {

                    console.error(
                        error
                    );

                    alert(
                        "Unable to delete notice."
                    );

                    return;
                }


                alert(
                    "Notice deleted successfully."
                );


                loadNotices();

            };



        // =================================
        // LOGOUT
        // =================================

        document
            .getElementById(
                "logoutBtn"
            )
            .addEventListener(
                "click",
                async () => {

                    await supabase.auth.signOut();

                    window.location.href =
                        "../login.html";

                }
            );



        // =================================
        // INITIAL LOAD
        // =================================

        loadNotices();

    }
);