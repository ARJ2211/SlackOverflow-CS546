import { Router } from "express";
import * as coursesData from "../data/course.js";
import * as questionsData from "../data/question.js";

import * as validator from "../utils/validator.js";
import { handleError } from "../utils/helperFunctions.js";
import { getAllStudentsByCourseId } from "../data/students.js";
import * as usersData from "../data/users.js";
import moment from "moment";
import * as answersData from "../data/answer.js";

const router = Router();

// Dashboard
router.get("/dashboard", async (req, res) => {
    const userSesData = req.session.user;
    let courses = [];

    try {
        if (userSesData.role == "professor") {
            const professorId = validator.isValidMongoId(userSesData.id);
            courses = await coursesData.getCourseByProfessorId(professorId);
        } else {
            const studentId = validator.isValidMongoId(userSesData.id);
            courses = await coursesData.getCourseByStudentId(studentId);
        }

        courses = courses.map((course) => ({
            _id: course._id.toString(),
            course_id: course.course_id,
            course_name: course.course_name,
        }));

        return res.render("main/dashboard", {
            layout: "main",
            title: "Dashboard",
            page: "Dashboard",
            path: "/ dashboard",
            courses: courses,
        });
    } catch (error) {
        console.error("/main/dashboard Error:", error);
        return handleError(res, error);
    }
});

// Course/:id
router.get("/courses/:id", async (req, res) => {
    let courses = [];
    let courseId;
    let course;
    let questions = [];
    let labels = [];
    const userSesData = req.session.user;

    try {
        courseId = validator.isValidMongoId(req.params.id, "req.params.id");

        if (userSesData.role == "professor") {
            const professorId = validator.isValidMongoId(
                userSesData.id,
                "userSesData.id"
            );
            courses = await coursesData.getCourseByProfessorId(professorId);
        } else {
            const studentId = validator.isValidMongoId(
                userSesData.id,
                "userSesData.id"
            );
            courses = await coursesData.getCourseByStudentId(studentId);
        }

        courses = courses.map((course) => ({
            _id: course._id.toString(),
            course_id: course.course_id,
            course_name: course.course_name,
        }));

        course = await coursesData.getCourseById(courseId);
        questions = await questionsData.getQuestionsByCourseId(courseId);
        labels = course.labels;

        for (const question of questions) {
            question.labels = question.labels.map((labelId) =>
                labels.find(
                    (label) => label._id.toString() === labelId.toString()
                )
            );

            const tempUser = await usersData.getUserById(question.user_id);
            question.user = {
                first_name: tempUser.first_name,
                last_name: tempUser.last_name,
            };

            let tempTimeAgo = moment(question.created_time).fromNow();
            question.timeAgo = tempTimeAgo;

            question.hasUpvoted = question.up_votes.some(
                (id) => id.toString() === userSesData.id.toString()
            );

            question.hasViewed = question.views.some(
                (id) => id.toString() === userSesData.id.toString()
            );

            question.hasAnswered = question.answer_count.some(
                (id) => id.toString() === userSesData.id.toString()
            );

            question.hasBookmarked = question.bookmarks.some(
                (id) => id.toString() === userSesData.id.toString()
            );

            delete question.embedding;
            delete question.canonical_key;
            delete question.replies;
        }

        return res.render("main/course", {
            layout: "main",
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

router.get("/courses/:id/filters", async (req, res) => {
    let { question, user_name, status_open, status_closed, labels } = req.query;

    let courses = [];
    let courseId;
    let course;
    let questions = [];
    let labelsArray = [];
    const userSesData = req.session.user;

    try {
        if (question) {
            question = validator.isValidString(question, "query.question");
        }

        if (user_name) {
            user_name = validator.isValidString(user_name, "query.user_name");
        }

        if (status_open) {
            status_open = validator.isValidString(
                status_open,
                "query.status_open"
            );
        }

        if (status_closed) {
            status_closed = validator.isValidString(
                status_closed,
                "query.status_closed"
            );
        }

        if (labels && labels.length > 0) {
            if (!Array.isArray(labels)) {
                labels = [labels];
            }
            labels = labels.map((label) => {
                validator.isValidMongoId(label, "query.label");
                return label;
            });
        }

        courseId = validator.isValidMongoId(req.params.id, "req.params.id");

        if (userSesData.role == "professor") {
            const professorId = validator.isValidMongoId(
                userSesData.id,
                "userSesData.id"
            );
            courses = await coursesData.getCourseByProfessorId(professorId);
        } else {
            const studentId = validator.isValidMongoId(
                userSesData.id,
                "userSesData.id"
            );
            courses = await coursesData.getCourseByStudentId(studentId);
        }

        courses = courses.map((course) => ({
            _id: course._id.toString(),
            course_id: course.course_id,
            course_name: course.course_name,
        }));

        course = await coursesData.getCourseById(courseId);
        questions = await questionsData.getQuestionsByCourseIdFiltered(
            courseId,
            { question, status_open, status_closed, labels }
        );
        labelsArray = course.labels;

        const questionsFiltered = [];

        for (const question of questions) {
            const tempUser = await usersData.getUserById(question.user_id);
            if (user_name) {
                const fullName =
                    `${tempUser.first_name} ${tempUser.last_name}`.toLowerCase();
                if (!fullName.includes(user_name.toLowerCase())) continue;
            }
            question.labels = question.labels.map((labelId) =>
                labelsArray.find(
                    (label) => label._id.toString() === labelId.toString()
                )
            );
            question.user = {
                first_name: tempUser.first_name,
                last_name: tempUser.last_name,
            };
            question.timeAgo = moment(question.created_time).fromNow();

            question.hasUpvoted = question.up_votes.some(
                (id) => id.toString() === userSesData.id.toString()
            );

            question.hasViewed = question.views.some(
                (id) => id.toString() === userSesData.id.toString()
            );

            question.hasAnswered = question.answer_count.some(
                (id) => id.toString() === userSesData.id.toString()
            );

            question.hasBookmarked = question.bookmarks.some(
                (id) => id.toString() === userSesData.id.toString()
            );

            delete question.embedding;
            delete question.canonical_key;
            delete question.replies;

            questionsFiltered.push(question);
        }

        return res.render("main/course", {
            layout: "main",
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

router.get("/question/:id", async (req, res) => {
    const userSesData = req.session.user;
    let courses = [];
    let question;
    let course;
    let questionId;
    let courseLabels = [];
    let answers = [];
    let views;
    let isTa = false;
    try {
        questionId = validator.isValidMongoId(req.params.id, "req.params.id");

        question = await questionsData.getQuestionById(questionId);
        course = await coursesData.getCourseById(question.course);
        courseLabels = course.labels;

        if (userSesData.role === "student") {
            const student = course.enrolled_students.find(
                (student) =>
                    student.user_id.toString() === userSesData.id.toString()
            );
            if (student && student.is_ta) {
                isTa = student.is_ta;
            }
        }

        question.labels = question.labels.map((labelId) =>
            courseLabels.find(
                (label) => label._id.toString() === labelId.toString()
            )
        );

        const tempUser = await usersData.getUserById(question.user_id);
        question.user = {
            first_name: tempUser.first_name,
            last_name: tempUser.last_name,
        };

        let tempTimeAgo = moment(question.created_time).fromNow();
        question.timeAgo = tempTimeAgo;

        delete question.embedding;
        delete question.canonical_key;

        answers = await answersData.getAnswersByQuestionId(questionId);

        for (const answer of answers) {
            const tempAnswerUser = await usersData.getUserById(answer.user_id);
            answer.user = {
                _id: tempAnswerUser._id.toString(),
                first_name: tempAnswerUser.first_name,
                last_name: tempAnswerUser.last_name,
            };

            let tempAnswerTimeAgo = moment(answer.created_at).fromNow();
            answer.timeAgo = tempAnswerTimeAgo;
        }

        if (userSesData.role == "professor") {
            const professorId = validator.isValidMongoId(userSesData.id);
            courses = await coursesData.getCourseByProfessorId(professorId);
        } else {
            const studentId = validator.isValidMongoId(userSesData.id);
            courses = await coursesData.getCourseByStudentId(studentId);
        }

        courses = courses.map((course) => ({
            _id: course._id.toString(),
            course_id: course.course_id,
            course_name: course.course_name,
        }));

        views = await questionsData.updateViews(questionId, userSesData.id);

        const hasUpvoted = question.up_votes.some(
            (id) => id.toString() === userSesData.id.toString()
        );

        const hasViewed = views.some(
            (id) => id.toString() === userSesData.id.toString()
        );

        const hasAnswered = question.answer_count.some(
            (id) => id.toString() === userSesData.id.toString()
        );

        const hasBookmarked = question.bookmarks.some(
            (id) => id.toString() === userSesData.id.toString()
        );

        return res.render("main/question", {
            layout: "main",
            title: "Question Thread",
            page: "Question",
            path: `/ courses / ${course.course_id} / question`,
            courses: courses,
            question: question,
            question_id: question._id.toString(),
            answers: answers,
            course: course,
            views: views,
            hasUpvoted,
            hasViewed,
            hasAnswered,
            hasBookmarked,
            isTa,
            selectedCourse: course._id.toString(),
        });
    } catch (error) {
        console.error("/main/question/:id Error:", error);
        return handleError(res, error);
    }
});

// Course Management
router.get("/management/course", async (req, res) => {
    const userSesData = req.session.user;
    if (userSesData.role === "student") {
        return res.redirect("/main/dashboard");
    }
    let courses = [];

    try {
        const professorId = validator.isValidMongoId(userSesData.id);

        courses = await coursesData.getCourseByProfessorId(professorId);

        courses.forEach((course) => {
            delete course.enrolled_students;
        });

        return res.render("main/management/course", {
            layout: "main",
            title: "Course Management",
            page: "Course Management",
            path: "/ management / course",
            courses: courses,
        });
    } catch (error) {
        console.error("/main/management/course Error:", error);
        return handleError(res, error);
    }
});

// Student Management
router.get("/management/student", async (req, res) => {
    const userSesData = req.session.user;
    if (userSesData.role === "student") {
        return res.redirect("/main/dashboard");
    }
    let courses = [];
    let students = [];

    try {
        const professorId = validator.isValidMongoId(userSesData.id);

        courses = await coursesData.getCourseByProfessorId(professorId);

        for (const course of courses) {
            const tempStudentArr = await getAllStudentsByCourseId(course._id);
            students.push(...tempStudentArr);
        }

        return res.render("main/management/student", {
            layout: "main",
            title: "Student Management",
            page: "Student Management",
            path: "/ management / student",
            students: students,
            courses: courses,
        });
    } catch (error) {
        console.error("/main/management/student Error:", error);
        return handleError(res, error);
    }
});

// Analytics
router.get("/analytics", async (req, res) => {
    const userSesData = req.session.user;
    let courses = [];

    try {
        const professorId = validator.isValidMongoId(userSesData.id);

        courses = await coursesData.getCourseByProfessorId(professorId);

        courses = courses.map((course) => ({
            _id: course._id.toString(),
            course_id: course.course_id,
            course_name: course.course_name,
        }));

        // query params (optional) – default to "all"
        const selectedCourse = req.query.courseId || "all";
        const selectedRange = req.query.range || "7d";

        return res.render("main/analytics", {
            layout: "main",
            title: "Analytics",
            page: "Analytics",
            path: "/ analytics",
            courses,
            selectedCourse,
            selectedRange,
            hasSelectedCourse: selectedCourse !== "all",
        });
    } catch (error) {
        console.error("/main/analytics Error:", error);
        return handleError(res, error);
    }
});

/**
 * Build a dummy analytics payload that only includes fields
 * actually used by the frontend.
 */
const buildDummyAnalyticsPayload = (courses, courseId, range) => {
    const courseCount = courses.length;

    // Summary analytics
    const analytics = {
        totalTaCount: 6,
        taActiveCourses: courseCount,
        totalStudentCount: 120 + courseCount * 12,
        totalQuestionCount: 450 + courseCount * 30,
        unansweredCount: 42,
        unansweredPercent: 9.4,
        avgResponseTime: "1h 12m",
        fastestCourse: courseCount
            ? {
                  course_id: courses[0].course_id,
                  value: "22m",
              }
            : null,
        slowestCourse:
            courseCount > 1
                ? {
                      course_id: courses[courses.length - 1].course_id,
                      value: "3h 47m",
                  }
                : null,
    };

    // TA analytics table
    const taAnalytics = [
        {
            name: "Jane Doe",
            email: "jane.doe@stevens.edu",
            answeredCount: 122,
            avgResponseTime: "39m",
            lastActive: "5 minutes ago",
        },
        {
            name: "Alex Lee",
            email: "alex.lee@stevens.edu",
            answeredCount: 96,
            avgResponseTime: "1h 7m",
            lastActive: "24 minutes ago",
        },
        {
            name: "Priya Sharma",
            email: "priya.sharma@stevens.edu",
            answeredCount: 81,
            avgResponseTime: "1h 44m",
            lastActive: "1 hour ago",
        },
        {
            name: "Michael Green",
            email: "m.green@stevens.edu",
            answeredCount: 64,
            avgResponseTime: "52m",
            lastActive: "3 hours ago",
        },
        {
            name: "Sara Kim",
            email: "sara.kim@stevens.edu",
            answeredCount: 47,
            avgResponseTime: "28m",
            lastActive: "12 minutes ago",
        },
        {
            name: "David Xu",
            email: "d.xu@stevens.edu",
            answeredCount: 103,
            avgResponseTime: "1h 21m",
            lastActive: "8 minutes ago",
        },
    ];

    // TA activity per course
    const taActivityByCourse = courses.map((c, idx) => {
        const base = 40 + idx * 15; // total questions
        return {
            course_id: c.course_id,
            course_name: c.course_name,
            totalQuestions: base,
            tas: [
                {
                    name: "Jane Doe",
                    answersPercent: 35,
                    answerCount: Math.floor(base * 0.35),
                },
                {
                    name: "Alex Lee",
                    answersPercent: 22,
                    answerCount: Math.floor(base * 0.22),
                },
                {
                    name: "Priya Sharma",
                    answersPercent: 18,
                    answerCount: Math.floor(base * 0.18),
                },
                {
                    name: "Michael Green",
                    answersPercent: 15,
                    answerCount: Math.floor(base * 0.15),
                },
                {
                    name: "Sara Kim",
                    answersPercent: 6,
                    answerCount: Math.floor(base * 0.06),
                },
                {
                    name: "David Xu",
                    answersPercent: 4,
                    answerCount: Math.floor(base * 0.04),
                },
            ],
        };
    });

    // Student activity
    const firstCourseId = courses[0]?.course_id;
    const secondCourseId = courses[1]?.course_id || firstCourseId;
    const thirdCourseId = courses[2]?.course_id || firstCourseId;

    const studentActivity = [
        {
            name: "Rohan Patel",
            email: "rp99@stevens.edu",
            course_id: firstCourseId,
            questionsAsked: 14,
            answeredCount: 12,
            lastQuestion: "1 day ago",
        },
        {
            name: "Emily Zhang",
            email: "ezhang@stevens.edu",
            course_id: secondCourseId,
            questionsAsked: 11,
            answeredCount: 10,
            lastQuestion: "6 hours ago",
        },
        {
            name: "Matthew Blake",
            email: "mblake@stevens.edu",
            course_id: thirdCourseId,
            questionsAsked: 9,
            answeredCount: 7,
            lastQuestion: "3 days ago",
        },
        {
            name: "Jia Chen",
            email: "jchen@stevens.edu",
            course_id: firstCourseId,
            questionsAsked: 8,
            answeredCount: 8,
            lastQuestion: "4 hours ago",
        },
        {
            name: "Samir Gupta",
            email: "sgupta@stevens.edu",
            course_id: secondCourseId,
            questionsAsked: 7,
            answeredCount: 5,
            lastQuestion: "2 days ago",
        },
        {
            name: "Ava Thompson",
            email: "athompson@stevens.edu",
            course_id: thirdCourseId,
            questionsAsked: 7,
            answeredCount: 6,
            lastQuestion: "5 hours ago",
        },
        {
            name: "Ryan Lee",
            email: "rlee23@stevens.edu",
            course_id: firstCourseId,
            questionsAsked: 6,
            answeredCount: 6,
            lastQuestion: "1 hour ago",
        },
        {
            name: "Nina Ahmed",
            email: "nahmed@stevens.edu",
            course_id: secondCourseId,
            questionsAsked: 6,
            answeredCount: 4,
            lastQuestion: "3 hours ago",
        },
        {
            name: "Omar Suliman",
            email: "osuliman@stevens.edu",
            course_id: thirdCourseId,
            questionsAsked: 5,
            answeredCount: 4,
            lastQuestion: "2 days ago",
        },
        {
            name: "Chloe Rivera",
            email: "crivera@stevens.edu",
            course_id: firstCourseId,
            questionsAsked: 5,
            answeredCount: 5,
            lastQuestion: "7 hours ago",
        },
        {
            name: "Leo Martinez",
            email: "leo.m@stevens.edu",
            course_id: secondCourseId,
            questionsAsked: 4,
            answeredCount: 3,
            lastQuestion: "5 days ago",
        },
        {
            name: "Hannah Wells",
            email: "hwells@stevens.edu",
            course_id: secondCourseId,
            questionsAsked: 4,
            answeredCount: 4,
            lastQuestion: "9 hours ago",
        },
    ];

    // Trending labels
    const trendingLabels = [
        { name: "assignment 1", count: 26, colorClass: "bg-emerald-400" },
        { name: "mongodb", count: 21, colorClass: "bg-blue-400" },
        { name: "react", count: 18, colorClass: "bg-indigo-400" },
        { name: "express", count: 17, colorClass: "bg-violet-400" },
        { name: "async/await", count: 14, colorClass: "bg-rose-400" },
        { name: "promises", count: 13, colorClass: "bg-amber-400" },
        { name: "vector search", count: 11, colorClass: "bg-teal-400" },
        { name: "jwt", count: 10, colorClass: "bg-orange-400" },
        { name: "deployment", count: 8, colorClass: "bg-red-400" },
        { name: "final exam", count: 7, colorClass: "bg-lime-500" },
    ];

    return {
        success: true,
        courseId,
        range,
        analytics,
        taAnalytics,
        taActivityByCourse,
        studentActivity,
        trendingLabels,
    };
};

router.get("/analytics/data", async (req, res) => {
    const userSesData = req.session.user;

    try {
        if (!userSesData) {
            return res.status(401).json({
                success: false,
                message: "User not logged in",
            });
        }

        const professorId = validator.isValidMongoId(userSesData.id);
        const courseId = req.query.courseId || "all";
        const range = req.query.range || "30d";

        const rawCourses = await coursesData.getCourseByProfessorId(
            professorId
        );
        const courses = rawCourses.map((course) => ({
            _id: course._id.toString(),
            course_id: course.course_id,
            course_name: course.course_name,
        }));

        // if a specific course is selected, filter down
        const filteredCourses =
            courseId === "all"
                ? courses
                : courses.filter((c) => c._id === courseId);

        const payload = buildDummyAnalyticsPayload(
            filteredCourses,
            courseId,
            range
        );

        return res.json(payload);
    } catch (error) {
        console.error("/main/analytics/data Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch analytics data",
        });
    }
});

// Profile
router.get("/profile", async (req, res) => {
    const userSesData = req.session.user;
    let courses = [];

    try {
        if (userSesData.role == "professor") {
            const professorId = validator.isValidMongoId(userSesData.id);
            courses = await coursesData.getCourseByProfessorId(professorId);
        } else {
            const studentId = validator.isValidMongoId(userSesData.id);
            courses = await coursesData.getCourseByStudentId(studentId);
        }

        courses = courses.map((course) => ({
            _id: course._id.toString(),
            course_id: course.course_id,
            course_name: course.course_name,
        }));

        return res.render("main/profile", {
            layout: "main",
            title: "Profile",
            page: "Profile",
            path: "/ profile",
            courses: courses,
        });
    } catch (error) {
        console.error("/main/profile Error:", error);
        return handleError(res, error);
    }
});

// Bookmarks
router.get("/bookmarks", async (req, res) => {
    const userSesData = req.session.user;
    let courses = [];
    let bookmarkedQuestions = [];

    try {
        const userId = validator.isValidMongoId(userSesData.id);

        // Get user's courses for sidebar
        if (userSesData.role == "professor") {
            const professorId = validator.isValidMongoId(userSesData.id);
            courses = await coursesData.getCourseByProfessorId(professorId);
        } else {
            const studentId = validator.isValidMongoId(userSesData.id);
            courses = await coursesData.getCourseByStudentId(studentId);
        }

        courses = courses.map((course) => ({
            _id: course._id.toString(),
            course_id: course.course_id,
            course_name: course.course_name,
        }));

        // Get bookmarked questions
        bookmarkedQuestions =
            await questionsData.getBookmarkedQuestionsByUserId(userId);

        // Enrich bookmarked questions with course info, labels, user info, and bookmark date
        for (const question of bookmarkedQuestions) {
            // Get course information
            const course = await coursesData.getCourseById(question.course);
            question.courseInfo = {
                _id: course._id.toString(),
                course_id: course.course_id,
                course_name: course.course_name,
            };

            // Get labels
            question.labels = question.labels
                .map((labelId) =>
                    course.labels.find(
                        (label) => label._id.toString() === labelId.toString()
                    )
                )
                .filter((label) => label !== undefined);

            // Get user information
            const tempUser = await usersData.getUserById(question.user_id);
            question.user = {
                first_name: tempUser.first_name,
                last_name: tempUser.last_name,
            };

            // Format time ago
            question.timeAgo = moment(question.created_time).fromNow();

            // Calculate votes (check both upvotes and up_votes for compatibility)
            question.votes =
                (question.upvotes && question.upvotes.length) ||
                (question.up_votes && question.up_votes.length) ||
                0;

            // Get bookmark date (we'll use created_time as bookmark date for now)
            // In a real implementation, you might want to track when the bookmark was added
            question.bookmarkDate = moment(question.created_time).format(
                "MMMM Do YYYY, h:mm:ss a"
            );

            // Clean up unnecessary fields
            delete question.embedding;
            delete question.canonical_key;
            delete question.replies;
        }

        return res.render("main/bookmarks", {
            layout: "main",
            title: "My Bookmarks",
            page: "Bookmarks",
            path: "/ bookmarks",
            courses: courses,
            bookmarks: bookmarkedQuestions,
        });
    } catch (error) {
        console.error("/main/bookmarks Error:", error);
        return handleError(res, error);
    }
});

export default router;
