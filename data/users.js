import { users } from "../config/mongoCollections.js";
import { sendOTPEmail } from "../processes/generateOTP.js";
import * as validator from "../utils/validator.js";

/**
 * Creates a new user document
 * @param {*} first_name
 * @param {*} last_name
 * @param {*} email
 * @param {*} role
 * @returns {Object}
 */
export const createUser = async (first_name, last_name, email, role) => {
    const usersColl = await users();

    try {
        first_name = validator.isValidString(first_name);
        last_name = validator.isValidString(last_name);
        email = validator.isValidEmail(email);
        role = validator.isValidRole(role);
    } catch (e) {
        throw { status: 400, message: e };
    }

    const exists = await usersColl.findOne({
        $or: [{ email: new RegExp(`^${email}$`, "i") }],
    });
    if (exists) {
        throw `409 user already exists. ${exists.first_name}`;
    }
    const insertInfo = await usersColl.insertOne({
        first_name,
        last_name,
        email,
        status: "inactive",
        role: role,
        otp: null,
        password: null,
    });

    if (!insertInfo.insertedId) {
        throw `500 failed to create user!`;
    }

    const newUser = await usersColl.findOne({
        _id: insertInfo.insertedId,
    });
    return newUser;
};

/**
 * Updates the user document and returns the updated
 * document back
 * @param {*} filter
 * @param {*} obj
 */
export const updateUser = async (filter, obj) => {
    const usersColl = await users();
    filter = validator.isValidObject(filter);
    obj = validator.isValidObject(obj);

    const updateObj = {
        $set: {
            ...obj,
        },
    };
    const updatedObj = await usersColl.findOneAndUpdate(filter, updateObj, {
        returnDocument: "after",
    });
    if (!updatedObj || updatedObj === null)
        throw { status: 400, message: "data not updated." };
    return updatedObj;
};

export const deleteUser = async (userId) => {
    const usersColl = await users();
    userId = validator.isValidMongoId(userId);
    const user = await usersColl.findOne({ _id: userId });
    if (!user) {
        throw { status: 404, message: "User NOT found" };
    }
    
    const coursesCollection = await courses();
    const enrolledCourses = await coursesCollection.find({ 
        "enrolled_students._id": userId 
    }).toArray();
    
    if (enrolledCourses.length > 0) {
        throw { 
            status: 400, 
            message: "Student is already Enrolled! Can't delete the student, so please remove all the courses" 
        };
    }
    
    const deleted =  await usersColl.deleteOne({ _id: userId });
    

    if (deleted.deletedCount === 0) {
        throw { status: 500, message: "The User couldn't be deleted!" };
    }
    
    return { deleted: true, userId: userId.toString() };

}
/**
 * Returns the details of the professor by the
 * email id
 * @param {*} id
 * @returns {Object}
 */
export const getUserByEmail = async (id) => {
    const usersColl = await users();
    id = validator.isValidEmail(id);
    const usersData = await usersColl.findOne({
        email: new RegExp(`^${id}$`, "i"),
    });
    if (!usersData) {
        throw { status: 404, message: "user not found" };
    }
    return usersData;
};

/**
 * Returns the details of the professor by the
 * mongo id
 * @param {*} id
 * @returns {Object}
 */
export const getUserById = async (id) => {
    const usersColl = await users();
    id = validator.isValidMongoId(id);
    const usersData = await usersColl.findOne({
        _id: id,
    });
    if (!usersData) {
        throw { status: 404, message: "user not found" };
    }
    return usersData;
};

/**
 * Create email OTP: save and send to user
 * @param {*} email
 * @returns {Object}
 */
export const sendSaveOTP = async (email) => {
    email = validator.isValidEmail(email);
    const otp = await sendOTPEmail(email);
    const filter = {
        email: new RegExp(`^${email}$`, "i"),
    };
    const updateObj = {
        otp: otp,
    };
    const updatedUser = await updateUser(filter, updateObj);
    return updatedUser;
};

/**
 * Fetch all users
 */
export const getAllUsers = async () => {
    const usersColl = await users();
    const allUsers = await usersColl.find({}).toArray();
    return allUsers;
};

/**
 * Fetch all professors
 */
export const getAllProfessors = async () => {
    const usersColl = await users();
    const professors = await usersColl.find({ role: "professor" }).toArray();
    return professors;
};

/**
 * Fetch all students
 */
export const getAllStudents = async () => {
    const usersColl = await users();
    const students = await usersColl.find({ role: "student" }).toArray();
    return students;
};

/**
 * Fetch all TA's (depricated)
 */
export const getAllTas = async () => {
    const usersColl = await users();
    const tas = await usersColl.find({ role: "ta" }).toArray();
    return tas;
};
