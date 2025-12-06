let quill;

const handleSaveQuestion = (event) => {
    event.preventDefault()

    const mainContainer = document.getElementById('mainContainer');
    const courseContainer = document.getElementById('courseContainer');

    const user = JSON.parse(mainContainer.getAttribute('data-user') || '{}');
    const course_id = courseContainer.getAttribute('data-course-id') || ''
    const labelNodes = document.querySelectorAll('input[name="label"]:checked')
    const labels = Array.from(labelNodes).map((item) => item.value)

    const quillContent = quill.root.innerHTML.trim();
    const quillText = quill.getText().trim();

    if (quillText.length === 0 || quillContent.length === 0 || quillContent === '<p><br></p>') {
        showToast("Question content cannot be empty.", "error")
        return false
    }

    const quillDelta = quill.getContents()

    const question = quillText


    const button = event.target.querySelector("button[type='submit']")
    button.disabled = true
    button.innerText = "Submitting..."

    let body = {}

    body.labels = labels;
    body.course_id = course_id;
    body.question = question;
    body.question_delta = JSON.stringify(quillDelta)
    body.question_content = quillContent;
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
                button.innerHTML = `<div>Ask question</div>
                        <svg class="shrink-0 size-3.5 pointer-events-none " xmlns="http://www.w3.org/2000/svg"
                            width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path
                                d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z" />
                        </svg>`
                return
            }

            showToast("Question created successfully!", "success")
            button.disabled = false
            button.innerText = "Ask question"

            setTimeout(() => {
                window.location.reload()
            }, 500)
        })
        .catch((err) => {
            console.error("handleAddQuestion error:", err)
            showToast("Server error. Please try again.", "error")
            button.disabled = false
            button.innerText = "Ask question"
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
    const filterDropdown = document.getElementById("filterDropdown")

    const filterBtn = document.getElementById("openFilter")
    if (!filterDropdown.contains(event.target) && event.target !== filterBtn) {
        filterDropdown.classList.add("opacity-0", "scale-95", "pointer-events-none")
    }

    const labelsDropdown = document.getElementById("labelsDropdown");
    const labelsDropdownBtn = document.getElementById("openLabelsDropdown");
    if (labelsDropdown && !labelsDropdown.contains(event.target) && event.target !== labelsDropdownBtn) {
        labelsDropdown.classList.add("hidden", "scale-95", "pointer-events-none");
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

    try {
        const response = await fetch(url, {
            method: "GET"
        });

        if (response.status !== 200) {
            const data = await response.json();
            showToast(data.message || "Unknown error in apply filters", "error");
            return;
        }

        window.location.href = url;

    } catch (err) {
        console.error("handleApplyFilters error:", err);
        showToast("Server error. Please try again.", "error");
    }

    return false;


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

const handleQuillSetup = () => {
    quill = new Quill('#questionEditor', {
        theme: 'snow',
        modules: {
            toolbar: '#toolbar'
        },
        placeholder: 'Type your question here...'
    });

    const editor = document.getElementById('questionEditor');
    const handle = document.getElementById("questionResizeHandle");
    let valueY, valueH;
    handle.onmousedown = e => {
        valueY = e.clientY;
        valueH = editor.offsetHeight;
        document.onmousemove = e => {
            editor.style.height = (valueH + (valueY - e.clientY)) < 32 ? valueH : (valueH + (valueY - e.clientY)) + "px";
            quill.root.style.minHeight = editor.style.height
        };
        document.onmouseup = () => document.onmousemove = null;
    };
}

const handleLabelsDropdown = (event) => {
    const labelsDropdown = document.getElementById("labelsDropdown")
    if (!labelsDropdown) return
    const isClosed = labelsDropdown.classList.contains("hidden", "pointer-events-none")
    if (isClosed) {
        labelsDropdown.classList.remove("hidden", "scale-95", "pointer-events-none")
    } else {
        labelsDropdown.classList.add("hidden", "scale-95", "pointer-events-none")
    }
};

const handleLabelsCheckbox = (event) => {
    const checkedCheckboxes = document.querySelectorAll('input[name="label"]');
    checkedCheckboxes.forEach(function (checkbox) {

        let labelTagsContainer = document.getElementById("labelTags")
        if (checkbox.checked) {
            if (!labelTagsContainer.querySelector(`#label-${checkbox.value}`)) {
                let label = document.createElement("div")
                label.id = "label-" + checkbox.value;
                label.className = " text-sm border border-white font-medium rounded-3xl pl-2 pr-1 text-white bg-[#F0BD66]  flex gap-1 "
                label.innerHTML = `
                <span>${checkbox.getAttribute('data-label')}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                    class="size-5 hover:text-slate-100 hover:cursor-pointer" onclick="removeLabel(event)">
                    <path fill-rule="evenodd"
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z"
                        clip-rule="evenodd" />
                </svg>
                `
                labelTagsContainer.appendChild(label)
            }
        } else {
            if (labelTagsContainer.querySelector(`#label-${checkbox.value}`)) {
                labelTagsContainer.removeChild(labelTagsContainer.querySelector(`#label-${checkbox.value}`))
            }
        }
    })
}

const removeLabel = (event) => {
    let labelTagsContainer = document.getElementById("labelTags")
    let labelTag = event.currentTarget.parentElement;
    let labelId = labelTag.id.replace("label-", "");
    let checkbox = document.getElementById(labelId);
    if (checkbox) {
        checkbox.checked = false;
    }
    labelTagsContainer.removeChild(labelTag);
}

handleQuillSetup()/**
 * Handle toggling bookmark for a question
 * @param {string} questionId - The ID of the question
 * @param {HTMLElement} buttonElement - The button element that triggered the action
 * @param {Event} event - The click event
 */
const handleToggleBookmark = async (questionId, buttonElement, event) => {
    // Prevent event from bubbling up to the parent link
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    // Check if currently bookmarked by checking button classes
    const isBookmarked = buttonElement.classList.contains('bg-[#F0BD66]');

    // Disable button and show loading state
    const originalButtonHTML = buttonElement.innerHTML;
    buttonElement.disabled = true;
    buttonElement.innerHTML = `
        <svg class="animate-spin size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        ${isBookmarked ? 'Removing...' : 'Adding...'}
    `;

    try {
        const method = isBookmarked ? 'DELETE' : 'POST';
        let url, options;

        if (method === 'POST') {
            // POST /questions/bookmarks - send question_id in body
            url = '/questions/bookmarks';
            options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question_id: questionId })
            };
        } else {
            // DELETE /questions/bookmarks/:id - questionId in URL
            url = `/questions/bookmarks/${questionId}`;
            options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
        }

        const response = await fetch(url, options);

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response:', text);
            throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
        }

        const data = await response.json();

        if (response.status !== 200) {
            throw new Error(data.message || `Failed to ${isBookmarked ? 'remove' : 'add'} bookmark`);
        }

        // Show success message
        showToast(data.message || `Bookmark ${isBookmarked ? 'removed' : 'added'} successfully`, 'success');

        // Update button UI
        if (isBookmarked) {
            // Change to "not bookmarked" state
            buttonElement.classList.remove('bg-[#F0BD66]', 'hover:bg-[#e3aa4e]', 'text-white');
            buttonElement.classList.add('bg-gray-200', 'hover:bg-gray-300', 'text-gray-700');
            buttonElement.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                </svg>
                Bookmark
            `;
            buttonElement.title = "Add bookmark";
        } else {
            // Change to "bookmarked" state
            buttonElement.classList.remove('bg-gray-200', 'hover:bg-gray-300', 'text-gray-700');
            buttonElement.classList.add('bg-[#F0BD66]', 'hover:bg-[#e3aa4e]', 'text-white');
            buttonElement.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4">
                    <path fill-rule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clip-rule="evenodd" />
                </svg>
                Bookmarked
            `;
            buttonElement.title = "Remove bookmark";
        }

        buttonElement.disabled = false;

    } catch (error) {
        console.error('Error toggling bookmark:', error);
        showToast(error.message || `Failed to ${isBookmarked ? 'remove' : 'add'} bookmark. Please try again.`, 'error');

        // Re-enable button and restore original state
        buttonElement.disabled = false;
        buttonElement.innerHTML = originalButtonHTML;
    }
};
