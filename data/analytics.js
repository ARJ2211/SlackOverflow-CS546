import {
    answers as answersCollection,
    questions as questionsCollection,
    users as usersCollection,
    courses as coursesCollection,
    sessions as sessionsCollection
} from "../config/mongoCollections.js";
import moment from "moment";
import * as validator from "../utils/validator.js";
import { ObjectId } from "mongodb";

const getAnalyticsData = async (professorId, courseId, range) => {
    validator.isValidMongoId(professorId);
    validator.isValidString(range);

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
    let currentCourse;

    if (courseId === "all") {
        courses = professorCourses;
        return {
            success: true,
            courseId,
            range,
            analytics: {},
            taAnalytics: [],
            taActivityByCourse: [],
            studentActivity: [],
            trendingLabels: [],
        };
    } else {
        courseId = validator.isValidMongoId(courseId);
        courses = professorCourses.filter((course) =>
            course._id.equals(courseId)
        );
        currentCourse = professorCourses.filter((course) =>
            course._id.equals(courseId)
        )[0];
    }

    const courseCount = courses.length;

    const totalTaCount = courses.reduce((total, course) => {
        const tasInCourse =
            course.enrolled_students?.filter(
                (student) => student.is_ta === true
            ).length || 0;
        return total + tasInCourse;
    }, 0);

    const totalStudentCount = courses.reduce((total, course) => {
        const studentsInCourse =
            course.enrolled_students?.filter(
                (student) => student.is_ta === false
            ).length || 0;
        return total + studentsInCourse;
    }, 0);

    const totalQuestionQuery = { course: courseId };
    if (rangeStart) {
        totalQuestionQuery.created_time = { $gte: rangeStart };
    }

    const totalQuestionCount = await questionsColl.countDocuments(
        totalQuestionQuery
    );

    const unansweredQuery = { course: courseId, status: "open" };
    if (rangeStart) {
        unansweredQuery.created_time = { $gte: rangeStart };
    }

    const unansweredCount = await questionsColl.countDocuments(unansweredQuery);
    const unansweredPercent =
        totalQuestionCount > 0
            ? ((unansweredCount / totalQuestionCount) * 100).toFixed(2)
            : "0.00";

    const formatTime = (totalMinutes) => {
        if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
            return "0h 0m";
        }
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);
        return `${hours}h ${minutes}m`;
    };

    let avgPerCourse = [];

    for (const course of professorCourses) {
        const closedQuery = { course: course._id, status: "closed" };
        if (rangeStart) {
            closedQuery.created_time = { $gte: rangeStart };
        }

        const closedQuestionsPerCourse = await questionsColl
            .find(closedQuery)
            .toArray();

        let totalMinutesPerCourse = 0;
        let answeredCountForAvg = 0;

        for (const question of closedQuestionsPerCourse) {
            if (
                !question.accepted_answer_id ||
                question.accepted_answer_id.length === 0
            ) {
                continue;
            }

            const acceptedAnswerId = question.accepted_answer_id[0];
            if (!acceptedAnswerId) continue;

            const answer = await answersColl.findOne({
                _id:
                    typeof acceptedAnswerId === "string"
                        ? new ObjectId(acceptedAnswerId)
                        : acceptedAnswerId,
            });

            if (!answer) continue;

            const diffMs =
                new Date(answer.created_at) - new Date(question.created_time);
            const minutes = diffMs / 1000 / 60;
            if (minutes > 0 && Number.isFinite(minutes)) {
                totalMinutesPerCourse += minutes;
                answeredCountForAvg++;
            }
        }

        const totalAvgMinutesPerCourse =
            answeredCountForAvg > 0
                ? Math.round(totalMinutesPerCourse / answeredCountForAvg)
                : 0;

        avgPerCourse.push({
            _id: course._id,
            course_id: course.course_id,
            value: totalAvgMinutesPerCourse,
        });
    }

    avgPerCourse = avgPerCourse.filter((c) => Number.isFinite(c.value));

    avgPerCourse.sort((a, b) => a.value - b.value);

    let courseAvg = null;
    if (avgPerCourse.length > 0) {
        courseAvg = avgPerCourse.find((course) => course._id.equals(courseId));
    }

    let avgResponseTime = "0h 0m";
    if (courseAvg && Number.isFinite(courseAvg.value) && courseAvg.value > 0) {
        avgResponseTime = formatTime(courseAvg.value);
    }

    let fastestCourseResult = null;
    let slowestCourseResult = null;

    if (avgPerCourse.length > 0) {
        const fastest = avgPerCourse[0];
        const slowest = avgPerCourse[avgPerCourse.length - 1];

        fastestCourseResult = {
            _id: fastest._id,
            course_id: fastest.course_id,
            value: formatTime(fastest.value),
        };

        slowestCourseResult = {
            _id: slowest._id,
            course_id: slowest.course_id,
            value: formatTime(slowest.value),
        };
    }

    const analytics = {
        totalTaCount,
        taActiveCourses: courseCount,
        totalStudentCount,
        totalQuestionCount,
        unansweredCount,
        unansweredPercent,
        avgResponseTime,
        fastestCourse: fastestCourseResult,
        slowestCourse: slowestCourseResult,
    };

    let taAnalytics = [];
    let courseQuestions = [];
    let questionMap = {};
    let questionIds = [];

    if (currentCourse) {
        const courseQuestionQuery = { course: currentCourse._id };
        if (rangeStart) {
            courseQuestionQuery.created_time = { $gte: rangeStart };
        }

        courseQuestions = await questionsColl
            .find(courseQuestionQuery)
            .project({ _id: 1, created_time: 1, user_id: 1, labels: 1 })
            .toArray();

        questionMap = {};
        questionIds = courseQuestions.map((question) => {
            questionMap[question._id.toString()] = question;
            return question._id;
        });
    }

    if (currentCourse) {
        const tas =
            currentCourse.enrolled_students?.filter(
                (student) => student.is_ta === true
            ) || [];

        for (const ta of tas) {
            const taUser = await usersColl.findOne({ _id: ta.user_id });
            if (!taUser) continue;

            const taAnswerQuery = {
                user_id: ta.user_id,
                question_id: { $in: questionIds },
            };

            if (rangeStart) {
                taAnswerQuery.created_at = { $gte: rangeStart };
            }

            const taAnswers = await answersColl
                .find(taAnswerQuery)
                .sort({ created_at: 1 })
                .toArray();

            const answeredQuestionIds = new Set();
            let totalMinutes = 0;

            for (const answer of taAnswers) {
                const qid = answer.question_id?.toString();
                if (!qid || answeredQuestionIds.has(qid)) continue;

                const question = questionMap[qid];
                if (!question) continue;

                const diffMs =
                    new Date(answer.created_at) -
                    new Date(question.created_time);
                const minutes = diffMs / 1000 / 60;

                if (minutes > 0 && Number.isFinite(minutes)) {
                    totalMinutes += minutes;
                    answeredQuestionIds.add(qid);
                }
            }

            const answeredCount = answeredQuestionIds.size;
            const avgMinutes =
                answeredCount > 0
                    ? Math.round(totalMinutes / answeredCount)
                    : 0;
            const taAvgResponseTime = formatTime(avgMinutes);

            let lastActive = "No activity";
            if (taAnswers.length > 0) {
                const last = taAnswers[taAnswers.length - 1].created_at;
                lastActive = moment(last).fromNow();
            }

            taAnalytics.push({
                name: `${taUser.first_name} ${taUser.last_name}`,
                email: taUser.email,
                answeredCount,
                avgResponseTime: taAvgResponseTime,
                lastActive,
            });
        }

        taAnalytics.sort((a, b) => b.answeredCount - a.answeredCount);
    }

    let taActivityByCourse = [];

    if (currentCourse) {
        const totalQuestions = questionIds.length;

        const tas =
            currentCourse.enrolled_students?.filter(
                (student) => student.is_ta === true
            ) || [];

        let tasActivity = [];

        for (const ta of tas) {
            const taUser = await usersColl.findOne({ _id: ta.user_id });
            if (!taUser) continue;

            const taActivityAnswerQuery = {
                user_id: ta.user_id,
                question_id: { $in: questionIds },
            };

            if (rangeStart) {
                taActivityAnswerQuery.created_at = { $gte: rangeStart };
            }

            const taActivityAnswers = await answersColl
                .find(taActivityAnswerQuery)
                .project({ question_id: 1 })
                .toArray();

            const answeredQuestionIds = new Set(
                taActivityAnswers
                    .map((a) => a.question_id && a.question_id.toString())
                    .filter(Boolean)
            );

            const answerCount = answeredQuestionIds.size;

            const answersPercent =
                totalQuestions > 0
                    ? ((answerCount / totalQuestions) * 100).toFixed(2)
                    : "0.00";

            tasActivity.push({
                name: `${taUser.first_name} ${taUser.last_name}`,
                answerCount,
                answersPercent,
            });
        }

        taActivityByCourse.push({
            course_id: currentCourse.course_id,
            course_name: currentCourse.course_name,
            totalQuestions,
            tas: tasActivity,
        });
    }

    let studentActivity = [];

    if (currentCourse) {
        const students =
            currentCourse.enrolled_students?.filter(
                (student) => student.is_ta === false
            ) || [];

        for (const student of students) {
            const studentUser = await usersColl.findOne({
                _id: student.user_id,
            });
            if (!studentUser) continue;

            const studentQuestions = courseQuestions.filter(
                (question) =>
                    question.user_id.toString() === student.user_id.toString()
            );

            const questionsAsked = studentQuestions.length;

            const studentAnswerQuery = {
                user_id: student.user_id,
                question_id: { $in: questionIds },
            };

            if (rangeStart) {
                studentAnswerQuery.created_at = { $gte: rangeStart };
            }

            const studentAnswers = await answersColl
                .find(studentAnswerQuery)
                .project({ question_id: 1 })
                .toArray();

            const answeredQuestionIds = new Set(
                studentAnswers
                    .map((a) => a.question_id && a.question_id.toString())
                    .filter(Boolean)
            );

            const answeredCount = answeredQuestionIds.size;

            let lastQuestion = "No questions";
            if (studentQuestions.length > 0) {
                let latest = studentQuestions[0].created_time;
                for (const q of studentQuestions) {
                    if (
                        q.created_time &&
                        new Date(q.created_time) > new Date(latest)
                    ) {
                        latest = q.created_time;
                    }
                }
                lastQuestion = moment(latest).fromNow();
            }

            studentActivity.push({
                name: `${studentUser.first_name} ${studentUser.last_name}`,
                email: studentUser.email,
                course_id: currentCourse.course_id,
                questionsAsked,
                answeredCount,
                lastQuestion,
            });
        }

        studentActivity.sort((a, b) => b.questionsAsked - a.questionsAsked);
    }

    let trendingLabels = [];

    if (currentCourse) {
        const labelMap = {};
        for (const label of currentCourse.labels || []) {
            labelMap[label._id.toString()] = label.name;
        }

        const labelCountMap = {};

        for (const question of courseQuestions) {
            if (!question.labels || !Array.isArray(question.labels)) continue;

            for (const labelId of question.labels) {
                const id = labelId.toString();
                if (!labelCountMap[id]) {
                    labelCountMap[id] = 1;
                } else {
                    labelCountMap[id]++;
                }
            }
        }

        let labelArray = Object.entries(labelCountMap).map(([id, count]) => ({
            id,
            name: labelMap[id] || "Unknown",
            count,
        }));

        labelArray.sort((a, b) => b.count - a.count);

        const colors = [
            "bg-emerald-400",
            "bg-blue-400",
            "bg-indigo-400",
            "bg-violet-400",
            "bg-rose-400",
            "bg-amber-400",
            "bg-teal-400",
            "bg-orange-400",
            "bg-red-400",
            "bg-lime-500",
        ];

        trendingLabels = labelArray.map((item, index) => ({
            name: item.name,
            count: item.count,
            colorClass: colors[index % colors.length],
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
};

const getDashboardData = async (userId, role) => {
    userId = validator.isValidMongoId(userId)
    role = validator.isValidString(role)

    const coursesColl = await coursesCollection()
    const questionsColl = await questionsCollection()
    const usersColl = await usersCollection()
    const sessionsColl = await sessionsCollection()

    let courses = [];

    if (role === "professor") {
        courses = await coursesColl.find({
            created_by: userId
        }).toArray()
    } else {
        courses = await coursesColl.find({
            "enrolled_students.user_id": userId
        }).toArray()
    }

    const courseIds = courses.map(course => course._id)

    const totalCourses = courses.length;
    let totalQuestions = 0
    if (courseIds.length > 0) {
        totalQuestions = await questionsColl.countDocuments({ course: { $in: courseIds } })
    }

    let totalTAs = 0;

    for (const course of courses) {
        const tas = course.enrolled_students?.filter(student => student.is_ta === true) || []
        totalTAs += tas.length
    }

    const activeUsers = await sessionsColl.countDocuments({
        expires: { $gt: new Date() },
        session: { $regex: `"lastSeen":` }
    });

    const courseMap = {};
    courses.forEach(course => {
        courseMap[course._id.toString()] = course.course_id;
    });


    const myQuestionsData = await questionsColl.find({
        user_id: userId,
        course: { $in: courseIds }
    }).sort({ created_time: -1 }).project({ title: 1, course: 1, question: 1, status: 1, created_time: 1 }).toArray();

    const myQuestions = myQuestionsData.map(question => ({
        _id: question._id.toString(),
        question: question.question,
        status: question.status,
        created_time: moment(question.created_time).fromNow(),
        courseCode: courseMap[question.course.toString()] || "---"
    }));

    const recentQuestionsData = await questionsColl
        .find({
            course: { $in: courseIds }
        }).sort({ created_time: -1 }).limit(10).project({ title: 1, course: 1, question: 1, status: 1, created_time: 1 }).toArray();

    const recentQuestions = recentQuestionsData.map(question => ({
        _id: question._id.toString(),
        question: question.question,
        status: question.status,
        created_time: moment(question.created_time).fromNow(),
        courseCode: courseMap[question.course.toString()] || "---"
    }));


    return {
        totalCourses,
        totalQuestions,
        totalTAs,
        activeUsers,
        myQuestions,
        recentQuestions
    }

}

export { getAnalyticsData, getDashboardData };
