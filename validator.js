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
export const isValidCourseId = (val, variableName = "courseId") => {
    val = isValidString(val, variableName);

    const courseIdRegex = /^[A-Za-z]+\d+$/;
    if (!courseIdRegex.test(val)) {
        throw `ERROR: provided courseId is not a string`;
    }

    return val.toUpperCase();
};
/*==================================================================*/
/**
 * Used to check if the studentId is valid
 * @param {*} val
 * @param {*} variableName
 * @returns
 */
export const isValidStudentArray = (val, variableName = "enrolledStudents") => {
    val = isArray(val, variableName);

    if (val.length > 0) {
        val.forEach((studentId) => {
            if (typeof studentId !== 'string' && typeof studentId !== 'object') {
                throw `ERROR: provided studentId is not a string/object`;
            }
        });
    }

    return val;
};
