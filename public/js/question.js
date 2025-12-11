let answerQuill;
let updateQuestionQuill;
let updateAnswerQuill;

const handleInputFieldQuillSetup = () => {
    answerQuill = new Quill("#answerEditor", {
        theme: "snow",
        modules: {
            toolbar: "#toolbar",
        },
        placeholder: "Type your comment here...",
    });

    const editor = document.getElementById("answerEditor");
    const handle = document.getElementById("answerResizeHandle");
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

const handleOutsideClick = (event) => {
    document.querySelectorAll(".actionContainer").forEach((container) => {
        const actionsDropdown = container.querySelector(".actionsDropdown");
        const actionsDropdownBtn = container.querySelector(
            ".openActionsDropdown"
        );

        if (
            actionsDropdown &&
            !actionsDropdown.contains(event.target) &&
            event.target !== actionsDropdownBtn
        ) {
            actionsDropdown.classList.add(
                "hidden",
                "scale-95",
                "pointer-events-none"
            );
        }
    });

    const questionActionsDropdown = document.getElementById(
        "questionActionsDropdown"
    );
    const questionActionsDropdownBtn = document.getElementById(
        "openQuestionActionsDropdown"
    );
    if (
        questionActionsDropdown &&
        !questionActionsDropdown.contains(event.target) &&
        event.target !== questionActionsDropdownBtn
    ) {
        questionActionsDropdown.classList.add(
            "hidden",
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

const handleActionsDropdown = (id) => {
    const actionsDropdown = document.getElementById(id);
    if (!actionsDropdown) return;
    const isClosed = actionsDropdown.classList.contains(
        "hidden",
        "pointer-events-none"
    );
    if (isClosed) {
        actionsDropdown.classList.remove(
            "hidden",
            "scale-95",
            "pointer-events-none"
        );
    } else {
        actionsDropdown.classList.add(
            "hidden",
            "scale-95",
            "pointer-events-none"
        );
    }
};

const handleQuestionActionsDropdown = (event) => {
    const questionActionsDropdown = document.getElementById(
        "questionActionsDropdown"
    );
    if (!questionActionsDropdown) return;
    const isClosed = questionActionsDropdown.classList.contains(
        "hidden",
        "pointer-events-none"
    );
    if (isClosed) {
        questionActionsDropdown.classList.remove(
            "hidden",
            "scale-95",
            "pointer-events-none"
        );
    } else {
        questionActionsDropdown.classList.add(
            "hidden",
            "scale-95",
            "pointer-events-none"
        );
    }
};

const handleUpdateQuestionModal = () => {
    const modal = document.getElementById("updateQuestionModal");
    if (modal) {
        if (modal.classList.contains("hidden")) {
            modal.classList.remove("hidden");
            if (!updateQuestionQuill) {
                updateQuestionQuill = new Quill("#updateQuestionEditor", {
                    theme: "snow",
                    modules: {
                        toolbar: "#updateQuestionToolbar",
                    },
                    placeholder: "Type your comment here...",
                });
            }
            const questionTag = document.getElementById("questionDisplay");

            const questionDelta = JSON.parse(questionTag.dataset.question);
            const questionObj = JSON.parse(questionTag.dataset.question_obj);
            resetLabels();
            addLabels(questionObj.labels);
            updateQuestionQuill.setContents(questionDelta);

            const editor = document.getElementById("updateQuestionEditor");
            const handle = document.getElementById(
                "updateQuestionResizeHandle"
            );
            let valueY, valueH;
            handle.onmousedown = (e) => {
                valueY = e.clientY;
                valueH = editor.offsetHeight;
                document.onmousemove = (e) => {
                    editor.style.height =
                        valueH + (valueY - e.clientY) < 32
                            ? valueH
                            : valueH + (valueY - e.clientY) + "px";
                    updateQuestionQuill.root.style.minHeight =
                        editor.style.height;
                };
                document.onmouseup = () => (document.onmousemove = null);
            };
        } else {
            modal.classList.add("hidden");
            if (updateQuestionQuill) {
                updateQuestionQuill.setContents([]);
            }
        }
    }
};

const handleUpdateAnswerModal = (answer) => {
    const modal = document.getElementById("updateAnswerModal");
    if (modal) {
        if (modal.classList.contains("hidden")) {
            modal.classList.remove("hidden");
            if (!updateAnswerQuill) {
                updateAnswerQuill = new Quill("#updateAnswerEditor", {
                    theme: "snow",
                    modules: {
                        toolbar: "#updateAnswerToolbar",
                    },
                    placeholder: "Type your comment here...",
                });
            }
            modal.setAttribute("data-answer-id", JSON.stringify(answer._id));
            const answerDelta = JSON.parse(answer.answer_delta);

            updateAnswerQuill.setContents(answerDelta);

            const editor = document.getElementById("updateAnswerEditor");
            const handle = document.getElementById("updateAnswerResizeHandle");
            let valueY, valueH;
            handle.onmousedown = (e) => {
                valueY = e.clientY;
                valueH = editor.offsetHeight;
                document.onmousemove = (e) => {
                    editor.style.height =
                        valueH + (valueY - e.clientY) < 32
                            ? valueH
                            : valueH + (valueY - e.clientY) + "px";
                    updateAnswerQuill.root.style.minHeight =
                        editor.style.height;
                };
                document.onmouseup = () => (document.onmousemove = null);
            };
        } else {
            modal.classList.add("hidden");
            if (updateAnswerQuill) {
                updateAnswerQuill.setContents([]);
            }
        }
    }
};

const handleQuestionViewQuillSetup = () => {
    const questionCards = document.querySelectorAll(".questionContainer");

    questionCards.forEach((questionCard) => {
        const questionDelta = JSON.parse(questionCard.dataset.question);
        const questionEditor = document.createElement("div");
        questionEditor.classList.add("text-sm");

        questionCard.appendChild(questionEditor);

        const questionViewQuill = new Quill(questionEditor, {
            theme: "snow",
            readOnly: true,
            modules: { toolbar: false },
        });

        questionViewQuill.setContents(questionDelta);
    });
};

const handleAnswerViewQuillSetup = () => {
    const answerCards = document.querySelectorAll(".answerContainer");
    answerCards.forEach((answerCard) => {
        const answerDelta = JSON.parse(answerCard.dataset.answer);
        const answerEditor = document.createElement("div");
        answerEditor.classList.add("text-sm");

        answerCard.appendChild(answerEditor);

        const answerViewQuill = new Quill(answerEditor, {
            theme: "snow",
            readOnly: true,
            modules: { toolbar: false },
        });
        answerViewQuill.setContents(answerDelta);
    });
};

const handleUpdateUpVote = (event) => {
    event.preventDefault();

    const mainContainer = document.getElementById("mainContainer");
    const questionContainer = document.getElementById("questionContainer");

    const user = JSON.parse(mainContainer.getAttribute("data-user") || "{}");
    const question_id =
        questionContainer.getAttribute("data-question-id") || "";

    fetch(`/questions/${question_id}/votes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
    })
        .then(async (res) => {
            const responseBody = await res.json();
            return { status: res.status, body: responseBody };
        })
        .then(({ status, body }) => {
            if (status !== 200) {
                showToast(body.message || "Unknown error.", "error");
                return;
            }

            showToast("vote updated successfully!", "success");

            setTimeout(() => {
                window.location.reload();
            }, 500);
        })
        .catch((err) => {
            console.error("handleUpdateUpVote error:", err);
            showToast("Server error. Please try again.", "error");
        });

    return false;
};

const handleUpdateStatus = (event) => {
    event.preventDefault();

    const questionContainer = document.getElementById("questionContainer");

    const question_id =
        questionContainer.getAttribute("data-question-id") || "";

    const statusCheckbox = event.target;
    const newStatus = statusCheckbox.checked ? "open" : "closed";

    fetch(`/questions/${question_id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
    })
        .then(async (res) => {
            const responseBody = await res.json();
            return { status: res.status, body: responseBody };
        })
        .then(({ status, body }) => {
            if (status !== 200) {
                showToast(body.message || "Unknown error.", "error");
                statusCheckbox.checked = !statusCheckbox.checked;
                return;
            }

            showToast("Status updated successfully!", "success");

            setTimeout(() => {
                window.location.reload();
            }, 500);
        })
        .catch((err) => {
            console.error("handleUpdateStatus error:", err);
            showToast("Server error. Please try again.", "error");
            statusCheckbox.checked = !statusCheckbox.checked;
        });

    return false;
};

const handleSaveAnswer = (event) => {
    event.preventDefault();

    const mainContainer = document.getElementById("mainContainer");
    const questionContainer = document.getElementById("questionContainer");

    const user = JSON.parse(mainContainer.getAttribute("data-user") || "{}");
    const question_id =
        questionContainer.getAttribute("data-question-id") || "";
    const question_status =
        questionContainer.getAttribute("data-question-status") || "";

    const quillContent = answerQuill.root.innerHTML.trim();
    const quillText = answerQuill.getText().trim();

    if (
        quillText.length === 0 ||
        quillContent.length === 0 ||
        quillContent === "<p><br></p>"
    ) {
        showToast("Answer content cannot be empty.", "error");
        return false;
    }

    const quillDelta = answerQuill.getContents();

    const answer = quillText;

    const button = event.target.querySelector("button[type='submit']");
    button.disabled = true;
    button.innerText = "Submitting...";

    let body = {};

    body.answer = answer;
    body.answer_delta = JSON.stringify(quillDelta);
    body.answer_content = quillContent;
    body.question_id = question_id;
    body.user_id = user.id;
    body.question_status = question_status;
    body.is_accepted = false;

    fetch(`/answers`, {
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
                button.innerHTML = `<div>Comment</div>
                        <svg class="shrink-0 size-3.5 pointer-events-none " xmlns="http://www.w3.org/2000/svg"
                            width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path
                                d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z" />
                        </svg>`;
                return;
            }

            showToast("Answer created successfully!", "success");
            button.disabled = false;
            button.innerText = "Comment";

            setTimeout(() => {
                window.location.reload();
            }, 500);
        })
        .catch((err) => {
            console.error("handleAddAnswer error:", err);
            showToast("Server error. Please try again.", "error");
            button.disabled = false;
            button.innerText = "Comment";
        });

    return false;
};

const handleDeleteAnswer = (answer_id) => {
    const mainContainer = document.getElementById("mainContainer");
    const questionContainer = document.getElementById("questionContainer");

    const user = JSON.parse(mainContainer.getAttribute("data-user") || "{}");
    const question_id =
        questionContainer.getAttribute("data-question-id") || "";

    fetch(`/answers/${answer_id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, question_id }),
    })
        .then(async (res) => {
            const responseBody = await res.json();
            return { status: res.status, body: responseBody };
        })
        .then(({ status, body }) => {
            if (status !== 200) {
                showToast(body.message || "Unknown error.", "error");
                return;
            }

            showToast("Answer deleted successfully!", "success");

            setTimeout(() => {
                window.location.reload();
            }, 500);
        })
        .catch((err) => {
            console.error("handleDeleteAnswer error:", err);
            showToast("Server error. Please try again.", "error");
        });

    return false;
};

const handleDeleteQuestion = (event) => {
    event.preventDefault();

    const mainContainer = document.getElementById("mainContainer");
    const questionContainer = document.getElementById("questionContainer");

    const user = JSON.parse(mainContainer.getAttribute("data-user") || "{}");
    const question_id =
        questionContainer.getAttribute("data-question-id") || "";
    const course_id = questionContainer.getAttribute("data-course-id") || "";

    fetch(`/questions/${question_id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
    })
        .then(async (res) => {
            const responseBody = await res.json();
            return { status: res.status, body: responseBody };
        })
        .then(({ status, body }) => {
            if (status !== 200) {
                showToast(body.message || "Unknown error.", "error");
                return;
            }

            showToast("Question deleted successfully!", "success");

            setTimeout(() => {
                window.location.href = `/main/courses/${course_id}`;
            }, 500);
        })
        .catch((err) => {
            console.error("handleDeleteQuestion error:", err);
            showToast("Server error. Please try again.", "error");
        });

    return false;
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

const addLabels = (labelsArray) => {
    const labelTagsContainer = document.getElementById("labelTags");
    labelsArray.forEach((label) => {
        if (document.getElementById(`label-${label._id}`)) return;

        const labelTag = document.createElement("div");
        labelTag.id = "label-" + label._id;
        labelTag.className =
            "text-sm border border-white font-medium rounded-3xl pl-2 pr-1 text-white bg-[#F0BD66] flex gap-1";

        labelTag.innerHTML = `
            <span>${label.name}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                class="size-5 hover:text-slate-100 hover:cursor-pointer" onclick="removeLabel(event)">
                <path fill-rule="evenodd"
                    d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z"
                    clip-rule="evenodd" />
            </svg>
        `;

        labelTagsContainer.appendChild(labelTag);

        const checkbox = document.getElementById(label._id);
        if (checkbox) checkbox.checked = true;
    });
};

const resetLabels = () => {
    const labelTagsContainer = document.getElementById("labelTags");
    labelTagsContainer.innerHTML = "";
    document.querySelectorAll('input[name="label"]').forEach((checkBox) => {
        checkBox.checked = false;
    });
};

const handleUpdateQuestion = (event) => {
    event.preventDefault();

    const mainContainer = document.getElementById("mainContainer");
    const questionContainer = document.getElementById("questionContainer");

    const user = JSON.parse(mainContainer.getAttribute("data-user") || "{}");
    const question_id =
        questionContainer.getAttribute("data-question-id") || "";
    const labelNodes = document.querySelectorAll('input[name="label"]:checked');
    const labels = Array.from(labelNodes).map((item) => item.value);

    const quillContent = updateQuestionQuill.root.innerHTML.trim();
    const quillText = updateQuestionQuill.getText().trim();

    if (
        quillText.length === 0 ||
        quillContent.length === 0 ||
        quillContent === "<p><br></p>"
    ) {
        showToast("Question content cannot be empty.", "error");
        return false;
    }

    const quillDelta = updateQuestionQuill.getContents();

    const question = quillText;

    const button = event.target.querySelector("button[type='submit']");
    button.disabled = true;
    button.innerText = "Submitting...";

    let body = {};

    body.question = question;
    body.question_delta = JSON.stringify(quillDelta);
    body.question_content = quillContent;
    body.user_id = user.id;
    body.labels = labels;

    fetch(`/questions/${question_id}`, {
        method: "PATCH",
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
                button.innerHTML = `<div>update question</div>
                        <svg class="shrink-0 size-3.5 pointer-events-none " xmlns="http://www.w3.org/2000/svg"
                            width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path
                                d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z" />
                        </svg>`;
                return;
            }

            handleUpdateQuestionModal();

            showToast("Question updated successfully!", "success");
            button.disabled = false;
            button.innerText = "update question";

            setTimeout(() => {
                window.location.reload();
            }, 500);
        })
        .catch((err) => {
            console.error("handleUpdateQuestion error:", err);
            showToast("Server error. Please try again.", "error");
            button.disabled = false;
            button.innerText = "update question";
        });

    return false;
};

const handleUpdateAnswer = (event) => {
    event.preventDefault();

    const mainContainer = document.getElementById("mainContainer");
    const updateAnswerModal = document.getElementById("updateAnswerModal");
    const questionContainer = document.getElementById("questionContainer");

    const question_id =
        questionContainer.getAttribute("data-question-id") || "";
    const user = JSON.parse(mainContainer.getAttribute("data-user") || "{}");
    const answer_id =
        JSON.parse(updateAnswerModal.getAttribute("data-answer-id")) || "";

    const quillContent = updateAnswerQuill.root.innerHTML.trim();
    const quillText = updateAnswerQuill.getText().trim();

    if (
        quillText.length === 0 ||
        quillContent.length === 0 ||
        quillContent === "<p><br></p>"
    ) {
        showToast("Answer content cannot be empty.", "error");
        return false;
    }

    const quillDelta = updateAnswerQuill.getContents();

    const answer = quillText;

    const button = event.target.querySelector("button[type='submit']");
    button.disabled = true;
    button.innerText = "Submitting...";

    let body = {};

    if (answer) {
        body.answer = answer;
        body.answer_delta = JSON.stringify(quillDelta);
        body.answer_content = quillContent;
    }

    body.question_id = question_id;
    body.user_id = user.id;

    fetch(`/answers/${answer_id}`, {
        method: "PATCH",
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
                button.innerHTML = `<div>update answer</div>
                        <svg class="shrink-0 size-3.5 pointer-events-none " xmlns="http://www.w3.org/2000/svg"
                            width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path
                                d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z" />
                        </svg>`;
                return;
            }

            showToast("Answer updated successfully!", "success");
            button.disabled = false;
            button.innerText = "update answer";

            setTimeout(() => {
                window.location.reload();
            }, 500);
        })
        .catch((err) => {
            console.error("handleUpdateAnswer error:", err);
            showToast("Server error. Please try again.", "error");
            button.disabled = false;
            button.innerText = "update answer";
        });

    return false;
};

const handleAcceptAnswer = (answer_id) => {
    const mainContainer = document.getElementById("mainContainer");
    const user = JSON.parse(mainContainer.getAttribute("data-user") || "{}");

    const questionContainer = document.getElementById("questionContainer");
    const question_id = questionContainer.getAttribute("data-question-id") || "";

    fetch(`/answers/${answer_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_id: user.id,
            is_accepted: true,
            question_id,
        }),
    })
        .then(async (res) => {
            const responseBody = await res.json();
            return { status: res.status, body: responseBody };
        })
        .then(({ status, body }) => {
            if (status !== 200) {
                showToast(body.message || "Unknown error.", "error");
                return;
            }

            showToast("Answer accepted successfully!", "success");

            setTimeout(() => {
                window.location.reload();
            }, 500);
        })
        .catch((err) => {
            console.error("handleAcceptAnswer error:", err);
            showToast("Server error. Please try again.", "error");
        });

    return false;
};

const handleRejectAnswer = (answer_id) => {
    const mainContainer = document.getElementById("mainContainer");
    const user = JSON.parse(mainContainer.getAttribute("data-user") || "{}");

    const questionContainer = document.getElementById("questionContainer");
    const question_id = questionContainer.getAttribute("data-question-id") || "";


    fetch(`/answers/${answer_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, question_id, is_accepted: false }),
    })
        .then(async (res) => {
            const responseBody = await res.json();
            return { status: res.status, body: responseBody };
        })
        .then(({ status, body }) => {
            if (status !== 200) {
                showToast(body.message || "Unknown error.", "error");
                return;
            }

            showToast("Answer rejected successfully!", "success");

            setTimeout(() => {
                window.location.reload();
            }, 500);
        })
        .catch((err) => {
            console.error("handleRejectAnswer error:", err);
            showToast("Server error. Please try again.", "error");
        });

    return false;
};

const handleToggleBookmark = (event) => {
    event.preventDefault();

    const mainContainer = document.getElementById("mainContainer");
    const questionContainer = document.getElementById("questionContainer");

    const user = JSON.parse(mainContainer.getAttribute("data-user") || "{}");
    const question_id =
        questionContainer.getAttribute("data-question-id") || "";

    fetch(`/questions/${question_id}/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
    })
        .then(async (res) => {
            const responseBody = await res.json();
            return { status: res.status, body: responseBody };
        })
        .then(({ status, body }) => {
            if (status !== 200) {
                showToast(body.message || "Unknown error.", "error");
                return;
            }

            showToast("bookmark updated successfully!", "success");

            setTimeout(() => {
                window.location.reload();
            }, 500);
        })
        .catch((err) => {
            console.error("handleToggleBookmark error:", err);
            showToast("Server error. Please try again." + err, "error");
        });

    return false;
};

handleInputFieldQuillSetup();
handleQuestionViewQuillSetup();
handleAnswerViewQuillSetup();
