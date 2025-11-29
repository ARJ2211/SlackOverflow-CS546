import * as coursesData from "../data/course.js";
import { getUserById } from "../data/users.js";
import * as validator from "../utils/validator.js";
import { handleError } from "../utils/helperFunctions.js";
import { Router } from "express";
import { ObjectId } from "mongodb";

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
            reqBody.course_description = validator.isValidString(reqBody.course_description, "course_description");
            reqBody.created_by = validator.isValidMongoId(reqBody.created_by, "created_by");
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
            return res.status(200).json({ message: "Student enrolled successfully!" });
        } catch (e) {
            if (e.status) {

                return handleError(res, e.message)
            }
            return handleError(res, e?.message || e);
        }
    });

router.route("/:courseId")
.get(async (req, res) => {
    // Get a coruse by the course ID
    let courseId = req.params.courseId;
    try {
        courseId = validator.isValidMongoId(courseId);
    } catch (e) {
        return res.status(400).send(e);
    }
    try {
        const courseData = await coursesData.getCourseById(courseId);
        return res.status(200).send(courseData);
    } catch (e) {
        if (e.status) {
            return res.status(e.status).send(e.message);
        }
        return res.status(400).send(e);
    }
})
.patch(async (req, res) => {
    let courseId = req.params.courseId;
    let courseData = req.body;
    try {
        courseId = validator.isValidMongoId(courseId);
        courseData.course_name = validator.isValidCourseName(courseData.course_name);
        courseData.course_id = validator.isValidCourseId(courseData.course_id);
        courseData.course_description = validator.isValidString(courseData.course_description, "course_description");
    } catch (e) {
        return handleError(res, e);
    }
    try{
        const updatedCourse = await coursesData.updateCourse(
        { _id: new ObjectId(courseId) },  
        courseData                         
);
        return res.status(200).json({ 
            message: "Course was updated!!",
            course: updatedCourse });

    }catch (e){
         if (e.status) {
            return res.status(e.status).send(e.message);
        }
        return handleError(res, e);
    }
})
.delete(async (req, res) => {
    let courseId = req.params.courseId;
    try {
        courseId = validator.isValidMongoId(courseId);
    } catch (e) {
        return handleError(res, e);
    }
    try{
        const course = await coursesData.getCourseById(courseId);
        if (course.enrolled_students && course.enrolled_students.length > 0) {
                return res.status(400).json({ 
                    message: "ALL ENROLLED STUDENTS must be removed before deleting course"
            });
        }       
        const deletedCourse = await coursesData.deleteCourse(course.course_id);
        return res.status(200).json(deletedCourse);
    }
    catch (e) {
        if (e.status) {
            return res.status(e.status).send(e.message);
        }
        return handleError(res, e);
    }
}
);

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
