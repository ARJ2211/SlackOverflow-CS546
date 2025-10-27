import { professors } from "../config/mongoCollections.js";
import * as validator from "../validator.js";
//Hello

/**
 * Creates a new student document
 * @param {*} full_name
 * @param {*} first_name
 * @param {*} middle_name
 * @param {*} last_name
 * @param {*} is_ta
 * @param {*} questions_asked
 * @param {*} otp
 * @param {*} password
 * @returns {Object}
 */

export const creatStudent = async (
full_name,
first_name,
middle_name,
last_name,
is_ta,
questions_asked,
otp,
password,
) => {
const studentColl = await students();
    try {
        full_name = validator.isValidString(full_name);
    } catch (e) {
        console.log("full_name", e);
    }
    try {
        first_name = validator.isValidString(first_name);
    } catch (e) {
        console.log("first_name", e);
    }
    try {
        middle_name = validator.isValidString(middle_name);
    } catch (e) {
        console.log("middle_name", e);
    }
    try {
        last_name = validator.isValidString(last_name);
    } catch (e) {
        console.log("last_name", e);
    }
    try {
        is_ta = validator.isValidBoolean(is_ta); //actually says binData instead? 
    } catch (e) {
        console.log("is_ta", e);
    }
    try {
        questions_asked = validator.isArray(questions_asked);
    } catch (e) {
        console.log("questions_asked", e);
    }
    try {
        otp = validator.isValidString(otp);
    } catch (e) {
        console.log("otp", e);
    }
    try {
        password = validator.isValidString(password);
    } catch (e) {
        console.log("password", e);
    }

    const exists = await studentColl.findOne({
        $or: [
            { id: new RegExp(`^${id}$`, "i") },
            {full_name: new RegExp(`^${full_name}$`, "i")},
            { email: new RegExp(`^${email}$`, "i")}
        ]
    });

    if (exists) {
        throw `409 student already exists. ${exists.full_name}`;
    }
}


/**
 * Returns the details of the student by Id
 * @param {*} id 
 * @returns {Object}
 */
export const getStudentById = async (id) => {
    const studentColl = await students();
    fullName = validator.isValidString(id); 
    const studenData = await studentColl.findOne({
        id: new RegExp(`^${id}$`, "i"),
    });
    if (!studentData){
        throw '404 student not found!';
    }
    return studentData;
};

/**
 * Returns all of the students in an array
 * @returns {Array}
 */
export const getAllStudents = async () => {
    const studentColl = await students();
    const allStudents = studentColl.find({}).toArray();;
    return allStudents;
}

export const updateStudent = async (id) => {
    if (!id){
        throw '404 student not found!';
    }
}