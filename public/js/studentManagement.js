const initializeGrid = (gridDiv, students) => {
    console.log(students)
    const columnDefs = [
        { headerName: "First Name", field: "first_name" },
        { headerName: "Last Name", field: "last_name" },
        { headerName: "Email", field: "email" },

        { headerName: "Course Code", field: "course_code" },
        { headerName: "Course Name", field: "course_name", },
        { headerName: "Role", field: "is_ta", editable: true, },

        { headerName: "Status", field: "status", cellRenderer: statusCellRenderer, },
        { headerName: "Action", field: "action", floatingFilter: false, cellRenderer: actionCellRenderer },
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
    };

    agGrid.createGrid(gridDiv, gridOptions);
}

const statusCellRenderer = (params) => {
    if (params.value == "inactive") {
        return `<div class="text-red-600">${params.value}</div>`

    } else {
        return `<div class="text-green-600">${params.value}</div>`
    }
}

const actionCellRenderer = (params) => {
    const container = document.createElement('div');
    container.className = 'flex items-center justify-center bg- h-full gap-2';

    const editBtn = document.createElement('div');
    editBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="text-[#f0bd66] size-5 hover:cursor-pointer hover:text-[#e3aa4e] transition">
            <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
            <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
        </svg>
    `;

    editBtn.addEventListener('click', () => {
        const data = params.data;
        console.log('Edit clicked for', data);
        alert(`Edit ${data.course_name}`);
        // Your edit logic here
    });

    const deleteBtn = document.createElement('div');
    deleteBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="text-[#f0bd66] size-5 hover:cursor-pointer hover:text-red-500 transition'">
            <path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clip-rule="evenodd"/>
        </svg>
    `;

    deleteBtn.addEventListener('click', () => {
        const data = params.data;
        const confirmDelete = confirm(`Are you sure you want to delete ${data.course_name}?`);
        if (confirmDelete) {
            params.api.applyTransaction({ remove: [data] });
        }
    });

    // container.appendChild(editBtn);
    container.appendChild(deleteBtn);

    return container;
}

const handleAddStudentModal = () => {

    const modal = document.getElementById('addStudentModal');
    if (modal) {
        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
        }
    }
}

const handleSaveStudent = (event) => {

    event.preventDefault();

    const email = event.target.email.value.trim();
    const is_ta = event.target.is_ta.value.trim() === 'true';

    const courseUuid = event.target.courseUuid.value.trim();

    const button = event.target.querySelector("button[type='submit']");
    button.disabled = true;
    button.innerText = "Saving...";

    fetch(`/courses/${courseUuid}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, is_ta })
    })
        .then(async (res) => {
            const body = await res.json();
            return { status: res.status, body };
        }
        ).then(({ status, body }) => {
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
        .catch(err => {
            console.error("handleSaveStudent error:", err);
            showToast("Server error. Please try again.", "error");
            button.disabled = false;
            button.innerText = "Save";
        });

    return false;
};











const gridDiv = document.querySelector('#studentManagementGrid');
const studentsData = JSON.parse(gridDiv.getAttribute('data-students') || '[]');
initializeGrid(gridDiv, studentsData);
