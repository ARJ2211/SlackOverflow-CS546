import { Router } from "express";

const router = Router();

// Sign In
router.get("/sign-in", (req, res) => {
    res.render("auth/signin", {
        title: "Sign In"
    });
});

// Sign Up
router.get("/sign-up", (req, res) => {
    res.render("auth/signup", {
        title: "Sign Up"
    });
});

// OTP Verification
router.get("/verify-otp", (req, res) => {
    res.render("auth/verification", {
        title: "OTP Verification"
    });
});

export default router;