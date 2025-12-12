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
        body: JSON.stringify({ email, password }),
    })
        .then(async (res) => {
            const body = await res.json();
            return { status: res.status, body };
        })
        .then(({ status, body }) => {
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
        .catch((err) => {
            console.error("handleSignIn error:", err);
            showToast("Server error. Please try again.", "error");
            button.disabled = false;
            button.innerText = "Sign In";
        });

    return false;
};

const handleSignUp = (event) => {
    event.preventDefault();

    const form = event.target;
    const email = form.email.value.trim();
    const password = form.password.value.trim();
    const confirmPassword = form.confirmPassword.value.trim();

    // front-end confirm password check
    if (!password || !confirmPassword) {
        showToast("Password and Confirm Password are required.", "error");
        return false;
    }

    if (password !== confirmPassword) {
        showToast("Passwords do not match.", "error");
        return false;
    }

    const button = form.querySelector("button[type='submit']");
    button.disabled = true;
    button.innerText = "Signing up...";

    fetch("/users/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    })
        .then(async (res) => {
            const body = await res.json();
            return { status: res.status, body };
        })
        .then(({ status, body }) => {
            if (status !== 200) {
                showToast(
                    "No such user found. If you are a student please ask a professor to add you in a course" ||
                        "Unknown error.",
                    "error"
                );
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
                return;
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
    const otp = Number(
        Array.from(otpInputs)
            .map((i) => i.value.trim())
            .join("")
    );

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
        body: JSON.stringify({ email, otp }),
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
        .catch((err) => {
            console.error("handleVerification error:", err);
            showToast("Server error. Please try again.", "error");
            button.disabled = false;
            button.innerText = "Verify Account";
        });

    return false;
};
