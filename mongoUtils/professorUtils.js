import { professors } from "../config/mongoCollections.js";
import * as validator from "../validator.js";

/**
 * TODO: Add better validations + courses fk connection.
 * Creates a new professor document
 * @param {*} Pname
 * @param {*} status
 * @param {*} email
 * @param {*} phone
 * @param {*} office
 * @param {*} profilePicture
 * @returns {Object}
 */
export const createProfessor = async (
    Pname,
    status,
    email,
    phone,
    office,
    profilePicture
) => {
    const professorColl = await professors();

    try {
        Pname = validator.isValidString(Pname);
    } catch (e) {
        console.log("Pname", e);
        throw `Name connot be empty`;
    }

    try {
        status = validator.isValidString(status);
    } catch (e) {
        console.log("status", e);
    }

    try {
        email = validator.isValidString(email);
    } catch (e) {
        console.log("email", e);
        throw `Email cannot be empty!`;
    }

    try {
        phone = validator.isValidString(phone);
    } catch (e) {
        console.log("phone", e);
    }

    try {
        office = validator.isValidString(office);
    } catch (e) {
        console.log("office", e);
    }

    try {
        profilePicture = validator.isValidObject(profilePicture);
    } catch (e) {
        profilePicture = {};
    }

    const exists = await professorColl.findOne({
        $or: [
            { email: new RegExp(`^${email}$`, "i") },
            { phone: new RegExp(`^${phone}$`, "i") },
        ],
    });
    if (exists) {
        throw `409 professor already exists. ${exists.Pname}`;
    }
    const insertInfo = await professorColl.insertOne({
        Pname,
        status,
        email,
        phone,
        office,
        profilePicture,
        otp: null,
        password: null,
    });

    if (!insertInfo.insertedId) {
        throw `500 failed to create professor!`;
    }

    const newProfessor = await professorColl.findOne({
        _id: insertInfo.insertedId,
    });
    return newProfessor;
};

/**
 * Returns the details of the professor by the full name
 * @param {*} fullName
 * @returns {Object}
 */
export const getProfessorByFullName = async (fullName) => {
    const professorColl = await professors();
    fullName = validator.isValidString(fullName);
    const professorsData = await professorColl.findOne({
        Pname: new RegExp(`^${fullName}$`, "i"),
    });
    if (!professorsData) {
        throw `404 professor not found!`;
    }
    return professorsData;
};

/**
 * Returns the details of the professor by the full name
 * @param {*} fullName
 * @returns {Object}
 */
export const getProfessorByEmail = async (email) => {
    const professorColl = await professors();
    fullName = validator.isValidString(email);
    const professorsData = await professorColl.findOne({
        Pname: new RegExp(`^${email}$`, "i"),
    });
    if (!professorsData) {
        throw `404 professor not found!`;
    }
    return professorsData;
};

/**
 * Updates the professor document and returns the updated
 * document back
 * @param {*} filter
 * @param {*} obj
 */
export const updateProfessor = async (filter, obj) => {
    const professorColl = await professors();
    filter = validator.isValidObject(filter);
    obj = validator.isValidObject(obj);

    const updateObj = {
        $set: {
            ...obj,
        },
    };
    const updatedObj = await professorColl.findOneAndUpdate(filter, updateObj, {
        returnDocument: "after",
    });
    if (!updatedObj || updatedObj === null)
        throw `ERROR: document not updated.`;
    return updatedData;
};
