import { users } from "../config/mongoCollections.js";
import * as validator from "../validator.js";

/**
 * Creates a new professor document
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
        throw { status: 400, message: e?.message || e };
    }

    const exists = await usersColl.findOne({
        $or: [{ email: new RegExp(`^${email}$`, "i") }],
    });
    if (exists) {
        throw `409 professor already exists. ${exists.first_name}`;
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
        throw `500 failed to create professor!`;
    }

    const newProfessor = await usersColl.findOne({
        _id: insertInfo.insertedId,
    });
    return newProfessor;
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
    return updatedData;
};

/**
 * Returns the details of the professor by the id
 * @param {*} id
 * @returns {Object}
 */
export const getProfessorByEmail = async (id) => {
    const usersColl = await users();
    id = validator.isValidMongoId(id);
    const professorsData = await usersColl.findOne({
        _id: new RegExp(`^${id}$`, "i"),
    });
    if (!professorsData) {
        throw { status: 404, message: "user not found" };
    }
    return professorsData;
};
