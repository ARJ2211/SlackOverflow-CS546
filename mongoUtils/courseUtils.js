import { courses } from "../config/mongoCollections.js";
import * as validator from "../validator.js";
/*==================================================================*/
/*
 * Creates a course
 * @param {string} course_name
 *
 * @param {string} course_id - Unique identifier for the course
 * @param {string} course_description
 * @param {Array} enrolled_students
 * @returns {Object} - Newly created course document
 */
export const createCourse = async (
    course_name,
    course_id,
    course_description,
    enrolled_students = []
) => {
    const courseColl = await courses();

    course_name = validator.isValidCourseName(course_name, 'course_name');
    course_id = validator.isValidCourseId(course_id, 'course_id');
    try {
        course_description = validator.isValidString(course_description);
    } catch (e) {
        console.log("course_description", e);
    }
    try {
        enrolled_students = validator.isValidArray(enrolled_students);
    } catch (e) {
        console.log("enrolled_students", e);
    }

    const existedCourseName = await courseColl.findOne({
        course_name: new RegExp(`^${course_name}$`, "i")
    });
    if (existedCourseName) {
        throw `409 course name already exists. ${existedCourseName.course_name}`;
    }

    const existedCourseId = await courseColl.findOne({
        course_id: new RegExp(`^${course_id}$`, "i")
    });
    if (existedCourseId) {
        throw `409 course Id already exists. ${existedCourseId.course_id}`;
    }

    const insertInfo = await courseColl.insertOne({
        course_name,
        course_id,
        course_description,
        enrolled_students
    });

    if (!insertInfo.insertedId) {
        throw `500 failed to create course!`;
    }

    const newCourse = await courseColl.findOne({
        _id: insertInfo.insertedId,
    });

    return newCourse;
};
/*==================================================================*/
/**
 * Get all courses from the database
 * @returns {Array} List of all course documents
 */
export const getAllCourses = async () => {
    const courseColl = await courses();

    return await courseColl.find({}).toArray();
};
/*==================================================================*/
/**
 * Get a course by its ID
 * @param {string} id - Course ID
 * @returns {Object} Course document
 */
export const getCourseById = async (id) => {
    id = validator.isValidCourseId(id, 'course_id');
    const courseColl = await courses();
    const course = await courseColl.findOne({ _id: id });
    if (!course) throw "404 Course not found";

    return course;
};
/*==================================================================*/
/**
 * Update a course data
 * @param {string} course_id - Course ID to update
 * @param {Object} updateData - Fields to update
 * @returns {Object} Updated course document
 */
export const updateCourse = async (course_id, updateData) => {
    course_id = validator.isValidCourseId(course_id, 'course_id');
    updateData = validator.isValidObject(updateData, 'updateData');

    if (Object.keys(updateData).length === 0) {
        throw '400 Update data cannot be empty';
    }

    const courseColl = await courses();
    const allowedFields = ['course_name', 'course_id', 'course_description', 'enrolled_students'];
    const updateFields = {};

    for (const [key, value] of Object.entries(updateData)) {
        if (!allowedFields.includes(key)) {
            throw `400 cannot update ${key}`;
        }

        switch (key) {
            case 'course_name':
                updateFields.course_name = validator.isValidString(value, 'course_name');
                break;
            case 'course_id':
                updateFields.course_id = validator.isValidString(value, 'course_id');
                // Check if new course_id already exists
                const existedCourse = await courseColl.findOne({
                    course_id: new RegExp(`^${value}$`, 'i'),
                    course_id: { $ne: course_id }
                });
                if (existedCourse) {
                    throw `409 The course existed ${value}`;
                }
                break;
            case 'course_description':
                updateFields.course_description = validator.isValidString(value, 'course_description');
                break;
            case 'enrolled_students':
                updateFields.enrolled_students = validator.isValidStudentArray(value, 'enrolled_students');
                break;
        }
    }

    // Show update
    const updateResult = await courseColl.findOneAndUpdate(
        { course_id: course_id },
        { $set: updateFields },
        { returnDocument: 'after' }
    );
    if (!updateResult) {
        throw "404 course not found";
    }

    return updateResult;
};
/*==================================================================*/
/**
 * Deletes a course data
 * @param {string} id - Course ID
 * @returns {Object} Deletion status
 */
export const deleteCourse = async (course_id) => {
    course_id = validator.isValidCourseId(course_id, "course_id");

    const courseColl = await courses();

    // Check if course exists
    const course = await courseColl.findOne({course_id: course_id});
    if (!course) {
        throw "404 course not found";
    }

    // Show deletion
    const deletionResult = await courseColl.deleteOne({course_id: course_id});

    if (deletionResult.deletedCount === 0) {
        throw "500 fail to delete course";
    }

    return {
        deleted: true,
        course_name: course.course_name,
        message: `"${course.course_name}" has been successfully deleted`
    };
};
