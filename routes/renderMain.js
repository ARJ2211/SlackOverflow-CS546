import { Router } from 'express';
import * as coursesData from "../mongoUtils/courseUtils.js";
import * as questionsData from "../mongoUtils/questionUtils.js";

import * as validator from "../utils/validator.js";
import { handleError, getCoursesForProfessor } from "../utils/helperFunctions.js";

const router = Router();

// Dashboard 
router.get('/dashboard', async (req, res) => {

    const userData = req.session.user;
    let courses = [];

    try {
        courses = await getCoursesForProfessor(userData, coursesData);


        return res.render('main/dashboard', {
            layout: 'main',
            title: 'Dashboard',
            page: "Dashboard",
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

    const userData = req.session.user;

    try {

        courseId = validator.isValidMongoId(req.params.id);
        courses = await getCoursesForProfessor(userData, coursesData);

        course = await coursesData.getCourseById(courseId);
        questions = await questionsData.getQuestionsByCourseId(courseId);

        return res.render('main/course', {
            layout: 'main',
            title: `${course.course_id} ${course.course_name}`,
            page: `Course ${course.course_id} ${course.course_name}`,
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

    const userData = req.session.user;
    let courses = [];

    try {
        courses = await getCoursesForProfessor(userData, coursesData);

        return res.render('main/management/course', {
            layout: 'main',
            title: 'Course Management',
            page: "Course Management",
            courses: courses,
        });
    } catch (error) {
        console.error("/main/management/course Error:", error);
        return handleError(res, error);
    }
});

// Student Management
router.get('/management/student', async (req, res) => {

    const userData = req.session.user;
    let courses = [];

    try {
        courses = await getCoursesForProfessor(userData, coursesData);

        return res.render('main/management/student', {
            layout: 'main',
            title: 'Student Management',
            page: "Student Management",
            courses: courses,
        });
    } catch (error) {
        console.error("/main/management/student Error:", error);
        return handleError(res, error);
    }
});

// Analytics
router.get('/analytics', async (req, res) => {

    const userData = req.session.user;
    let courses = [];

    try {
        courses = await getCoursesForProfessor(userData, coursesData);

        return res.render('main/analytics', {
            layout: 'main',
            title: 'Analytics',
            page: "Analytics",
            courses: courses,
        });
    } catch (error) {
        console.error("/main/analytics Error:", error);
        return handleError(res, error);
    }
});

// Profile
router.get('/profile', async (req, res) => {

    const userData = req.session.user;
    let courses = [];

    try {
        courses = await getCoursesForProfessor(userData, coursesData);

        return res.render('main/profile', {
            layout: 'main',
            title: 'Profile',
            page: "Profile",
            courses: courses,
        });
    } catch (error) {
        console.error("/main/profile Error:", error);
        return handleError(res, error);
    }
});

export default router;
