const gridDiv = document.querySelector("#studentManagementGrid");
const studentsData = JSON.parse(gridDiv.getAttribute("data-students") || "[]");
const coursesData = JSON.parse(gridDiv.getAttribute("data-courses") || "[]");

// build a map: course_code -> course _id
const courseCodeToId = {};
coursesData.forEach((c) => {
    if (c.course_id && c._id) {
        courseCodeToId[c.course_id] = c._id;
    }
});

const initializeGrid = (gridDiv, students) => {
    console.log(students);
    const columnDefs = [
        {
            headerName: "First Name",
            field: "first_name",
            headerTooltip: "Student's first name.",
        },
        {
            headerName: "Last Name",
            field: "last_name",
            headerTooltip: "Student's last name.",
        },
        {
            headerName: "Email",
            field: "email",
            headerTooltip:
                "Student's email address used for login and invites.",
        },
        {
            headerName: "Course Code",
            field: "course_code",
            headerTooltip: "Short course code, e.g. CS-546.",
        },
        {
            headerName: "Course Name",
            field: "course_name",
            headerTooltip:
                "Full name of the course this student is enrolled in.",
        },
        {
            headerName: "Toggle TA",
            field: "is_ta",
            headerTooltip:
                "Click the switch to promote/demote this student as a TA for this course.",
            cellRenderer: roleCellRenderer,
        },
        {
            headerName: "Status",
            field: "status",
            headerTooltip: "Account status of the student (ACTIVE / INACTIVE).",
            cellRenderer: statusCellRenderer,
        },
        {
            headerName: "Action",
            field: "action",
            floatingFilter: false,
            headerTooltip: "Remove this student from the course.",
            cellRenderer: actionCellRenderer,
        },
    ];

    const defaultColDef = {
        sortable: true,
        filter: true,
        resizable: true,
        floatingFilter: true,
        wrapText: true,
        autoHeight: false,
    };

    const gridOptions = {
        columnDefs,
        rowData: students,
        defaultColDef,
        pagination: true,
        paginationPageSize: 8,
        paginationAutoPageSize: false,
        tooltipShowDelay: 500,
        tooltipHideDelay: 2000,
    };

    agGrid.createGrid(gridDiv, gridOptions);
};

const statusCellRenderer = (params) => {
    const isInactive = params.value === "inactive";

    const base =
        "px-2 py-0.5 rounded-full text-xs font-medium capitalize inline-block";

    return `
        <span class="${
            isInactive
                ? base + " bg-red-500/10 text-red-400 border border-red-500/30"
                : base +
                  " bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
        }">
            ${params.value}
        </span>
    `;
};

// CLICKABLE ROLE BUTTON, MUCH HIGHER CONTRAST
const roleCellRenderer = (params) => {
    const data = params.data;
    const isTa = !!data.is_ta;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.title = "Click to toggle between Student and TA";

    // loud, obvious button styles
    if (isTa) {
        btn.className =
            "inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold " +
            "bg-emerald-600 text-white border border-emerald-600 " +
            "hover:bg-emerald-500 hover:border-emerald-500 cursor-pointer transition";
        btn.textContent = "Teaching Assistant ";
    } else {
        btn.className =
            "inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold " +
            "bg-[#F0BD66] text-black border border-[#F0BD66] " +
            "hover:bg-[#f7c878] hover:border-[#f7c878] cursor-pointer transition";
        btn.textContent = "Student";
    }

    btn.addEventListener("click", () => {
        const courseId = courseCodeToId[data.course_code];
        const studentId = data._id;

        if (!courseId || !studentId) {
            console.error("Missing courseId or studentId for TA toggle", {
                courseId,
                studentId,
                data,
            });
            showToast("Could not resolve course or student id.", "error");
            return;
        }

        btn.disabled = true;

        fetch(`/courses/${courseId}/ta/${studentId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
        })
            .then(async (res) => {
                const body = await res.json().catch(() => ({}));
                return { status: res.status, body };
            })
            .then(({ status, body }) => {
                if (status !== 200) {
                    showToast(
                        body.message || "Failed to toggle TA status.",
                        "error"
                    );
                    btn.disabled = false;
                    return;
                }

                const newIsTa = !!body.is_ta;
                data.is_ta = newIsTa;

                // update button look + text
                if (newIsTa) {
                    btn.className =
                        "inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold " +
                        "bg-emerald-600 text-white border border-emerald-600 " +
                        "hover:bg-emerald-500 hover:border-emerald-500 cursor-pointer transition";
                    btn.textContent = "Teaching Assistant";
                } else {
                    btn.className =
                        "inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold " +
                        "bg-[#F0BD66] text-black border border-[#F0BD66] " +
                        "hover:bg-[#f7c878] hover:border-[#f7c878] cursor-pointer transition";
                    btn.textContent = "Student";
                }

                showToast(
                    newIsTa
                        ? "Student is now a Teaching Assistant."
                        : "Student is now a regular student.",
                    "success"
                );

                btn.disabled = false;
            })
            .catch((err) => {
                console.error("Toggle TA error:", err);
                showToast("Server error. Please try again.", "error");
                btn.disabled = false;
            });
    });

    return btn;
};

const actionCellRenderer = (params) => {
    const container = document.createElement("div");
    container.className = "flex items-center justify-center h-full gap-2";

    const deleteBtn = document.createElement("div");
    deleteBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="text-[#f0bd66] size-5 hover:cursor-pointer hover:text-red-500 transition">
            <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd"/>
        </svg>
    `;

    deleteBtn.addEventListener("click", () => {
        const data = params.data;

        const confirmDelete = confirm(
            `Are you sure you want to remove ${data.email} from ${data.course_code}?`
        );
        if (!confirmDelete) return;

        const courseId = courseCodeToId[data.course_code];
        const studentId = data._id;

        if (!courseId || !studentId) {
            console.error("Missing courseId or studentId", {
                courseId,
                studentId,
                data,
            });
            showToast("Could not resolve course or student id.", "error");
            return;
        }

        fetch(`/courses/${courseId}/students/${studentId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        })
            .then(async (res) => {
                const body = await res.json().catch(() => ({}));
                return { status: res.status, body };
            })
            .then(({ status, body }) => {
                if (status !== 200) {
                    showToast(
                        body.message || "Failed to remove student from course.",
                        "error"
                    );
                    return;
                }

                showToast("Student removed from course.", "success");
                params.api.applyTransaction({ remove: [data] });
            })
            .catch((err) => {
                console.error("Delete student error:", err);
                showToast("Server error. Please try again.", "error");
            });
    });

    container.appendChild(deleteBtn);
    return container;
};

const handleAddStudentModal = () => {
    const modal = document.getElementById("addStudentModal");
    if (modal) {
        if (modal.classList.contains("hidden")) {
            modal.classList.remove("hidden");
        } else {
            modal.classList.add("hidden");
        }
    }
};

const handleSaveStudent = (event) => {
    event.preventDefault();

    const email = event.target.email.value.trim();
    const is_ta = event.target.is_ta.value.trim() === "true";
    const courseUuid = event.target.courseUuid.value.trim();

    const button = event.target.querySelector("button[type='submit']");
    button.disabled = true;
    button.innerText = "Saving...";

    fetch(`/courses/${courseUuid}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, is_ta }),
    })
        .then(async (res) => {
            const body = await res.json();
            return { status: res.status, body };
        })
        .then(({ status, body }) => {
            if (status !== 200) {
                showToast(body.message || "unknown error.", "error");
                button.disabled = false;
                button.innerText = "Save";
                return;
            }

            showToast("Student enrolled successfully!", "success");

            handleAddStudentModal();

            setTimeout(() => {
                window.location.reload();
            }, 1200);
        })
        .catch((err) => {
            console.error("handleSaveStudent error:", err);
            showToast("Server error. Please try again.", "error");
            button.disabled = false;
            button.innerText = "Save";
        });

    return false;
};

initializeGrid(gridDiv, studentsData);
