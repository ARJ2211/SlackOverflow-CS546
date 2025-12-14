const initializeGrid = (gridDiv, courses) => {
    const columnDefs = [
        {
            headerName: "Course Code",
            field: "course_id",
            headerTooltip: "Short unique code for the course, e.g. CS-546.",
        },
        {
            headerName: "Course Name",
            field: "course_name",
            headerTooltip: "Full title of the course shown to students.",
        },
        {
            headerName: "Description",
            field: "course_description",
            flex: 1,
            headerTooltip: "A short summary of what the course is about.",
        },
        {
            headerName: "Labels",
            field: "labels",
            cellRenderer: labelsCellRenderer,
            headerTooltip:
                "Topic tags for this course. Use the + icon to add labels and click on a label to remove it.",
            autoHeight: true,
            cellStyle: {
                whiteSpace: "normal",
                paddingTop: "4px",
                paddingBottom: "4px",
            },
        },
        {
            headerName: "Action",
            field: "action",
            floatingFilter: false,
            cellRenderer: actionCellRenderer,
            headerTooltip: "Edit or delete a course.",
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
        rowData: courses,
        defaultColDef,
        pagination: true,
        paginationPageSize: 8,
        paginationAutoPageSize: false,
        tooltipShowDelay: 500,
        tooltipHideDelay: 2000,
    };

    agGrid.createGrid(gridDiv, gridOptions);
};

// click handler for labels to delete a label
const handleCourseLabelClick = async (courseId, labelId, labelName) => {
    console.log("Label clicked:", {
        courseId,
        labelId,
        labelName,
    });

    const confirmDelete = confirm(
        `Are you sure you want to delete the label "${labelName}"?`
    );
    if (!confirmDelete) return;

    try {
        const res = await fetch(`/courses/${courseId}/labels/${labelId}`, {
            method: "DELETE",
        });

        const body = await res.json().catch(() => ({}));

        if (res.status !== 200) {
            showToast(body.message || "Failed to delete label.", "error");
            return;
        }

        showToast("Label removed!", "success");

        // reload grid row so labels update instantly
        setTimeout(() => window.location.reload(), 600);
    } catch (err) {
        console.error("Error deleting label:", err);
        showToast("Server error. Try again.", "error");
    }
};

const labelsCellRenderer = (params) => {
    const labels = params.value;
    if (!Array.isArray(labels) || labels.length === 0) {
        return `
            <div class="flex items-center justify-between h-full">
                <span class="text-xs text-gray-400 italic">No labels</span>
                <button
                    title="Add Label"
                    class="flex items-center justify-center w-7 h-7 rounded-full bg-white"
                    onclick="handleAddLabelModal('${params.data._id}','${params.data.course_name}')"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        class="hover:cursor-pointer hover:text-yellow-500 size-5 text-[#F0BD66]"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </button>
            </div>
        `;
    }

    return `
    <div class="flex items-start gap-2 h-full">
        <div class="flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-1">
            ${labels
                .map((label) => {
                    const courseId = params.data._id;
                    const labelId = label._id || "";
                    const labelName = label.name || "";

                    return `
                        <span
                            class="
                                inline-flex
                                items-center
                                bg-[#F0BD66]
                                text-white
                                px-2
                                py-0.5
                                rounded-2xl
                                text-xs
                                cursor-pointer
                                transition-colors
                                duration-150
                                hover:bg-red-100
                                hover:text-red-700
                                hover:border
                                hover:border-red-200
                            "
                            title="Click to remove label"
                            onclick="handleCourseLabelClick(
                                '${courseId}',
                                '${labelId}',
                                '${labelName.replace(/'/g, "\\'")}'
                            )"
                        >
                            <span class="mr-1">${labelName}</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                class="w-3 h-3 pointer-events-none"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </span>
                    `;
                })
                .join("")}
        </div>

        <button
            title="Add Label"
            class="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-white"
            onclick="handleAddLabelModal('${params.data._id}','${
        params.data.course_name
    }')"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                class="hover:cursor-pointer hover:text-yellow-500 size-5 text-[#F0BD66]"
            >
                <path
                    fill-rule="evenodd"
                    d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z"
                    clip-rule="evenodd"
                />
            </svg>
        </button>
    </div>
`;
};

const actionCellRenderer = (params) => {
    const container = document.createElement("div");
    container.className = "flex items-center justify-center bg- h-full gap-2";

    const editBtn = document.createElement("div");
    editBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="text-[#f0bd66] size-5 hover:cursor-pointer hover:text-[#e3aa4e] transition">
            <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
            <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
        </svg>
    `;

    editBtn.addEventListener("click", () => {
        const data = params.data;
        console.log("Edit clicked for", data);
        alert(`Edit ${data.course_name}`);
        // Your edit logic here
    });

    const deleteBtn = document.createElement("div");
    deleteBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="text-[#f0bd66] size-5 hover:cursor-pointer hover:text-red-500 transition'">
            <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd"/>
        </svg>
    `;

    deleteBtn.addEventListener("click", () => {
        const data = params.data;
        const confirmDelete = confirm(
            `Are you sure you want to delete ${data.course_name}?`
        );
        if (!confirmDelete) return;

        fetch(`/courses/${data._id}`, {
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
                        body.message || "Failed to delete course.",
                        "error"
                    );
                    return;
                }

                showToast("Course deleted successfully!", "success");
                params.api.applyTransaction({ remove: [data] });
            })
            .catch((err) => {
                console.error("Delete course error:", err);
                showToast("Server error. Please try again.", "error");
            });
    });

    // container.appendChild(editBtn);
    container.appendChild(deleteBtn);

    return container;
};

const handleAddCourseModal = () => {
    const modal = document.getElementById("addCourseModal");
    if (modal) {
        if (modal.classList.contains("hidden")) {
            modal.classList.remove("hidden");
        } else {
            modal.classList.add("hidden");
        }
    }
};

const handleSaveCourse = (event) => {
    event.preventDefault();
    const mainContainer = document.getElementById("mainContainer");
    const user = JSON.parse(mainContainer.getAttribute("data-user") || "{}");

    const course_name = event.target.course_name.value.trim();
    const course_id = event.target.course_id.value.trim();
    const course_description = event.target.course_description.value.trim();
    const created_by = user.id;

    const button = event.target.querySelector("button[type='submit']");
    button.disabled = true;
    button.innerText = "Saving...";

    fetch("/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            course_name,
            course_id,
            course_description,
            created_by,
        }),
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

            showToast("Course created successfully!", "success");

            handleAddCourseModal();

            setTimeout(() => {
                window.location.reload();
            }, 1200);
        })
        .catch((err) => {
            console.error("handleSaveCourse error:", err);
            showToast("Server error. Please try again.", "error");
            button.disabled = false;
            button.innerText = "Save";
        });

    return false;
};

const handleAddLabelModal = (courseUuid, courseName) => {
    const modal = document.getElementById("addLabelModal");
    modal.setAttribute("data-courseUuid", courseUuid);
    const modalDes = modal.querySelector("#modalDescription");
    modalDes.innerText = `Fill the form to register a new label in the course: ${courseName}`;
    if (modal) {
        if (modal.classList.contains("hidden")) {
            modal.classList.remove("hidden");
        } else {
            modal.classList.add("hidden");
        }
    }
};

const handleSaveLabel = (event) => {
    event.preventDefault();

    const labelContainer = document.getElementById("addLabelModal");
    const courseUuid = labelContainer.getAttribute("data-courseUuid") || "";

    const name = event.target.name.value.trim();

    const button = event.target.querySelector("button[type='submit']");
    button.disabled = true;
    button.innerText = "Saving...";

    fetch(`/courses/${courseUuid}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
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

            showToast("Label created successfully!", "success");

            handleAddLabelModal();

            setTimeout(() => {
                window.location.reload();
            }, 1200);
        })
        .catch((err) => {
            console.error("handleSaveCourse error:", err);
            showToast("Server error. Please try again.", "error");
            button.disabled = false;
            button.innerText = "Save";
        });

    return false;
};

const gridDiv = document.querySelector("#courseManagementGrid");
const coursesData = JSON.parse(gridDiv.getAttribute("data-courses") || "[]");

initializeGrid(gridDiv, coursesData);
