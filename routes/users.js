import * as usersData from "../mongoUtils/usersUtils.js";
import * as validator from "../validator.js";

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
        reqBody.passowrd = validator.isValidString(reqBody.password);
    } catch (e) {
        console.log(e);
        return res.status(400).send(e);
    }

    try {
        const userData = await usersData.getUserByEmail(reqBody.email);
        if (userData.status === "inactive") {
            return res.status(400).send("User is not active, please sign up!");
        }
        if (userData.password !== reqBody.passowrd) {
            return res.status(400).send("Password is incorrect. Try again");
        }

        return res.status(200).send(`Signing in as role: ${userData.role}`);
    } catch (e) {
        console.log(e);
        if (e.status) {
            return res.status(e.status).send(e.message);
        }
        return res.status(400).send(e);
    }
});

router.route("/sign-up").post(async (req, res) => {
    let reqBody = req.body;
    try {
        reqBody = validator.isValidObject(reqBody);
        reqBody.email = validator.isValidEmail(reqBody.email);
        reqBody.passowrd = validator.isValidString(reqBody.password);
    } catch (e) {
        return res.status(400).send(e);
    }

    try {
        const userData = await usersData.getUserByEmail(reqBody.email);
        if (userData.status === "active") {
            return res
                .status(400)
                .send("Account already exists please sign in");
        }

        await usersData.updateUser(
            {
                email: new RegExp(`^${reqBody.email}$`),
            },
            { password: reqBody.passowrd }
        );

        if (!userData.otp) {
            const updatedData = await usersData.sendSaveOTP(reqBody.email);
            return res.status(200).json(updatedData);
        }
        return res.status(200).json(userData);
    } catch (e) {
        console.log(e);
        if (e.status) {
            return res.status(e.status).send(e.message);
        }
        return res.status(400).send(e);
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
        return res.status(400).send(e);
    }
    try {
        const userData = await usersData.getUserByEmail(reqBody.email);
        if (userData.status === "active") {
            return res.status(400).send("User is already active");
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
            return res.status(400).send("Invalid OTP entered");
        }
    } catch (e) {
        console.log(e);
        if (e.status) {
            return res.status(e.status).send(e.message);
        }
        return res.status(400).send(e);
    }
});

export default router;
