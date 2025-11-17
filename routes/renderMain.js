import { Router } from 'express';
import * as coursesData from "../mongoUtils/courseUtils.js";
import * as questionsData from "../mongoUtils/questionUtils.js";

import * as validator from "../utils/validator.js";
import { handleError } from "../utils/helperFunctions.js";
import { getAllStudentsByCourseId } from '../mongoUtils/studentsUtils.js';

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

    const userSesData = req.session.user;

    try {

        courseId = validator.isValidMongoId(req.params.id);

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

        course = await coursesData.getCourseById(courseId);
        questions = await questionsData.getQuestionsByCourseId(courseId);


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
