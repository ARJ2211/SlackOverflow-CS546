import { Router } from 'express';
import * as coursesData from "../data/course.js";
import * as questionsData from "../data/question.js";

import * as validator from "../utils/validator.js";
import { handleError } from "../utils/helperFunctions.js";
import { getAllStudentsByCourseId } from '../data/students.js';
import * as usersData from '../data/users.js';
import moment from "moment";

const router = Router();

// Dashboard 
router.get('/dashboard', async (req, res) => {

    const userSesData = req.session.user;
    let courses = [];

    try {

        if (userSesData.role == "professor") {
            const professorId = validator.isValidMongoId(userSesData.id);
            courses = await coursesData.getCourseByProfessorId(professorId);
        } else {
            const studentId = validator.isValidMongoId(userSesData.id);
            courses = await coursesData.getCourseByStudentId(studentId)
        }

        courses = courses.map(course => ({
            _id: course._id.toString(),
            course_id: course.course_id,
            course_name: course.course_name
        }))

        return res.render('main/dashboard', {
            layout: 'main',
            title: 'Dashboard',
            page: "Dashboard",
            path: '/ dashboard',
            courses: courses,
        });
    } catch (error) {
        console.error("/main/dashboard Error:", error);
        return handleError(res, error);
    }
});

// Course/:id 
router.get('/courses/:id', async (req, res) => {

    let courses = [];
    let courseId;
    let course;
    let questions = []
    let labels = []
    const userSesData = req.session.user;

    try {

        courseId = validator.isValidMongoId(req.params.id, "req.params.id");

        if (userSesData.role == "professor") {
            const professorId = validator.isValidMongoId(userSesData.id, "userSesData.id");
            courses = await coursesData.getCourseByProfessorId(professorId);
        } else {
            const studentId = validator.isValidMongoId(userSesData.id, "userSesData.id");
            courses = await coursesData.getCourseByStudentId(studentId)
        }

        courses = courses.map(course => ({
            _id: course._id.toString(),
            course_id: course.course_id,
            course_name: course.course_name
        }))

        course = await coursesData.getCourseById(courseId);
        questions = await questionsData.getQuestionsByCourseId(courseId);
        labels = course.labels



        for (const question of questions) {
            question.labels = question.labels.map(labelId =>
                labels.find(label => label._id.toString() === labelId.toString())
            );

            const tempUser = await usersData.getUserById(question.user_id);
            question.user = {
                first_name: tempUser.first_name,
                last_name: tempUser.last_name
            };

            let tempTimeAgo = moment(question.created_time).fromNow()
            question.timeAgo = tempTimeAgo

            delete question.embedding
            delete question.canonical_key
            delete question.replies
        }

        return res.render('main/course', {
            layout: 'main',
            title: `${course.course_id} ${course.course_name}`,
            page: `Course ${course.course_id} ${course.course_name}`,
            path: `/ courses / ${course.course_id}`,
            selectedCourse: courseId.toString(),
            courses: courses,
            course: course,
            questions: questions,
        });

    } catch (error) {
        console.error("/main/courses Error:", error);
        return handleError(res, error);
    }
});


router.get('/courses/:id/filters', async (req, res) => {
    let { question, user_name, status_open, status_closed, labels } = req.query;

    let courses = [];
    let courseId;
    let course;
    let questions = []
    let labelsArray = []
    const userSesData = req.session.user;

    try {

        if (question) {
            question = validator.isValidString(question, "query.question")
        }

        if (user_name) {
            user_name = validator.isValidString(user_name, "query.user_name")
        }

        if (status_open) {
            status_open = validator.isValidString(status_open, "query.status_open")
        }

        if (status_closed) {
            status_closed = validator.isValidString(status_closed, "query.status_closed")
        }

        if (labels && labels.length > 0) {
            if (!Array.isArray(labels)) {
                labels = [labels];
            }
            labels = labels.map(label => {
                validator.isValidMongoId(label, "query.label");
                return label;
            });
        }

        courseId = validator.isValidMongoId(req.params.id, "req.params.id");

        if (userSesData.role == "professor") {
            const professorId = validator.isValidMongoId(userSesData.id, "userSesData.id");
            courses = await coursesData.getCourseByProfessorId(professorId);
        } else {
            const studentId = validator.isValidMongoId(userSesData.id, "userSesData.id");
            courses = await coursesData.getCourseByStudentId(studentId)
        }

        courses = courses.map(course => ({
            _id: course._id.toString(),
            course_id: course.course_id,
            course_name: course.course_name
        }))

        course = await coursesData.getCourseById(courseId);
        questions = await questionsData.getQuestionsByCourseIdFiltered(courseId, { question, status_open, status_closed, labels });
        labelsArray = course.labels

        const questionsFiltered = [];

        for (const question of questions) {
            const tempUser = await usersData.getUserById(question.user_id)
            if (user_name) {
                const fullName = `${tempUser.first_name} ${tempUser.last_name}`.toLowerCase()
                if (!fullName.includes(user_name.toLowerCase())) continue
            }
            question.labels = question.labels.map(labelId =>
                labelsArray.find(label => label._id.toString() === labelId.toString())
            );
            question.user = { first_name: tempUser.first_name, last_name: tempUser.last_name }
            question.timeAgo = moment(question.created_time).fromNow()

            delete question.embedding
            delete question.canonical_key
            delete question.replies

            questionsFiltered.push(question)
        }

        return res.render('main/course', {
            layout: 'main',
            title: `${course.course_id} ${course.course_name}`,
            page: `Course ${course.course_id} ${course.course_name}`,
            path: `/ courses / ${course.course_id}`,
            selectedCourse: courseId.toString(),
            courses: courses,
            course: course,
            questions: questionsFiltered,
        });


    } catch (error) {
        return handleError(res, error);
    }
});


// Course Management
router.get('/management/course', async (req, res) => {

    const userSesData = req.session.user;
    let courses = [];

    try {
        const professorId = validator.isValidMongoId(userSesData.id);

        courses = await coursesData.getCourseByProfessorId(professorId);

        courses.forEach(course => {
            delete course.enrolled_students;
        });

        return res.render('main/management/course', {
            layout: 'main',
            title: 'Course Management',
            page: "Course Management",
            path: '/ management / course',
            courses: courses,
        });
    } catch (error) {
        console.error("/main/management/course Error:", error);
        return handleError(res, error);
    }
});

// Student Management
router.get('/management/student', async (req, res) => {

    const userSesData = req.session.user;
    let courses = [];
    let students = []

    try {
        const professorId = validator.isValidMongoId(userSesData.id);

        courses = await coursesData.getCourseByProfessorId(professorId);

        for (const course of courses) {
            const tempStudentArr = await getAllStudentsByCourseId(course._id);
            students.push(...tempStudentArr);
        }

        return res.render('main/management/student', {
            layout: 'main',
            title: 'Student Management',
            page: "Student Management",
            path: '/ management / student',
            students: students,
            courses: courses,

        });
    } catch (error) {
        console.error("/main/management/student Error:", error);
        return handleError(res, error);
    }
});

// Analytics
router.get('/analytics', async (req, res) => {

    const userSesData = req.session.user;
    let courses = [];

    try {
        const professorId = validator.isValidMongoId(userSesData.id);

        courses = await coursesData.getCourseByProfessorId(professorId);

        courses = courses.map(course => ({
            _id: course._id.toString(),
            course_id: course.course_id,
            course_name: course.course_name
        }))

        return res.render('main/analytics', {
            layout: 'main',
            title: 'Analytics',
            page: "Analytics",
            path: '/ analytics',
            courses: courses,
        });
    } catch (error) {
        console.error("/main/analytics Error:", error);
        return handleError(res, error);
    }
});

// Profile
router.get('/profile', async (req, res) => {

    const userSesData = req.session.user;
    let courses = [];

    try {
        if (userSesData.role == "professor") {
            const professorId = validator.isValidMongoId(userSesData.id);
            courses = await coursesData.getCourseByProfessorId(professorId);
        } else {
            const studentId = validator.isValidMongoId(userSesData.id);
            courses = await coursesData.getCourseByStudentId(studentId)
        }

        courses = courses.map(course => ({
            _id: course._id.toString(),
            course_id: course.course_id,
            course_name: course.course_name
        }))

        return res.render('main/profile', {
            layout: 'main',
            title: 'Profile',
            page: "Profile",
            path: '/ profile',
            courses: courses,
        });
    } catch (error) {
        console.error("/main/profile Error:", error);
        return handleError(res, error);
    }
});

export default router;
