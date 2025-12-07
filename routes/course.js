import * as coursesData from "../data/course.js";
import { getUserById } from "../data/users.js";
import * as validator from "../utils/validator.js";
import { handleError } from "../utils/helperFunctions.js";
import { Router } from "express";

const router = Router();

router
    .route("/")
    .get(async (req, res) => {
        // Get all courses
        const allCourses = await coursesData.getAllCourses();
        return res.status(200).json(allCourses);
    })
    .post(async (req, res) => {
        // Create a course under a professor
        let reqBody = req.body;
        try {
            reqBody.course_name = validator.isValidCourseName(
                reqBody.course_name
            );
            reqBody.course_id = validator.isValidCourseId(reqBody.course_id);
            reqBody.course_description = validator.isValidString(
                reqBody.course_description,
                "course_description"
            );
            reqBody.created_by = validator.isValidMongoId(
                reqBody.created_by,
                "created_by"
            );
        } catch (e) {
            return handleError(res, e);
        }

        try {
            const createdCourse = await coursesData.createCourse(
                reqBody.course_name,
                reqBody.course_id,
                reqBody.course_description,
                reqBody.created_by
            );
            return res.status(200).json(createdCourse);
        } catch (e) {
            if (e.status) {
                return handleError(res, e.message);
            }
            return handleError(res, e);
        }
    });

router
    .route("/:courseId/labels")
    .get(async (req, res) => {
        // Get all the labels in a course
        let courseId = req.params.courseId;
        try {
            courseId = validator.isValidMongoId(courseId);
        } catch (e) {
            return res.status(400).send(e);
        }

        try {
            const allCourseLabels = await coursesData.getCourseById(courseId);
            return res.status(200).json(allCourseLabels.labels);
        } catch (e) {
            if (e.status) {
                return res.status(e.status).send(e.message);
            }
            return res.status(400).send(e);
        }
    })
    .post(async (req, res) => {
        // Create a label for a perticular course
        let courseId = req.params.courseId;
        let reqBody = req.body;
        try {
            courseId = validator.isValidMongoId(courseId);
            reqBody.name = validator.isValidString(reqBody.name);
        } catch (e) {
            return res.status(400).send(e);
        }

        try {
            const updatedCourseData = await coursesData.addLabelToCourse(
                courseId,
                reqBody.name
            );
            return res.status(200).json(updatedCourseData);
        } catch (e) {
            if (e.status) {
                return res.status(e.status).send(e.message);
            }
            return res.status(400).send(e);
        }
    });

router
    .route("/:courseId/students")
    .get(async (req, res) => {
        // Get students inside a course
        let courseId = req.params.courseId;
        try {
            courseId = validator.isValidMongoId(courseId);
        } catch (e) {
            return res.status(400).send(e);
        }
        try {
            const courseCompleteData = await coursesData.getCourseById(
                courseId
            );
            const studentsData = [];
            for (let enrolledStudent of courseCompleteData.enrolled_students) {
                const studentUserData = await getUserById(
                    enrolledStudent.user_id
                );
                studentsData.push({
                    _id: studentUserData._id,
                    first_name: studentUserData.first_name,
                    last_name: studentUserData.last_name,
                    email: studentUserData.email,
                    is_ta: enrolledStudent.is_ta,
                    status: studentUserData.status,
                });
            }
            return res.status(200).json(studentsData);
        } catch (e) {
            if (e.status) {
                return res.status(e.status).send(e.message);
            }
            return res.status(400).send(e);
        }
    })
    .post(async (req, res) => {
        // Add a student to a course
        let courseId = req.params.courseId;
        let reqBody = req.body;
        try {
            reqBody = validator.isValidObject(reqBody);
            courseId = validator.isValidMongoId(courseId);
            reqBody.email = validator.isValidEmail(reqBody.email);
            reqBody.is_ta = validator.isValidBoolean(reqBody.is_ta);
        } catch (e) {
            return res.status(400).send(e);
        }

        try {
            await coursesData.getCourseById(courseId);
            const studentUser = await coursesData.enrollStudentToCourse(
                courseId,
                reqBody.email,
                reqBody.is_ta
            );
            return res
                .status(200)
                .json({ message: "Student enrolled successfully!" });
        } catch (e) {
            if (e.status) {
                return handleError(res, e.message);
            }
            return handleError(res, e?.message || e);
        }
    });

router
    .route("/:courseId")
    .get(async (req, res) => {
        // Get a course by the Mongo ID
        let courseId = req.params.courseId;
        try {
            courseId = validator.isValidMongoId(courseId);
        } catch (e) {
            return handleError(res, e);
        }
        try {
            const courseData = await coursesData.getCourseById(courseId);
            return res.status(200).json(courseData);
        } catch (e) {
            if (e.status) {
                return handleError(res, e.message);
            }
            return handleError(res, e);
        }
    })
    .delete(async (req, res) => {
        // Delete a course by its course_id (e.g. "CS-546")
        let courseCode = req.params.courseId;
        // We are sending the course mongo ID here so we need the
        // course ID instead :(
        const courseData = await coursesData.getCourseById(courseCode);
        courseCode = courseData.course_id;
        try {
            courseCode = validator.isValidCourseId(courseCode, "course_id");
        } catch (e) {
            console.log(e);
            return handleError(res, e);
        }

        try {
            const result = await coursesData.deleteCourse(courseCode);
            // result is { deleted: true, course_name, message }
            return res.status(200).json(result);
        } catch (e) {
            // if you later change deleteCourse to throw {status, message}, this will handle it
            if (e.status) {
                return handleError(res, e.message);
            }
            return handleError(res, e);
        }
    });

router.route("/professor/:professorId").get(async (req, res) => {
    // Get all courses taught by professor
    let professorId = req.params.professorId;
    try {
        professorId = validator.isValidMongoId(req.params.professorId);
    } catch (e) {
        res.status(400).send(e);
    }
    const professorCourses = await coursesData.getCourseByProfessorId(
        professorId
    );
    return res.status(200).json(professorCourses);
});

export default router;
