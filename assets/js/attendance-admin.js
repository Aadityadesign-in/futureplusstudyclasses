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
        // CHECK USER
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

        const dateInput =
            document.getElementById(
                "attendanceDate"
            );

        const classFilter =
            document.getElementById(
                "classFilter"
            );

        const table =
            document.getElementById(
                "studentsTable"
            );



        // =================================
        // DEFAULT DATE = TODAY
        // =================================

        const today =
            new Date()
                .toISOString()
                .split("T")[0];

        dateInput.value = today;



        // =================================
        // LOAD Classes
        // =================================

        async function loadClasses() {

            const {
                data,
                error
            } =
                await supabase
                    .from("profiles")
                    .select(
                        "class_name"
                    )
                    .eq(
                        "role",
                        "student"
                    )
                    .eq(
                        "status",
                        "approved"
                    );


            if (error) {

                console.error(
                    error
                );

                return;
            }


            const Classes =
                [
                    ...new Set(
                        (data || [])
                            .map(
                                student =>
                                    student.class_name
                            )
                            .filter(Boolean)
                    )
                ]
                .sort();


            classFilter.innerHTML = `

                <option value="">
                    All Classes
                </option>

            `;


            Classes.forEach(
                className => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        className;

                    option.textContent =
                        className;

                    classFilter.appendChild(
                        option
                    );

                }
            );

        }



        // =================================
        // LOAD STUDENTS + ATTENDANCE
        // =================================

        async function loadAttendance() {

            const selectedDate =
                dateInput.value;


            if (!selectedDate) {

                alert(
                    "Please select a date."
                );

                return;
            }



            // Students

            let studentQuery =
                supabase
                    .from("profiles")
                    .select(
                        "id,full_name,email,phone,class_name"
                    )
                    .eq(
                        "role",
                        "student"
                    )
                    .eq(
                        "status",
                        "approved"
                    )
                    .order(
                        "full_name",
                        {
                            ascending: true
                        }
                    );


            if (
                classFilter.value
            ) {

                studentQuery =
                    studentQuery.eq(
                        "class_name",
                        classFilter.value
                    );

            }


            const {
                data: students,
                error: studentsError
            } =
                await studentQuery;


            if (studentsError) {

                console.error(
                    studentsError
                );

                alert(
                    "Unable to load students."
                );

                return;
            }



            // Existing attendance

            const {
                data: attendance,
                error: attendanceError
            } =
                await supabase
                    .from("attendance")
                    .select("*")
                    .eq(
                        "attendance_date",
                        selectedDate
                    );


            if (attendanceError) {

                console.error(
                    attendanceError
                );

                alert(
                    "Unable to load attendance."
                );

                return;
            }



            const attendanceMap =
                new Map();


            (attendance || [])
                .forEach(record => {

                    attendanceMap.set(
                        record.student_id,
                        record
                    );

                });



            renderStudents(
                students || [],
                attendanceMap
            );

        }



        // =================================
        // RENDER STUDENTS
        // =================================

        function renderStudents(
            students,
            attendanceMap
        ) {

            document.getElementById(
                "totalStudents"
            ).textContent =
                students.length;


            let present = 0;

            let absent = 0;


            students.forEach(
                student => {

                    const record =
                        attendanceMap.get(
                            student.id
                        );


                    if (
                        record?.status ===
                        "present"
                    ) {

                        present++;

                    }


                    if (
                        record?.status ===
                        "absent"
                    ) {

                        absent++;

                    }

                }
            );


            document.getElementById(
                "presentCount"
            ).textContent =
                present;


            document.getElementById(
                "absentCount"
            ).textContent =
                absent;


            const marked =
                present + absent;


            const percentage =
                marked > 0
                    ? Math.round(
                        (
                            present /
                            marked
                        ) * 100
                    )
                    : 0;


            document.getElementById(
                "attendancePercentage"
            ).textContent =
                percentage + "%";



            if (!students.length) {

                table.innerHTML = `

                    <tr>

                        <td
                            colspan="5"
                            class="empty"
                        >
                            No approved students
                            found.
                        </td>

                    </tr>

                `;

                return;
            }



            table.innerHTML =
                students
                    .map(student => {

                        const record =
                            attendanceMap.get(
                                student.id
                            );


                        let statusHTML =
                            `<span>Not Marked</span>`;


                        if (
                            record?.status ===
                            "present"
                        ) {

                            statusHTML = `
                                <span class="current-status present-text">
                                    ✓ Present
                                </span>
                            `;

                        }


                        if (
                            record?.status ===
                            "absent"
                        ) {

                            statusHTML = `
                                <span class="current-status absent-text">
                                    ✕ Absent
                                </span>
                            `;

                        }



                        return `

                            <tr>

                                <td>

                                    <strong>
                                        ${escapeHTML(
                                            student.full_name ||
                                            "Student"
                                        )}
                                    </strong>

                                    <br>

                                    <small>
                                        ${escapeHTML(
                                            student.email ||
                                            ""
                                        )}
                                    </small>

                                </td>


                                <td>
                                    ${escapeHTML(
                                        student.class_name ||
                                        "—"
                                    )}
                                </td>


                                <td>
                                    ${escapeHTML(
                                        student.phone ||
                                        "—"
                                    )}
                                </td>


                                <td>
                                    ${statusHTML}
                                </td>


                                <td>

                                    <div
                                        class="attendance-buttons"
                                    >

                                        <button
                                            class="present-btn"
                                            onclick="markAttendance(
                                                '${student.id}',
                                                'present'
                                            )"
                                        >
                                            ✓ Present
                                        </button>


                                        <button
                                            class="absent-btn"
                                            onclick="markAttendance(
                                                '${student.id}',
                                                'absent'
                                            )"
                                        >
                                            ✕ Absent
                                        </button>

                                    </div>

                                </td>

                            </tr>

                        `;

                    })
                    .join("");

        }



        // =================================
        // MARK ATTENDANCE
        // =================================

        window.markAttendance =
            async function(
                studentId,
                status
            ) {

                const selectedDate =
                    dateInput.value;


                if (!selectedDate) {

                    alert(
                        "Please select a date."
                    );

                    return;
                }



                // Check existing record

                const {
                    data: existing,
                    error: checkError
                } =
                    await supabase
                        .from("attendance")
                        .select("id")
                        .eq(
                            "student_id",
                            studentId
                        )
                        .eq(
                            "attendance_date",
                            selectedDate
                        )
                        .maybeSingle();


                if (checkError) {

                    console.error(
                        checkError
                    );

                    alert(
                        "Unable to check attendance."
                    );

                    return;
                }



                let result;



                if (existing) {

                    // Update

                    result =
                        await supabase
                            .from("attendance")
                            .update({

                                status,

                                marked_by:
                                    user.id

                            })
                            .eq(
                                "id",
                                existing.id
                            );

                } else {

                    // Insert

                    result =
                        await supabase
                            .from("attendance")
                            .insert({

                                student_id:
                                    studentId,

                                attendance_date:
                                    selectedDate,

                                status,

                                marked_by:
                                    user.id

                            });

                }



                if (result.error) {

                    console.error(
                        result.error
                    );

                    alert(
                        "Unable to save attendance."
                    );

                    return;
                }



                await loadAttendance();

            };



        // =================================
        // ESCAPE HTML
        // =================================

        function escapeHTML(
            value
        ) {

            const div =
                document.createElement(
                    "div"
                );

            div.textContent =
                value ?? "";

            return div.innerHTML;

        }



        // =================================
        // LOAD BUTTON
        // =================================

        document
            .getElementById(
                "loadAttendanceBtn"
            )
            .addEventListener(
                "click",
                loadAttendance
            );



        // =================================
        // CLASS FILTER
        // =================================

        classFilter.addEventListener(
            "change",
            loadAttendance
        );



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
        // INITIALIZE
        // =================================

        await loadClasses();

        await loadAttendance();

    }
);