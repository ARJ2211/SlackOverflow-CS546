import * as usersData from "../mongoUtils/usersUtils.js";
import * as validator from "../utils/validator.js";
import { handleError } from "../utils/helperFunctions.js";
import { Router } from "express";

const router = Router();

router.route("/").get(async (req, res) => {
    const allUsers = await usersData.getAllUsers();
    return res.status(200).json(allUsers);
});

router.route("/professors").get(async (req, res) => {
    const allProfessors = await usersData.getAllProfessors();
    return res.status(200).json(allProfessors);
});

router.route("/students").get(async (req, res) => {
    const allStudents = await usersData.getAllStudents();
    return res.status(200).json(allStudents);
});

router.route("/tas").get(async (req, res) => {
    const allTas = await usersData.getAllTas();
    return res.status(200).json(allTas);
});

router.route("/sign-in").post(async (req, res) => {
    let reqBody = req.body;
    try {
        reqBody = validator.isValidObject(reqBody);
        reqBody.email = validator.isValidEmail(reqBody.email);
        reqBody.password = validator.isValidString(reqBody.password);
    } catch (e) {
        console.log(e);
        return handleError(res, e);
    }

    try {
        const userData = await usersData.getUserByEmail(reqBody.email);
        if (userData.status === "inactive") {
            return handleError(res, "User is not active, please sign up!");
        }
        if (userData.password !== reqBody.password) {
            return handleError(res, "Password is incorrect. Try again");
        }

        req.session.user = {
            id: userData._id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
        };

        return res.status(200).json({ message: `Signing in as role: ${userData.role}` });
    } catch (e) {
        console.log(e);
        if (e.status) {
            return handleError(res, e.message);
        }
        return handleError(res, e);
    }
});

router.route("/sign-up").post(async (req, res) => {
    let reqBody = req.body;
    try {
        reqBody = validator.isValidObject(reqBody);
        reqBody.email = validator.isValidEmail(reqBody.email);
        reqBody.password = validator.isValidString(reqBody.password);
    } catch (e) {
        return handleError(res, e);
    }

    try {
        let userData = await usersData.getUserByEmail(reqBody.email);
        if (userData.status === "active") {
            return handleError(res, "Account already exists please sign in");
        }

        userData = await usersData.updateUser(
            {
                email: new RegExp(`^${reqBody.email}$`),
            },
            { password: reqBody.password }
        );

        if (!userData.otp) {
            const updatedData = await usersData.sendSaveOTP(reqBody.email);
            return res.status(200).json(updatedData);
        }
        return res.status(200).json({ email: userData.email, status: userData.status });
    } catch (e) {
        console.log(e);
        if (e.status) {
            return handleError(res, e.message);
        }
        return handleError(res, e);
    }
});

router.route("/verify-otp").post(async (req, res) => {
    let reqBody = req.body;
    try {
        reqBody = validator.isValidObject(reqBody);
        reqBody.email = validator.isValidEmail(reqBody.email);
        reqBody.otp = validator.isValidNumber(reqBody.otp);
    } catch (e) {
        console.log(e);
        return handleError(res, e);
    }
    try {
        const userData = await usersData.getUserByEmail(reqBody.email);
        if (userData.status === "active") {
            return handleError(res, "User is already active");
        }
        if (userData.otp === reqBody.otp) {
            const updatedData = await usersData.updateUser(
                {
                    email: new RegExp(`^${reqBody.email}$`, "i"),
                },
                { status: "active" }
            );
            return res.status(200).json(updatedData);
        } else {
            return handleError(res, "Invalid OTP entered");
        }
    } catch (e) {
        console.log(e);
        if (e.status) {
            return handleError(res, e.message);
        }
        return handleError(res, e);
    }
});

export default router;
