import { students } from "../config/mongoCollections.js";
import * as validator from "../validator.js";
import { ObjectId } from "mongodb";


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

export const createStudent = async (
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
    full_name = validator.isValidString(full_name);
    first_name = validator.isValidString(first_name);
    middle_name = validator.isValidString(middle_name);
    last_name = validator.isValidString(last_name);
    is_ta = validator.isValidBoolean(is_ta);
    questions_asked = validator.isArray(questions_asked);
    otp = validator.isValidString(otp);
    password = validator.isValidString(password);

    const exists = await studentColl.findOne({
        $or: [
            {full_name: new RegExp(`^${full_name}$`, "i")},
        ]
    });
    
    if (exists) {
        throw `409 student already exists. ${exists.full_name}`;
    }
    const newStudent = {
        full_name,
        first_name,
        middle_name,
        last_name,
        is_ta,
        questions_asked,
        otp,
        password
    };

    const insertInfo = await studentColl.insertOne(newStudent);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {
        throw '500, student could NOT be added!';
    }

    return await getStudentById(insertInfo.insertedId.toString());
};


/**
 * Returns the details of the student by Id
 * @param {*} id 
 * @returns {Object}
 */
export const getStudentById = async (id) => {
    const studentColl = await students();
    id = validator.isValidString(id); 
    const studentData = await studentColl.findOne({
        _id: ObjectId.createFromHexString(id),
    });
    if (!studentData){
        throw '404 student not found!';
    }
    return studentData;
};


export const updateStudent = async (id, updatedInfo) => {
    const studentColl = await students();
    id = validator.isValidString(id);
    await getStudentById(id);
    const updated = await studentColl.updateOne({
        _id: ObjectId.createFromHexString(id)},{//converts id string to hex
        $set: updatedInfo //adds new field or updates val of exisitng
    });

    return await getStudentById(id);
}