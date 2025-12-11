import {
    answers as answersCollection,
    questions as questionsCollection,
    users as usersCollection,
    courses as coursesCollection,
} from "../config/mongoCollections.js ";

import moment from "moment";
import * as validator from "../utils/validator.js";
import { ObjectId } from "mongodb";


const getAnalyticsData = async (professorId, courseId, range) => {


    validator.isValidMongoId(professorId);
    validator.isValidString(range)

    let rangeStart;

    if (range) {
        const match = /^(\d+)d$/.exec(range.trim());

        if (match) {
            const days = parseInt(match[1], 10);

            if (!isNaN(days) && days > 0) {
                rangeStart = moment().subtract(days, "days").toDate();
            }
        }
    }


    const coursesColl = await coursesCollection();
    const questionsColl = await questionsCollection();
    const answersColl = await answersCollection();
    const usersColl = await usersCollection();

    const professorCourses = await coursesColl
        .find({ created_by: professorId })
        .toArray();

    let courses;
    let currentCourse

    if (courseId === 'all') {
        courses = professorCourses
        return {
            success: true,
            courseId,
            range,
            analytics: {},
            taAnalytics: [],
            taActivityByCourse: [],
            studentActivity: [],
            trendingLabels: []
        };
    } else {
        courseId = validator.isValidMongoId(courseId);
        courses = professorCourses.filter((course) => course._id.equals(courseId));
        currentCourse = professorCourses.filter((course) => course._id.equals(courseId))[0];
    }

    const courseCount = courses.length;



    const totalTaCount = courses.reduce((total, course) => {
        const tasInCourse = course.enrolled_students?.filter(student => student.is_ta === true).length || 0;
        return total + tasInCourse;
    }, 0)

    const totalStudentCount = courses.reduce((total, course) => {
        const studentsInCourse = course.enrolled_students?.filter(student => student.is_ta === false).length || 0;
        return total + studentsInCourse;
    }, 0)


    const totalQuestionQuery = { course: courseId };
    if (rangeStart) {
        totalQuestionQuery.created_time = { $gte: rangeStart };
    }

    const totalQuestionCount = await questionsColl.countDocuments(totalQuestionQuery);

    const unansweredQuery = { course: courseId, status: "open" };
    if (rangeStart) {
        unansweredQuery.created_time = { $gte: rangeStart };
    }

    const unansweredCount = await questionsColl.countDocuments(unansweredQuery);
    const unansweredPercent = totalQuestionCount > 0
        ? ((unansweredCount / totalQuestionCount) * 100).toFixed(2)
        : 0;

    const formatTime = (totalMinutes) => {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);
        return `${hours}h ${minutes}m`;
    };

    let avgPerCourse = []

    for (const course of professorCourses) {

        const closedQuery = { course: course._id, status: "closed" };
        if (rangeStart) {
            closedQuery.created_time = { $gte: rangeStart };
        }

        const closedQuestionsPerCourse = await questionsColl.find(closedQuery).toArray();
        let totalMinutesPerCourse = 0;

        for (const question of closedQuestionsPerCourse) {

            if (question.status == "open") continue

            if (question.accepted_answer_id == null || question.accepted_answer_id.length <= 0) continue

            const answer = await answersColl.findOne({ _id: question.accepted_answer_id[0] })

            if (answer) {
                const diffMs = new Date(answer.created_at) - new Date(question.created_time)
                totalMinutesPerCourse += diffMs / 1000 / 60
            }
        }

        const totalAvgMinutesPerCourse = closedQuestionsPerCourse.length > 0
            ? Math.round(totalMinutesPerCourse / closedQuestionsPerCourse.length)
            : 0;

        avgPerCourse.push({ course_id: course._id, value: totalAvgMinutesPerCourse })
    }

    avgPerCourse.sort((a, b) => a.value - b.value)

    const courseAvg = avgPerCourse.find(course => {
        if (!course.course_id) return false;
        return course.course_id.equals(courseId);
    });

    let avgResponseTime = courseAvg ? formatTime(courseAvg.value) : ''

    let fastestCourseResult = avgPerCourse[0]
    let slowestCourseResult = avgPerCourse[avgPerCourse.length - 1]

    // Summary analytics
    const analytics = {
        totalTaCount: totalTaCount,
        taActiveCourses: courseCount,
        totalStudentCount: totalStudentCount,
        totalQuestionCount: totalQuestionCount,
        unansweredCount: unansweredCount,
        unansweredPercent: unansweredPercent,
        avgResponseTime: avgResponseTime,
        fastestCourse: fastestCourseResult,
        slowestCourse: slowestCourseResult
    };

    let taAnalytics = []

    let courseQuestions = []
    let questionMap = {}
    let questionIds = []

    if (currentCourse) {
        const courseQuestionQuery = { course: currentCourse._id }
        if (rangeStart) {
            courseQuestionQuery.created_time = { $gte: rangeStart }
        }

        courseQuestions = await questionsColl.find(courseQuestionQuery).project({ _id: 1, created_time: 1, user_id: 1, labels: 1 }).toArray()

        questionMap = {};
        questionIds = courseQuestions.map(question => {
            questionMap[question._id.toString()] = question
            return question._id
        });
    }


    if (currentCourse) {
        const tas = currentCourse.enrolled_students?.filter(student => student.is_ta === true) || [];

        for (const ta of tas) {
            const taUser = await usersColl.findOne({ _id: ta.user_id });

            const taAnswerQuery = {
                user_id: ta.user_id,
                question_id: { $in: questionIds }
            };

            if (rangeStart) {
                taAnswerQuery.created_at = { $gte: rangeStart };
            }

            const taAnswers = await answersColl.find(taAnswerQuery).sort({ created_at: -1 }).toArray();

            const answeredCount = taAnswers.length;

            let totalMinutes = 0
            let count = 0

            for (const answer of taAnswers) {
                const question = questionMap[answer.question_id.toString()];

                if (!question) continue;

                const diffMs = new Date(answer.created_at) - new Date(question.created_time);
                const minutes = diffMs / 1000 / 60;

                if (minutes > 0) {
                    totalMinutes += minutes;
                    count++;
                }
            }
            const avgMinutes = count > 0 ? Math.round(totalMinutes / count) : 0;
            const avgResponseTime = formatTime(avgMinutes);

            let lastActive = "No activity";
            if (taAnswers.length > 0) {
                lastActive = moment(taAnswers[0].created_at).fromNow();
            }

            taAnalytics.push({
                name: `${taUser.first_name} ${taUser.last_name}`,
                email: taUser.email,
                answeredCount,
                avgResponseTime,
                lastActive
            });
        }
        taAnalytics.sort((a, b) => b.answeredCount - a.answeredCount);
    }



    let taActivityByCourse = [];

    if (currentCourse) {

        const totalQuestions = questionIds.length;

        const tas = currentCourse.enrolled_students?.filter(student => student.is_ta === true) || [];

        let tasActivity = [];

        for (const ta of tas) {
            const taUser = await usersColl.findOne({ _id: ta.user_id });

            const taActivityAnswerQuery = {
                user_id: ta.user_id,
                question_id: { $in: questionIds }
            };

            if (rangeStart) {
                taActivityAnswerQuery.created_at = { $gte: rangeStart };
            }

            const answerCount = await answersColl.countDocuments(taActivityAnswerQuery);

            const answersPercent = totalQuestions > 0 ? ((answerCount / totalQuestions) * 100).toFixed(2) : "0";

            tasActivity.push({
                name: `${taUser.first_name} ${taUser.last_name}`,
                answerCount,
                answersPercent: answersPercent
            });
        }

        taActivityByCourse.push({
            course_id: currentCourse.course_id,
            course_name: currentCourse.course_name,
            totalQuestions,
            tas: tasActivity
        });

    }


    let studentActivity = []

    if (currentCourse) {

        const students = currentCourse.enrolled_students?.filter(student => student.is_ta === false) || []

        for (const student of students) {
            const studentUser = await usersColl.findOne({ _id: student.user_id })

            if (!studentUser) continue
            const studentQuestions = courseQuestions.filter(question => question.user_id.toString() === student.user_id.toString())
            const questionsAsked = studentQuestions.length

            const studentAnswerQuery = {
                user_id: student.user_id,
                question_id: { $in: questionIds }
            };

            if (rangeStart) {
                studentAnswerQuery.created_at = { $gte: rangeStart };
            }

            const answeredCount = await answersColl.countDocuments(studentAnswerQuery)

            let lastQuestion = "No questions"

            if (studentQuestions.length > 0) {
                lastQuestion = moment(studentQuestions[0].created_time).fromNow()
            }

            studentActivity.push({
                name: `${studentUser.first_name} ${studentUser.last_name}`,
                email: studentUser.email,
                course_id: currentCourse.course_id,
                questionsAsked,
                answeredCount,
                lastQuestion
            });
        }

        studentActivity.sort((a, b) => b.questionsAsked - a.questionsAsked);

    }


    let trendingLabels = []

    if (currentCourse) {

        const labelMap = {}
        for (const label of currentCourse.labels || []) {
            labelMap[label._id.toString()] = label.name
        }

        const labelCountMap = {}

        for (const question of courseQuestions) {
            if (!question.labels || !Array.isArray(question.labels)) continue

            for (const labelId of question.labels) {
                const id = labelId.toString()

                if (!labelCountMap[id]) {
                    labelCountMap[id] = 1
                }
                else {
                    labelCountMap[id]++
                }
            }
        }

        let labelArray = Object.entries(labelCountMap).map(([id, count]) => ({
            id,
            name: labelMap[id] || "Unknown",
            count
        }))

        labelArray.sort((a, b) => b.count - a.count)

        const colors = [
            "bg-emerald-400", "bg-blue-400", "bg-indigo-400", "bg-violet-400",
            "bg-rose-400", "bg-amber-400", "bg-teal-400", "bg-orange-400",
            "bg-red-400", "bg-lime-500"
        ]

        trendingLabels = labelArray.map((item, index) => ({
            name: item.name,
            count: item.count,
            colorClass: colors[index % colors.length]
        }));
    }

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
}

export { getAnalyticsData }