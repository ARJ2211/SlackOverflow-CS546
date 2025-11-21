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
    const questions = JSON.parse(courseContainer.getAttribute('data-questions') || '[]')


    const form = event.target;
    const questionFilter = event.target.question.value.trim()
    const labelsFilter = [...form.querySelectorAll('input[name="labels[]"]:checked')].map(label => label.value)
    const userNameFilter = event.target.user.value.trim()
    const statusFilter = form.status.checked ? "open" : "closed";

    let filteredQuestions = questions.filter(question => {
        if (questionFilter && !question.question.toLowerCase().includes(questionFilter)) {
            return false
        }

        if (labelsFilter.length && !labelsFilter.every(id => question.labels.some(label => label._id === id))) {
            return false
        }

        if (userNameFilter &&
            !question.user.first_name.toLowerCase().includes(userNameFilter.toLowerCase()) &&
            !question.user.last_name.toLowerCase().includes(userNameFilter.toLowerCase())
        ) {
            return false
        }

        if (statusFilter && question.status !== statusFilter) {
            return false
        }

        return true
    });


    if (filteredQuestions.length > 0) {
        renderQuestionCards(filteredQuestions);
    } else {
        renderQuestionCards([]);
    }

}

const renderQuestionCards = (questions) => {

    const courseContainer = document.getElementById('courseContainer');

    courseContainer.innerHTML = ''

    questions.forEach(question => {

        let questionCard = `
            <a href="/main/questions/${question._id}"
                class="bg-white rounded-3xl shadow-sm py-3 px-6 border border-[#F0BD66] hover:cursor-pointer hover:bg-[#fcfaf6] hover:shadow-md">
                <div class=" flex items-center justify-between mb-2">
                    <div class="flex gap-3">
                        ${question.labels.map(label => `
                            <div class="border border-[#F0BD66] text-[#F0BD66] text-sm px-4 rounded-3xl">
                                ${label.name}
                            </div>
                        `).join('')}
                    </div>
                    <div>
                        ${question.status === "open" ? `<div class="border border-green-500 text-green-500 text-sm px-4 rounded-3xl">${question.status}</div>`
                : `<div class="border border-gray-500 text-gray-500 text-sm px-4 rounded-3xl">closed</div>`}
                    </div>
                </div>


                <div class="text-lg font-semibold text-gray-900 mb-2">
                    ${question.question}
                </div>

                <div class="flex items-center justify-between text-gray-500 text-sm">
                    <div class="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                            stroke="currentColor" class="size-4">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>

                        <span class="font-medium">${question.user.first_name} ${question.user.last_name}</span>
                        <span>asked ${question.timeAgo}</span>
                    </div>

                    <div class="flex items-center gap-6">
                        <div class="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                stroke="currentColor" class="size-4">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                            </svg>

                            <span>${question.answer_count || 0} answers</span>

                        </div>

                        <div class="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                stroke="currentColor" class="size-4">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>


                            <span>${question.views || 0} views</span>

                        </div>

                        <div class="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                stroke="currentColor" class="size-4">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
                            </svg>

                            <span>${question.votes || 0} votes</span>
                        </div>
                    </div>
                </div>
            </a>
        
        `

        courseContainer.innerHTML += questionCard
    })

}