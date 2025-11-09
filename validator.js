import { ObjectId } from "mongodb";
import * as validatorPackage from "validator";

/**
 * Used to validate the type of variable is an array or not
 * does not return anything
 * @param {*} val
 */
export const isArray = (val) => {
    if (!Array.isArray(val)) throw `object is not an array`;
    return val;
};
/*==================================================================*/
/**
 * Used for validating the type of variable and making
 * sure it is of valid string. We return a trimmed string.
 * @param {*} val
 * @returns {String}
 */
export const isValidString = (val) => {
    if (typeof val !== "string") {
        throw `ERROR: ${val} is not a valid string.`;
    }
    val = val.trim();
    if (val.length === 0) {
        throw `ERROR: empty string detected.`;
    }
    return val;
};
/*==================================================================*/
/**
 * Used for validating the type of variable and making
 * sure it is of valid number.
 * @param {*} val
 */
export const isValidNumber = (val) => {
    if (typeof val !== "number" || !Number.isFinite(val)) {
        throw `ERROR: ${val} is not a valid number.`;
    }
    return val;
};
/*==================================================================*/
/**
 * Used to check if the type of variable is a valid object
 * or not.
 * @param {*} val
 */
export const isValidObject = (val) => {
    if (
        val === null ||
        typeof val !== "object" ||
        Array.isArray(val) ||
        Object.prototype.toString.call(val) !== "[object Object]"
    ) {
        throw `ERROR: provided input is not an object`;
    }
    return val;
};
/*==================================================================*/
/**
 * Used to check if the courseId is valid
 * @param {*} val
 * @param {*} variableName
 * @returns
 */
export const isValidCourseId = (val, variableName = "course_id") => {
    val = isValidString(val, variableName);

    const courseIdRegex = /^[A-Za-z]+\d+$/;
    if (!courseIdRegex.test(val)) {
        throw `ERROR: provided courseId is not a string`;
    }

    return val.toUpperCase();
};
/*==================================================================*/
/**
 * Used to check if the courseName is valid
 * @param {*} val
 * @param {*} variableName
 * @returns
 */
export const isValidCourseName = (val, variableName = "course_name") => {
    val = isValidString(val, variableName);

    const courseNameRegex = /^[A-Za-z0-9\s\-.,()&]+$/;
    if (!courseNameRegex.test(val)) {
        throw `ERROR: provided courseName contains invalid characters`;
    }

    return val.trim();
};
/*==================================================================*/
/**
 * Used to check if the type of variable is a valid boolean
 * or not.
 * @param {*} val
 */
export const isValidBoolean = (val) => {
    if (typeof val !== "boolean") {
        throw `ERROR: ${val} is not a valid boolean.`;
    }
    return val;
};
/*==================================================================*/
/**
 * Used to check if the type of string is a valid mongo
 * object ID and if yes, return it.
 * @param {*} val
 * @returns {ObjectId}
 */
export const isValidMongoId = (val) => {
    val = isValidString(val);
    if (!ObjectId.isValid(val)) {
        throw `ERROR: not a valid mongo object id`;
    }
    return new ObjectId.createFromHexString(val);
};

/**
 * Used to check if a string is a valid email
 * id and then return the trimmed value
 */
export const isValidEmail = (val) => {
    val = isValidString(val);
    if (!validatorPackage.default.isEmail(val)) {
        throw `ERROR: not a valid email`;
    }
    return val;
};

/**
 * Used to check if the user has a valid
 * role or not [professor, ta, student]
 */
export const isValidRole = (val) => {
    val = isValidString(val);
    const validRoles = new Set(["professor", "student"]);

    if (!validRoles.has(val)) {
        throw `ERROR: role does not exist`;
    }
    return val;
};
