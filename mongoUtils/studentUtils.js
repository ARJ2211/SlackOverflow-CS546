import { professors } from "../config/mongoCollections.js";
import * as validator from "../validator.js";


/**
 * Creates a new professor document
 * @param {*} id
 * @param {*} first_name
 * @param {*} last_name
 * @param {*} email
 * @param {*} age
 * @param {*} major
 * @param {*} gpa
 * @returns {Object}
 */

export const creatStudent = async (
    id,
    first_name,
    last_name,
    email,
    age,
    major,
    gpa,
) => {
const studentColl = await students();
    try {
        id = validator.isValidString(id);
    } catch (e) {
        console.log("id", e);
    }

    try {
        first_name = validator.isValidString(first_name);
    } catch (e) {
        console.log("first_name", e);
    }
    try {
        last_name = validator.isValidString(last_name);
    } catch (e) {
        console.log("last_name", e);
    }
    try {
        email = validator.isValidString(email);
    } catch (e) {
        console.log("email", e);
    }

    try {
        age = validator.isValidString(age);
    } catch (e) {
        console.log("age", e);
    }
    try {
        office = validator.isValidString(major);
    } catch (e) {
        console.log("major", e);
    }
    try {
        office = validator.isValidString(gpa);
    } catch (e) {
        console.log("gpa", e);
    }

    const exists = await studentColl.findOne({
        $or: [
            { id: new RegExp(`^${id}$`, "i") },
            {
                $and: [
                { first_name: new RegExp(`^${first_name}`, "i")},
                { last_name: new RegExp(`^${last_name}`, "i")}, //maybe change to name or first and last?
            ]
        },
            { email: new RegExp(`^${email}$`, "i")}
        ]
    });

    if (exists) {
        throw `409 student already exists. ${exists.first_name + " " + exists.last_name}`;
    }
}



export const getStudentById = async (id) => {
    const studentColl = await students();
    id = validator.isValidString(id); 
    let studentId = id.trim() //trim whitespace
    let student = studentColl.find((s) => String(s.id)===String(studentId));

    return student;
};

export const updateStudent = async (id) => {
    if (!id){
        throw 
    }
}