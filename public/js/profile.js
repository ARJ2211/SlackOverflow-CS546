const handleEditProfileModal = () => {

    const modal = document.getElementById('editProfileModal')
    if (modal) {
        if (modal.classList.contains('hidden')) {
            modal.classList.remove('hidden')
        } else {
            modal.classList.add('hidden')
        }
    }
}


const handleUpdateProfile = (event) => {
    event.preventDefault()

    const mainContainer = document.getElementById('mainContainer');
    const user = JSON.parse(mainContainer.getAttribute('data-user') || '{}');

    const first_name = event.target.first_name.value.trim()
    const last_name = event.target.last_name.value.trim()
    const email = event.target.email.value.trim()
    const password = event.target.password.value.trim()
    const confirmPassword = event.target.confirmPassword.value.trim()

    if (password && password !== confirmPassword) {
        showToast("Passwords do not match.", "error")
        return false
    }

    const button = event.target.querySelector("button[type='submit']")
    button.disabled = true
    button.innerText = "Updating..."

    let body = {}

    if (first_name && first_name !== user.first_name) {
        body.first_name = first_name
    }

    if (last_name && last_name !== user.last_name) {
        body.last_name = last_name
    }

    if (email && email !== user.email) {
        body.email = email
    }

    if (password) {
        body.password = password
    }

    if (Object.keys(body).length === 0) {
        showToast("No changes made.", "error")
        button.disabled = false
        button.innerText = "Update"
        return
    }

    fetch(`/users/profile`, {
        method: "PATCH",
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
                button.innerText = "Update"
                return
            }

            showToast("Profile updated successfully!", "success")
            button.disabled = false
            button.innerText = "Update"

            setTimeout(() => {
                window.location.reload()
            }, 500)
        })
        .catch((err) => {
            console.error("handleUpdateProfile error:", err)
            showToast("Server error. Please try again.", "error")
            button.disabled = false
            button.innerText = "Update"
        })

    return false
}
