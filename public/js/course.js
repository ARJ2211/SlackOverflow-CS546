const handleAddQuestionModal = () => {

    const modal = document.getElementById('addQuestionModal');
    if (modal) {
        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
        }
    }
}


const handleSaveQuestion = (event) => {
    event.preventDefault()

    const mainContainer = document.getElementById('mainContainer');
    const courseContainer = document.getElementById('courseContainer');

    const user = JSON.parse(mainContainer.getAttribute('data-user') || '{}');
    const course_id = courseContainer.getAttribute('data-course-id') || ''

    const labels = Array.from(event.target.labels.selectedOptions).map((option) => option.value)
    const question = event.target.question.value.trim()


    const button = event.target.querySelector("button[type='submit']")
    button.disabled = true
    button.innerText = "Submitting..."

    let body = {}

    body.labels = labels;
    body.course_id = course_id;
    body.question = question;
    body.user_id = user.id;


    fetch(`/questions/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    })
        .then(async (res) => {
            const responseBody = await res.json()
            return { status: res.status, body: responseBody }
        })
        .then(({ status, body }) => {
            if (status !== 200) {
                showToast(body.message || "Unknown error.", "error")
                button.disabled = false
                button.innerText = "Submit"
                return
            }

            showToast("Question created successfully!", "success")
            button.disabled = false
            button.innerText = "Submit"

            setTimeout(() => {
                window.location.reload()
            }, 500)
        })
        .catch((err) => {
            console.error("handleAddQuestion error:", err)
            showToast("Server error. Please try again.", "error")
            button.disabled = false
            button.innerText = "Send"
        })

    return false
}


const handleFilterDropdown = (event) => {
    setFilterFormData()
    const filterDropdown = document.getElementById("filterDropdown")
    if (!filterDropdown) return
    const isClosed = filterDropdown.classList.contains("pointer-events-none")
    if (isClosed) {
        filterDropdown.classList.remove("opacity-0", "scale-95", "pointer-events-none")
    } else {
        filterDropdown.classList.add("opacity-0", "scale-95", "pointer-events-none")
    }
};

const handleOutsideClick = (event) => {
    const filterBtn = document.getElementById("openFilter")
    if (!filterDropdown.contains(event.target) && event.target !== filterBtn) {
        filterDropdown.classList.add("opacity-0", "scale-95", "pointer-events-none")
    }
};

const handleApplyFilters = async (event) => {
    event.preventDefault();

    const courseContainer = document.getElementById('courseContainer');
    const course_id = courseContainer.getAttribute('data-course-id') || ''


    const form = event.target;
    const question = event.target.question.value.trim()
    const labels = [...form.querySelectorAll('input[name="labels[]"]:checked')].map(label => label.value)
    const user_name = event.target.user_name.value.trim()
    const status_open = form.status_open.checked ? "open" : ""
    const status_closed = form.status_closed.checked ? "closed" : ""

    const params = new URLSearchParams()

    if (question) params.append("question", question)
    if (user_name) params.append("user_name", user_name)
    if (status_open) params.append("status_open", status_open)
    if (status_closed) params.append("status_closed", status_closed)


    if (labels.length > 0) labels.forEach(label => params.append("labels", label))

    const url = `/main/courses/${course_id}/filters?${params.toString()}`;

    window.location.href = url;

    return false

}

const handleClearFilters = async (event) => {
    event.preventDefault();

    const courseContainer = document.getElementById('courseContainer');
    const course_id = courseContainer.getAttribute('data-course-id') || ''

    window.location.href = `/main/courses/${course_id}`;
}

const setFilterFormData = () => {
    const params = new URLSearchParams(window.location.search);

    const question = params.get("question") || ""
    const user_name = params.get("user_name") || ""
    const status_open = params.get("status_open") || ""
    const status_closed = params.get("status_closed") || ""
    const labels = params.getAll("labels")
    const form = document.getElementById("filterDropdown");

    if (form) {
        if (form.question && question.length > 0) form.question.value = question
        if (form.user_name && user_name.length > 0) form.user_name.value = user_name
        if (form.status_open) form.status_open.checked = (status_open === "open")
        if (form.status_closed) form.status_closed.checked = (status_closed === "closed")

        labels.forEach(label => {
            const checkbox = form.querySelector(`input[name="labels[]"][value="${label}"]`)
            if (checkbox) checkbox.checked = true
        });
    }
};

