let answerQuill;

const handleInputFieldQuillSetup = () => {
    answerQuill = new Quill('#answerEditor', {
        theme: 'snow',
        modules: {
            toolbar: '#toolbar'
        },
        placeholder: 'Type your comment here...'
    });

    const editor = document.getElementById('answerEditor');
    const handle = document.getElementById("answerResizeHandle");
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

const handleOutsideClick = (event) => {
    const actionsDropdown = document.getElementById("actionsDropdown");
    const actionsDropdownBtn = document.getElementById("openActionsDropdown");
    if (!actionsDropdown.contains(event.target) && event.target !== actionsDropdownBtn) {
        actionsDropdown.classList.add("hidden", "scale-95", "pointer-events-none");
    }
}


const handleActionsDropdown = (event) => {

    const actionsDropdown = document.getElementById("actionsDropdown")
    if (!actionsDropdown) return
    const isClosed = actionsDropdown.classList.contains("hidden", "pointer-events-none")
    if (isClosed) {
        actionsDropdown.classList.remove("hidden", "scale-95", "pointer-events-none")
    } else {
        actionsDropdown.classList.add("hidden", "scale-95", "pointer-events-none")
    }
};


const handleSaveAnswer = (event) => {
    event.preventDefault()

    const mainContainer = document.getElementById('mainContainer');
    const questionContainer = document.getElementById('questionContainer');

    const user = JSON.parse(mainContainer.getAttribute('data-user') || '{}');
    const question_id = questionContainer.getAttribute('data-question-id') || ''

    const quillContent = answerQuill.root.innerHTML.trim();
    const quillText = answerQuill.getText().trim();

    if (quillText.length === 0 || quillContent.length === 0 || quillContent === '<p><br></p>') {
        showToast("Answer content cannot be empty.", "error")
        return false
    }

    const quillDelta = answerQuill.getContents()

    const answer = quillText


    const button = event.target.querySelector("button[type='submit']")
    button.disabled = true
    button.innerText = "Submitting..."

    let body = {}

    body.answer = answer;
    body.answer_delta = JSON.stringify(quillDelta)
    body.answer_content = quillContent;

    body.user_id = user.id;

    body.is_accepted = false

    fetch(`/questions/${question_id}/answer`, {
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
                button.innerHTML = `<div>Comment</div>
                        <svg class="shrink-0 size-3.5 pointer-events-none " xmlns="http://www.w3.org/2000/svg"
                            width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path
                                d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z" />
                        </svg>`
                return
            }

            showToast("Answer created successfully!", "success")
            button.disabled = false
            button.innerText = "Comment"

            setTimeout(() => {
                window.location.reload()
            }, 500)
        })
        .catch((err) => {
            console.error("handleAddAnswer error:", err)
            showToast("Server error. Please try again.", "error")
            button.disabled = false
            button.innerText = "Comment"
        })

    return false
}

const handleQuestionQuillSetup = () => {
    const questionCards = document.querySelectorAll(".questionContainer")

    questionCards.forEach(questionCard => {
        const questionDelta = JSON.parse(questionCard.dataset.question)
        const questionEditor = document.createElement("div")
        questionEditor.classList.add("text-sm")

        questionCard.appendChild(questionEditor);

        const questionQuill = new Quill(questionEditor, {
            theme: "snow",
            readOnly: true,
            modules: { toolbar: false }
        });

        questionQuill.setContents(questionDelta);
    });

}

const handleAnswerQuillSetup = () => {
    const answerCards = document.querySelectorAll(".answerContainer")
    answerCards.forEach(answerCard => {
        const answerDelta = JSON.parse(answerCard.dataset.answer)
        const answerEditor = document.createElement("div")
        answerEditor.classList.add("text-sm")

        answerCard.appendChild(answerEditor);

        const answerQuill = new Quill(answerEditor, {
            theme: "snow",
            readOnly: true,
            modules: { toolbar: false }
        });
        answerQuill.setContents(answerDelta);
    });

}

const handleUpdateUpVote = (event) => {
    event.preventDefault()

    const mainContainer = document.getElementById('mainContainer');
    const questionContainer = document.getElementById('questionContainer');

    const user = JSON.parse(mainContainer.getAttribute('data-user') || '{}');
    const question_id = questionContainer.getAttribute('data-question-id') || ''

    fetch(`/questions/${question_id}/votes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id })
    })
        .then(async (res) => {
            const responseBody = await res.json()
            return { status: res.status, body: responseBody }
        })
        .then(({ status, body }) => {
            if (status !== 200) {
                showToast(body.message || "Unknown error.", "error")
                return
            }

            showToast("vote updated successfully!", "success")

            setTimeout(() => {
                window.location.reload()
            }, 500)
        })
        .catch((err) => {
            console.error("handleUpdateUpVote error:", err)
            showToast("Server error. Please try again.", "error")
        })

    return false
}


handleInputFieldQuillSetup()
handleQuestionQuillSetup()
handleAnswerQuillSetup()