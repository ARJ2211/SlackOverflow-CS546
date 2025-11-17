import { ObjectId } from "mongodb";
import { courses, users } from "../config/mongoCollections.js";
import randomName from "@scaleway/random-name";
import { createUser, sendSaveOTP, getUserById } from "./usersUtils.js";
import * as validator from "../utils/validator.js";

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Creates a course (with no labels and enrolled students yet!)
 * @param {string} course_name
 * @param {string} course_id
 * @param {string} course_description
 * @param {ObjectId} created_by
 * @param {Date} created_at
 * @param {Date} updated_at
 * @returns {Object}
 */
export const createCourse = async (
    course_name,
    course_id,
    course_description,
    created_by
) => {
    const courseColl = await courses();
    try {
        course_name = validator.isValidCourseName(course_name);
        course_id = validator.isValidCourseId(course_id);
        course_description = validator.isValidString(course_description);
        created_by = validator.isValidMongoId(created_by);
    } catch (e) {
        throw { status: 400, message: e };
    }

    const existedCourse = await courseColl.findOne({
        $or: [
            { course_name: new RegExp(`^${esc(course_name)}$`, "i") },
            { course_id: new RegExp(`^${esc(course_id)}$`, "i") },
        ],
    });
    if (existedCourse) {
        throw { status: 409, message: `Course already exists` };
    }

    // Check to see if the creator of course exists
    // and that they are a professor!!!!!
    const professorData = await getUserById(created_by);
    if (professorData.role !== "professor") {
        throw { status: 403, message: "Only professor can create a course" };
    }

    const created_at = new Date();
    const updated_at = created_at;

    const insertInfo = await courseColl.insertOne({
        course_name,
        course_id,
        course_description,
        created_by,
        created_at,
        updated_at,
        labels: [],
        enrolled_students: [],
    });

    if (!insertInfo.insertedId) {
        throw { status: 400, message: `failed to create course!` };
    }
    const newCourse = await courseColl.findOne({
        _id: insertInfo.insertedId,
    });
    return newCourse;
};

/**
 * Get all courses from the database
 * @returns {Array} List of all course documents
 */
export const getAllCourses = async () => {
    const courseColl = await courses();

    return await courseColl.find({}).toArray();
};

/**
 * Get a course by its Id
 * @param {ObjectId} id - mongo ID
 * @returns {Object} Course document
 */
export const getCourseById = async (id) => {
    id = validator.isValidMongoId(id);
    const courseColl = await courses();
    const course = await courseColl.findOne({ _id: id });
    if (!course) throw { status: 404, message: "Course not found" };
    return course;
};

/**
 * Used to get a list of courses that the professor has created
 * and returns and array of objects
 * @param {*} professorId
 * @returns {Array<Object>}
 */
export const getCourseByProfessorId = async (professorId) => {
    const coursesColl = await courses();
    try {
        professorId = validator.isValidMongoId(professorId);
    } catch (e) {
        throw { status: 400, message: e };
    }
    const professorCourses = coursesColl
        .find({ created_by: professorId })
        .toArray();
    return professorCourses;
};

export const getCourseByStudentId = async (studentId) => {
    const coursesColl = await courses();
    try {
        studentId = validator.isValidMongoId(studentId);
    } catch (e) {
        throw { status: 400, message: e };
    }
    const studentCourses = coursesColl
        .find({ "enrolled_students.user_id": studentId })
        .toArray();
    return studentCourses;
};

/**
 * Updates the cousre document and returns the updated
 * document back
 * @param {*} filter
 * @param {*} obj
 */
export const updateCourse = async (filter, obj) => {
    const courseColl = await courses();
    try {
        filter = validator.isValidObject(filter);
        obj = validator.isValidObject(obj);
    } catch (e) {
        throw { status: 400, message: e };
    }

    const existingCourse = await courseColl.findOne(filter);
    if (!existingCourse) throw { status: 404, message: "Course not found" };

    for (const [key, value] of Object.entries(obj)) {
        switch (key) {
            case "course_name": {
                const name = validator.isValidCourseName(value, "course_name");
                const dupCourse = await courseColl.findOne({
                    _id: { $ne: existingCourse._id },
                    course_name: { $regex: new RegExp(`^${esc(name)}$`, "i") },
                });
                if (dupCourse)
                    throw {
                        status: 409,
                        message: "Course name already exists",
                    };
                obj.course_name = name;
                break;
            }
            case "course_id": {
                const cid = validator.isValidCourseId(value, "course_id");
                const dupCourse = await courseColl.findOne({
                    _id: { $ne: existingCourse._id },
                    course_id: cid,
                });
                if (dupCourse)
                    throw { status: 409, message: "Course id already exists" };
                obj.course_id = cid;
                break;
            }
            case "course_description": {
                obj.course_description = validator.isValidString(
                    value,
                    "course_description"
                );
                break;
            }
            default: {
                throw {
                    status: 400,
                    message: `This key cannot be updated: ${key}`,
                };
            }
        }
    }

    const updateObj = {
        $set: {
            ...obj,
            updated_at: new Date(),
        },
    };

    const updatedObj = await courseColl.findOneAndUpdate(
        { _id: existingCourse._id },
        updateObj,
        { returnDocument: "after" }
    );

    if (!updatedObj || updatedObj === null)
        throw { status: 400, message: "data not updated." };
    return updatedObj;
};

/**
 * Used to add a label to the course. Returns the
 * entire course with the new label. Label names are
 * unique in each course.
 * @param {ObjectId} id
 * @param {String} label
 * @returns {Object}
 */
export const addLabelToCourse = async (id, label) => {
    const courseColl = await courses();
    try {
        id = validator.isValidMongoId(id);
        label = validator.isValidString(label);
    } catch (e) {
        throw { status: 400, message: e };
    }
    await getCourseById(id);
    const existingLabelCourse = await courseColl.findOne({
        _id: id,
        "labels.name": new RegExp(`^${esc(label)}$`, "i"),
    });
    if (existingLabelCourse) {
        throw { status: 400, message: "Label already exists" };
    }

    const insertedObj = {
        _id: new ObjectId(),
        name: label,
    };
    const updatedObj = await courseColl.findOneAndUpdate(
        { _id: id },
        {
            $addToSet: {
                labels: {
                    ...insertedObj,
                },
            },
            $set: { updated_at: new Date() },
        },
        { returnDocument: "after" }
    );
    if (!updatedObj || updatedObj === null)
        throw { status: 400, message: "data not updated." };
    return updatedObj;
};

/**
 * Enroll a student to course. Create their user profile
 * and send them an email to authenticate themselves.
 * Save the student status here as "inactive"!!!!!!
 * @param {ObjectId} id
 * @param {String} email
 * @param {Boolean} is_ta
 * @returns {Object}
 */
export const enrollStudentToCourse = async (id, email, is_ta) => {
    const courseColl = await courses();
    const usersColl = await users();
    try {
        id = validator.isValidMongoId(id);
        email = validator.isValidEmail(email);
        is_ta = validator.isValidBoolean(is_ta);
    } catch (e) {
        throw { status: 400, message: e };
    }

    const existingCourse = await courseColl.findOne({ _id: id });
    if (!existingCourse) {
        throw { status: 404, message: "Course not found" };
    }

    const existingStudentUser = await usersColl.findOne({ email: email });
    if (existingStudentUser) {
        // Need to check if that student is already in the course
        // if not, that means he has an account, but some other professor
        // is trying to add them in another course
        for (let student of existingCourse.enrolled_students) {
            if (
                student.user_id.toString() ===
                existingStudentUser._id.toString()
            ) {
                // This means student already exists in the course
                throw {
                    status: 400,
                    message: "Students already exists in course",
                };
            }
        }
        // Professor is trying to add that student in some other course
        // even though student has an account, and has been added to some
        // different course
        const updatedCourse = await courseColl.findOneAndUpdate(
            { _id: id },
            {
                $addToSet: {
                    enrolled_students: {
                        user_id: existingStudentUser._id,
                        is_ta: is_ta,
                    },
                },
                $set: { updated_at: new Date() },
            },
            { returnDocument: "after" }
        );
        if (!updatedCourse || updatedCourse === null)
            throw { status: 400, message: "data not updated." };
        return updatedCourse;
    } else {
        // This student does not exist only and he is being added to the
        // website for the first time in his life. So we need to create a
        // user for that student, make it inactive, and send them an invitation
        // to sign up and all.
        const random_name = randomName("", " ");
        const first_name = random_name.split(" ")[0];
        const last_name = random_name.split(" ")[1];
        const createdUser = await createUser(
            first_name,
            last_name,
            email,
            "student"
        );
        // Send the user their OTP and save into the DB.
        sendSaveOTP(email);
        const createdUserId = createdUser._id;
        // Add that student into the course
        await courseColl.findOneAndUpdate(
            { _id: id },
            {
                $addToSet: {
                    enrolled_students: {
                        user_id: createdUserId,
                        is_ta: is_ta,
                    },
                },
            },
            { returnDocument: "after" }
        );
        if (!courseColl || courseColl === null)
            throw { status: 400, message: "course not updated" };

        const studentUser = await getUserById(createdUserId);
        if (!studentUser || studentUser === null)
            throw { status: 400, message: "user not created" };
        return studentUser;
    }
};

/**
 * Deletes a course data
 * @param {string} id - Course ID
 * @returns {Object} Deletion status
 */
export const deleteCourse = async (course_id) => {
    course_id = validator.isValidCourseId(course_id, "course_id");

    const courseColl = await courses();

    // Check if course exists
    const course = await courseColl.findOne({ course_id: course_id });
    if (!course) {
        throw "404 course not found";
    }

    // Show deletion
    const deletionResult = await courseColl.deleteOne({ course_id: course_id });

    if (deletionResult.deletedCount === 0) {
        throw "500 fail to delete course";
    }

    return {
        deleted: true,
        course_name: course.course_name,
        message: `"${course.course_name}" has been successfully deleted`,
    };
};
