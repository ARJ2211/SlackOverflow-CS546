let quill;

const handleSaveQuestion = (event) => {
    event.preventDefault();
    const mainContainer = document.getElementById("mainContainer");
    const courseContainer = document.getElementById("courseContainer");

    const user = JSON.parse(mainContainer.getAttribute("data-user") || "{}");
    const course_id = courseContainer.getAttribute("data-course-id") || "";
    const labelNodes = document.querySelectorAll('input[name="label"]:checked');
    const labels = Array.from(labelNodes).map((item) => item.value);

    const quillContent = quill.root.innerHTML.trim();
    const quillText = quill.getText().trim();

    if (
        quillText.length === 0 ||
        quillContent.length === 0 ||
        quillContent === "<p><br></p>"
    ) {
        showToast("Question content cannot be empty.", "error");
        return false;
    }
    console.log(labels);
    if (labels.length === 0) {
        showToast("Labels cannot be empty, please add a label", "error");

        // open labels dropdown if it is closed
        const labelsDropdown = document.getElementById("labelsDropdown");
        const labelsDropdownBtn = document.getElementById("openLabelsDropdown");

        if (labelsDropdown) {
            labelsDropdown.classList.remove(
                "hidden",
                "scale-95",
                "pointer-events-none"
            );
        }

        // small visual hint on the button
        if (labelsDropdownBtn) {
            labelsDropdownBtn.classList.add(
                "ring-2",
                "ring-[#F0BD66]",
                "bg-[#FFF7E8]"
            );
            setTimeout(() => {
                labelsDropdownBtn.classList.remove(
                    "ring-2",
                    "ring-[#F0BD66]",
                    "bg-[#FFF7E8]"
                );
            }, 800);
            // optional: scroll into view
            labelsDropdownBtn.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }

        return false;
    }

    const quillDelta = quill.getContents();

    const question = quillText;

    const button = event.target.querySelector("button[type='submit']");
    button.disabled = true;
    button.innerText = "Submitting...";

    let body = {};

    body.labels = labels;
    body.course_id = course_id;
    body.question = question;
    body.question_delta = JSON.stringify(quillDelta);
    body.question_content = quillContent;
    body.user_id = user.id;

    fetch(`/questions/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    })
        .then(async (res) => {
            const responseBody = await res.json();
            return { status: res.status, body: responseBody };
        })
        .then(({ status, body }) => {
            if (status !== 200) {
                showToast(body.message || "Unknown error.", "error");
                button.disabled = false;
                button.innerHTML = `<div>Ask question</div>
                        <svg class="shrink-0 size-3.5 pointer-events-none " xmlns="http://www.w3.org/2000/svg"
                            width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path
                                d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z" />
                        </svg>`;
                return;
            }

            showToast("Question created successfully!", "success");
            button.disabled = false;
            button.innerText = "Ask question";

            setTimeout(() => {
                window.location.reload();
            }, 500);
        })
        .catch((err) => {
            console.error("handleAddQuestion error:", err);
            showToast("Server error. Please try again.", "error");
            button.disabled = false;
            button.innerText = "Ask question";
        });

    return false;
};

const handleFilterDropdown = (event) => {
    setFilterFormData();
    const filterDropdown = document.getElementById("filterDropdown");
    if (!filterDropdown) return;
    const isClosed = filterDropdown.classList.contains("pointer-events-none");
    if (isClosed) {
        filterDropdown.classList.remove(
            "opacity-0",
            "scale-95",
            "pointer-events-none"
        );
    } else {
        filterDropdown.classList.add(
            "opacity-0",
            "scale-95",
            "pointer-events-none"
        );
    }
};

const handleOutsideClick = (event) => {
    const filterDropdown = document.getElementById("filterDropdown");

    const filterBtn = document.getElementById("openFilter");
    if (!filterDropdown.contains(event.target) && event.target !== filterBtn) {
        filterDropdown.classList.add(
            "opacity-0",
            "scale-95",
            "pointer-events-none"
        );
    }

    const labelsDropdown = document.getElementById("labelsDropdown");
    const labelsDropdownBtn = document.getElementById("openLabelsDropdown");
    if (
        labelsDropdown &&
        !labelsDropdown.contains(event.target) &&
        event.target !== labelsDropdownBtn
    ) {
        labelsDropdown.classList.add(
            "hidden",
            "scale-95",
            "pointer-events-none"
        );
    }
};

const handleApplyFilters = async (event) => {
    event.preventDefault();

    const courseContainer = document.getElementById("courseContainer");
    const course_id = courseContainer.getAttribute("data-course-id") || "";

    const form = event.target;
    const question = event.target.question.value.trim();
    const labels = [
        ...form.querySelectorAll('input[name="labels[]"]:checked'),
    ].map((label) => label.value);
    const user_name = event.target.user_name.value.trim();
    const status_open = form.status_open.checked ? "open" : "";
    const status_closed = form.status_closed.checked ? "closed" : "";

    const params = new URLSearchParams();

    if (question) params.append("question", question);
    if (user_name) params.append("user_name", user_name);
    if (status_open) params.append("status_open", status_open);
    if (status_closed) params.append("status_closed", status_closed);

    if (labels.length > 0)
        labels.forEach((label) => params.append("labels", label));

    const url = `/main/courses/${course_id}/filters?${params.toString()}`;

    try {
        const response = await fetch(url, {
            method: "GET",
        });

        if (response.status !== 200) {
            const data = await response.json();
            showToast(
                data.message || "Unknown error in apply filters",
                "error"
            );
            return;
        }

        window.location.href = url;
    } catch (err) {
        console.error("handleApplyFilters error:", err);
        showToast("Server error. Please try again.", "error");
    }

    return false;
};

const handleClearFilters = async (event) => {
    event.preventDefault();

    const courseContainer = document.getElementById("courseContainer");
    const course_id = courseContainer.getAttribute("data-course-id") || "";

    window.location.href = `/main/courses/${course_id}`;
};

const setFilterFormData = () => {
    const params = new URLSearchParams(window.location.search);

    const question = params.get("question") || "";
    const user_name = params.get("user_name") || "";
    const status_open = params.get("status_open") || "";
    const status_closed = params.get("status_closed") || "";
    const labels = params.getAll("labels");
    const form = document.getElementById("filterDropdown");

    if (form) {
        if (form.question && question.length > 0)
            form.question.value = question;
        if (form.user_name && user_name.length > 0)
            form.user_name.value = user_name;
        if (form.status_open) form.status_open.checked = status_open === "open";
        if (form.status_closed)
            form.status_closed.checked = status_closed === "closed";

        labels.forEach((label) => {
            const checkbox = form.querySelector(
                `input[name="labels[]"][value="${label}"]`
            );
            if (checkbox) checkbox.checked = true;
        });
    }
};

const handleQuillSetup = () => {
    quill = new Quill("#questionEditor", {
        theme: "snow",
        modules: {
            toolbar: "#toolbar",
        },
        placeholder: "Type your question here...",
    });

    const editor = document.getElementById("questionEditor");
    const handle = document.getElementById("questionResizeHandle");
    let valueY, valueH;
    handle.onmousedown = (e) => {
        valueY = e.clientY;
        valueH = editor.offsetHeight;
        document.onmousemove = (e) => {
            editor.style.height =
                valueH + (valueY - e.clientY) < 32
                    ? valueH
                    : valueH + (valueY - e.clientY) + "px";
            quill.root.style.minHeight = editor.style.height;
        };
        document.onmouseup = () => (document.onmousemove = null);
    };
};

const handleLabelsDropdown = (event) => {
    const labelsDropdown = document.getElementById("labelsDropdown");
    if (!labelsDropdown) return;
    const isClosed = labelsDropdown.classList.contains(
        "hidden",
        "pointer-events-none"
    );
    if (isClosed) {
        labelsDropdown.classList.remove(
            "hidden",
            "scale-95",
            "pointer-events-none"
        );
    } else {
        labelsDropdown.classList.add(
            "hidden",
            "scale-95",
            "pointer-events-none"
        );
    }
};

const handleLabelsCheckbox = (event) => {
    const checkedCheckboxes = document.querySelectorAll('input[name="label"]');
    checkedCheckboxes.forEach(function (checkbox) {
        let labelTagsContainer = document.getElementById("labelTags");
        if (checkbox.checked) {
            if (!labelTagsContainer.querySelector(`#label-${checkbox.value}`)) {
                let label = document.createElement("div");
                label.id = "label-" + checkbox.value;
                label.className =
                    " text-sm border border-white font-medium rounded-3xl pl-2 pr-1 text-white bg-[#F0BD66]  flex gap-1 ";
                label.innerHTML = `
                <span>${checkbox.getAttribute("data-label")}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                    class="size-5 hover:text-slate-100 hover:cursor-pointer" onclick="removeLabel(event)">
                    <path fill-rule="evenodd"
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z"
                        clip-rule="evenodd" />
                </svg>
                `;
                labelTagsContainer.appendChild(label);
            }
        } else {
            if (labelTagsContainer.querySelector(`#label-${checkbox.value}`)) {
                labelTagsContainer.removeChild(
                    labelTagsContainer.querySelector(`#label-${checkbox.value}`)
                );
            }
        }
    });
};

const removeLabel = (event) => {
    let labelTagsContainer = document.getElementById("labelTags");
    let labelTag = event.currentTarget.parentElement;
    let labelId = labelTag.id.replace("label-", "");
    let checkbox = document.getElementById(labelId);
    if (checkbox) {
        checkbox.checked = false;
    }
    labelTagsContainer.removeChild(labelTag);
};

handleQuillSetup();
