import * as usersData from "../data/users.js";
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

router.route("/profile").patch(async (req, res) => {

    let updateProfile = {};
    const user = req.session.user;
    const userId = validator.isValidMongoId(user.id)
    let { first_name, last_name, email, password } = req.body;

    try {
        if (first_name) {
            first_name = validator.isValidString(first_name);
            updateProfile.first_name = first_name;
        }
        if (last_name) {
            last_name = validator.isValidString(last_name);
            updateProfile.last_name = last_name;
        }
        if (email) {
            email = validator.isValidEmail(email);
            updateProfile.email = email;
        }
        if (password) {
            password = validator.isValidString(password);
            updateProfile.password = password;
        }
    } catch (error) {
        return handleError(res, error);
    }

    if (Object.keys(updateProfile).length === 0) {
        return handleError(res, "No changes provided")
    }

    try {
        let userData = await usersData.updateUser(
            {
                _id: userId,
            },
            updateProfile
        );

        req.session.user = {
            id: userData._id,
            first_name: userData.first_name,
            last_name: userData.last_name,
            email: userData.email,
            role: userData.role,
            status: userData.status,
        };

        return res.status(200).json({ message: "Updated profile successfully!" });
    } catch (error) {
        return handleError(res, error);
    }
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
            first_name: userData.first_name,
            last_name: userData.last_name,
            email: userData.email,
            role: userData.role,
            status: userData.status,
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

router.route("/students/:id").patch(async(req,res) => {
    let studentId = req.params.id;
    let reqBody = req.body;
    try {
        studentId = validator.isValidMongoId(studentId);
        if (reqBody.role){
            reqBody.role = validator.isValidString(reqBody.role);
            if (reqBody.role !== 'student' && reqBody.role !== 'ta') {
                throw new Error("the role MUST be eithr a student OR ta");
            }
        }

        if (reqBody.status){
            reqBody.status = validator.isValidString(reqBody.status);
            if (reqBody.status !== 'active' && reqBody.status !== 'inactive'){
                throw new Error("the status MUST be either active OR inactive")
            }
        }
        if (!reqBody.role && !reqBody.status) {
                throw new Error("Must be values used to update all of the fields")    
        }
    }
    catch(e){
        console.log(e);
        return handleError(res, e);
    }
    try{
        //filter & obj are params of updateUser();
        const filter = { _id: studentId };
        const obj = {};
        if (reqBody.role){ 
            obj.role = reqBody.role;}
        if (reqBody.status) {
            obj.status = reqBody.status;
        }
        const updatedUser = await usersData.updateUser(filter, obj);
        return res.status(200).json({ 
            message: "Updated the student successfully!!"
        });
    }
    catch (e) {
        if (e.status) {
            return handleError(res, e.message);
        }
        return handleError(res, e);
    }

});

router.route("/students/:id").delete(async (req, res) => {
     let studentId = req.params.id;
    let reqBody = req.body;
    try {
        studentId = validator.isValidMongoId(studentId);
    }
    catch(e){
        console.log(e);
        return handleError(res, e);
    }
      try {
        await usersData.deleteUser(studentId);
        
        return res.status(200).json({ 
            message: "Student was deleted!"
        });
    } catch (e) {
        return handleError(res, e);
    }
});



export default router;

