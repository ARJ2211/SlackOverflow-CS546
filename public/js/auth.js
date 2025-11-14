const handleSignIn = (event) => {
    event.preventDefault();
    const email = event.target.email.value.trim();
    const password = event.target.password.value.trim();

    const button = event.target.querySelector("button[type='submit']");
    button.disabled = true;
    button.innerText = "Signing in...";

    fetch("/users/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    })
        .then(async (res) => {
            const body = await res.json();
            return { status: res.status, body };
        }
        ).then(({ status, body }) => {
            if (status !== 200) {
                showToast(body.message || "unknown error.", "error");
                button.disabled = false;
                button.innerText = "Sign In";
                return;
            }

            showToast("Login successful! Redirecting...", "success");

            setTimeout(() => {
                window.location.href = "/main/dashboard";
            }, 1200);
        })
        .catch(err => {
            console.error("handleSignIn error:", err);
            showToast("Server error. Please try again.", "error");
            button.disabled = false;
            button.innerText = "Sign In";
        });

    return false;
};

const handleSignUp = (event) => {
    event.preventDefault();

    const email = event.target.email.value.trim();
    const password = event.target.password.value.trim();

    const button = event.target.querySelector("button[type='submit']");
    button.disabled = true;
    button.innerText = "Signing up...";

    fetch("/users/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    })
        .then(async (res) => {
            const body = await res.json();
            return { status: res.status, body };
        })
        .then(({ status, body }) => {
            if (status !== 200) {
                showToast(body.message || "Unknown error.", "error");
                button.disabled = false;
                button.innerText = "Sign Up";
                return;
            }

            if (body.email && body.status === "inactive") {
                showToast("Account created! Please verify your email.", "info");
                localStorage.setItem("otpEmail", body.email);
                setTimeout(() => {
                    window.location.href = "/auth/verify-otp";
                }, 800);
            }

            showToast("Signup successful!", "success");
            button.disabled = false;
            button.innerText = "Sign Up";
        })
        .catch((err) => {

            console.error("handleSignUp error:", err);
            showToast("Server error. Please try again.", "error");
            button.disabled = false;
            button.innerText = "Sign Up";
        });

    return false;
};

const handleVerification = (event) => {
    event.preventDefault();

    const otpInputs = document.querySelectorAll(".otp-input");
    const otp = Number(Array.from(otpInputs).map(i => i.value.trim()).join(""));

    const email = localStorage.getItem("otpEmail");
    const button = event.target.querySelector("button[type='submit']");

    if (!otp || otp.length < 4) {
        showToast("Please enter the full 4-digit OTP.", "error");
        return;
    }

    button.disabled = true;
    button.innerText = "Verifying...";

    fetch("/users/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
    })
        .then(async (res) => {
            const body = await res.json();
            return { status: res.status, body };
        })
        .then(({ status, body }) => {
            if (status !== 200) {
                showToast(body.message || "Invalid or expired OTP.", "error");
                button.disabled = false;
                button.innerText = "Verify Account";
                return;
            }

            localStorage.removeItem("otpEmail");

            showToast("Verification successful! Redirecting...", "success");

            setTimeout(() => {
                window.location.href = "/auth/sign-in";
            }, 1200);
        })
        .catch(err => {
            console.error("handleVerification error:", err);
            showToast("Server error. Please try again.", "error");
            button.disabled = false;
            button.innerText = "Verify Account";
        });

    return false;
};


const showToast = (message, type = "info") => {
    const authToast = document.getElementById("auth-toast");
    const toast = document.createElement("div");
    toast.className =
        "px-5 py-3 rounded-lg shadow-md text-white text-sm flex items-center justify-between gap-4 animate-slide-in";

    if (type === "success") toast.classList.add("bg-green-500");
    else if (type === "error") toast.classList.add("bg-red-500");
    else toast.classList.add("bg-gray-700");

    toast.innerHTML = `
    <span>${message}</span>
    <button class="text-white text-lg leading-none focus:outline-none" onclick="this.parentElement.remove()">×</button>
  `;

    authToast.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("animate-slide-out");
        setTimeout(() => toast.remove(), 300);
    }, 20000);
}

const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(100%); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(100%); }
  }
  .animate-slide-in {
    animation: slideIn 0.4s ease forwards;
  }
  .animate-slide-out {
    animation: slideOut 0.3s ease forwards;
  }
`;

document.head.appendChild(style);

