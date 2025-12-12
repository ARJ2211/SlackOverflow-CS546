import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
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
export const isValidString = (val, variableName) => {
    if (typeof val !== "string") {
        throw `ERROR:  ${
            variableName || "provided variable"
        } == ${val} is not a valid string.`;
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
export const isValidNumber = (val, variableName) => {
    if (typeof val !== "number" || !Number.isFinite(val)) {
        throw `ERROR: ${
            variableName || "provided variable"
        } == ${val} is not a valid number.`;
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

    // Example: CS-546 or CSE-501 etc
    const courseIdRegex = /^([A-Z]{2,4})-(\d{3})$/;

    if (!courseIdRegex.test(val)) {
        throw `Invalid course ID. Use format ABC-123 where:
        • ABC is 2–4 capital letters
        • 123 is a number between 100 and 999`;
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
export const isValidBoolean = (val, variableName) => {
    if (typeof val !== "boolean") {
        throw `ERROR: ${
            variableName || "provided variable"
        } == ${val} is not a valid boolean.`;
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
export const isValidMongoId = (val, variableName) => {
    if (val instanceof ObjectId) {
        return val;
    }
    val = isValidString(val, variableName);

    if (!ObjectId.isValid(val)) {
        throw `ERROR: ${
            variableName || "provided variable"
        } is not a valid mongo object id`;
    }
    return ObjectId.createFromHexString(val);
};

/**
 * Used to check if a string is a valid email
 * id and then return the trimmed value
 */
export const isValidEmail = (val, variableName) => {
    val = isValidString(val, variableName);
    if (!validatorPackage.default.isEmail(val)) {
        throw `ERROR: ${
            variableName || "provided variable"
        } == ${val} is not a valid email`;
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

/**
 * Used for hashing the password and returning it.
 * @returns {String}
 */
export const hashPassword = (pwd) => {
    pwd = isValidString(pwd);
    const hashedPwd = bcrypt.hashSync(pwd, 16);
    return hashedPwd;
};

/**
 * Used for validating the password string.
 * We make sure there are no spaces, at least 8 chars,
 * one uppercase, one number and one special char.
 * @param {*} val
 * @returns {String}
 */
export const isValidPassword = (val) => {
    isValidString(val);
    if (val.length < 8) {
        throw `ERROR: password is too short.`;
    }
    if (/\s/.test(val)) {
        throw `ERROR: password cannot contain spaces.`;
    }
    if (!/[A-Z]/.test(val)) {
        throw `ERROR: password must contain at least one uppercase character.`;
    }
    if (!/[0-9]/.test(val)) {
        throw `ERROR: password must contain at least one number.`;
    }
    if (!/[^A-Za-z0-9]/.test(val)) {
        throw `ERROR: password must contain at least one special character.`;
    }
    const hashedPassword = hashPassword(val);
    return hashedPassword;
};

/**
 * Used for comparing a plain password with a hashed password.
 * We return true if they match, false otherwise.
 * @param {*} plainPwd
 * @param {*} hashedPwd
 * @returns {Boolean}
 */
export const comparePassword = (plainPwd, hashedPwd) => {
    plainPwd = isValidString(plainPwd);
    if (typeof hashedPwd !== "string" || hashedPwd.trim().length === 0) {
        throw `ERROR: invalid hashed password.`;
    }
    const match = bcrypt.compareSync(plainPwd, hashedPwd);
    return match;
};

/**
 * Check to see if the labels array
 * is valid or not. Cannot be empty
 * and has to be unique
 */
export const isValidLabels = (val) => {
    if (!Array.isArray(val) || val.length === 0) {
        throw `ERROR: Incorrect or No Labels provided.`;
    }
    return val;
};
