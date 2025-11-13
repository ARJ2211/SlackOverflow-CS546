import { Router } from "express";

const router = Router();

// Sign In
router.get("/sign-in", (req, res) => {
    res.render("auth/signin", { layout: 'auth', title: 'Sign In' });
});

// Sign Out
router.get('/sign-out', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('SlackOverflowSession');
        res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.header('Pragma', 'no-cache');
        res.header('Expires', '0');
        res.redirect('/auth/sign-in');
    });
});

// Sign Up
router.get("/sign-up", (req, res) => {
    res.render("auth/signup", { layout: 'auth', title: "Sign Up" });
});

// OTP Verification
router.get("/verify-otp", (req, res) => {
    res.render("auth/verification", { layout: 'auth', title: "OTP Verification" });
});

export default router;