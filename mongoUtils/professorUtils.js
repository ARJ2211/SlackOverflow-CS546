import { professors } from "../config/mongoCollections.js";
import * as validator from "../validator.js";

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
