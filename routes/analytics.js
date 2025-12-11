import { Router } from "express";

import * as usersData from "../data/users.js";
import * as answersData from "../data/answer.js";
import * as coursesData from "../data/course.js";
import * as questionsData from "../data/question.js";

import moment from "moment";
import * as validator from "../utils/validator.js";
import { handleError } from "../utils/helperFunctions.js";
import { getAnalyticsData } from "../data/analytics.js";

const router = Router();


router.get("/data", async (req, res) => {
    const userSesData = req.session.user;

    try {
        if (!userSesData) {
            return res.status(401).json({
                success: false,
                message: "User not logged in",
            });
        }

        const professorId = validator.isValidMongoId(userSesData.id);
        let courseId = req.query.courseId || "all";
        let range = req.query.range || "30d";

        if (courseId !== "all") {
            courseId = validator.isValidMongoId(courseId)
        }

        const payload = await getAnalyticsData(
            professorId,
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


export default router;
