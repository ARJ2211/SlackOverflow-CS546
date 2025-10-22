import { courses } from "../config/mongoCollections.js";
import * as validator from "../validator.js";
/*==================================================================*/
/*
 * Creates a course
 * @param {string} courseName
 * @param {string} courseId - Unique identifier for the course
 * @param {string} description
 * @param {Array} enrolledStudents
 * @returns {Object} - Newly created course document
 */
export const createCourse = async (
    courseName,
    courseId,
    description,
    enrolledStudents = []
) => {
    const courseColl = await courses();

    try {
        courseName = validator.isValidString(courseName);
    } catch (e) {
        console.log("courseName", e);
    }
    try {
        courseId = validator.isValidString(courseId);
    } catch (e) {
        console.log("courseId", e);
    }
    try {
        description = validator.isValidString(description);
    } catch (e) {
        console.log("description", e);
    }
    try {
        enrolledStudents = validator.isValidArray(enrolledStudents);
    } catch (e) {
        console.log("enrolledStudents", e);
    }

    const existedCourseName = await courseColl.findOne({
        courseName: new RegExp(`^${courseName}$`, "i")
    });
    if (existedCourseName) {
        throw `409 course name already exists. ${existedCourseName.courseName}`;
    }

    const existedCourseId = await courseColl.findOne({
        courseId: new RegExp(`^${courseId}$`, "i")
    });
    if (existedCourseId) {
        throw `409 course Id already exists. ${existedCourseId.courseId}`;
    }

    const insertInfo = await courseColl.insertOne({
        courseName,
        courseId,
        description,
        enrolledStudents
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
    id = validator.isValidId(id, 'courseId');
    const courseColl = await courses();
    const course = await courseColl.findOne({ _id: id });
    if (!course) throw "404 Course not found";

    return course;
};
/*==================================================================*/
/**
 * Update a course data
 * @param {string} courseId - Course ID to update
 * @param {Object} updateData - Fields to update
 * @returns {Object} Updated course document
 */
export const updateCourse = async (courseId, updateData) => {
    courseId = validator.isValidId(courseId, 'courseId');
    updateData = validator.isValidObject(updateData, 'updateData');

    if (Object.keys(updateData).length === 0) {
        throw '400 Update data cannot be empty';
    }

    const courseColl = await courses();
    const allowedFields = ['courseName', 'courseId', 'description', 'enrolledStudents'];
    const updateFields = {};

    for (const [key, value] of Object.entries(updateData)) {
        if (!allowedFields.includes(key)) {
            throw `400 cannot update ${key}`;
        }

        switch (key) {
            case 'courseName':
                updateFields.courseName = validator.isValidString(value, 'courseName');
                break;
            case 'courseId':
                updateFields.courseId = validator.isValidString(value, 'courseId');
                // Check if new courseId already exists
                const existedCourse = await courseColl.findOne({
                    courseId: new RegExp(`^${value}$`, 'i'),
                    _id: { $ne: id }
                });
                if (existedCourse) {
                    throw `409 The course existed ${value}`;
                }
                break;
            case 'description':
                updateFields.description = validator.isValidString(value, 'description');
                break;
            case 'enrolledStudents':
                updateFields.enrolledStudents = validator.isValidStudentArray(value, 'enrolledStudents');
                break;
        }
    }

    // Show update
    const updateResult = await courseColl.findOneAndUpdate(
        { _id: id },
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
export const deleteCourse = async (id) => {
    // Validate ID
    id = validator.isValidId(id, "courseId");

    const courseColl = await courses();

    // Check if course exists
    const course = await courseColl.findOne({ _id: id });
    if (!course) {
        throw "404 course not found";
    }

    // Show deletion
    const deletionResult = await courseColl.deleteOne({ _id: id });

    if (deletionResult.deletedCount === 0) {
        throw "500 fail to delete course";
    }

    return {
        deleted: true,
        courseName: course.courseName,
        message: `"${course.courseName}" has been successfully deleted`
    };
};