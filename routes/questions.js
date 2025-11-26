import * as coursesData from "../data/course.js";
import * as usersData from "../data/users.js";
import * as questionsData from "../data/question.js";
import { getUserById } from "../data/users.js";
import * as validator from "../utils/validator.js";
import { handleError } from "../utils/helperFunctions.js";
import { Router } from "express";

const router = Router();

router
    .route("/")
    .post(async (req, res) => {

        let { labels, course_id, question, user_id } = req.body;


        try {
            user_id = validator.isValidMongoId(user_id, "user_id");
            course_id = validator.isValidMongoId(course_id, "course_id");

            for (let i = 0; i < labels.length; i++) {
                labels[i] = validator.isValidMongoId(labels[i], `label ${i}`);
            }
            question = validator.isValidString(question);

        } catch (e) {
            return handleError(res, e)
        }

        try {
            await questionsData.createQuestion(
                question,
                course_id,
                user_id,
                labels
            );
            return res.status(200).json({ message: 'Question created successfully' });
        } catch (e) {
            return handleError(res, e)
        }
    });

router.post("/bookmarks/:id", checkAuth, async (req, res) => {
    const userSesData = req.session.user;
    let questionId;
    let userId;

    try {
        if (!userSesData || !userSesData.id) {
            return res.status(401).json({ message: 'User session not found' });
        }
        questionId = validator.isValidMongoId(req.params.id, "questionId");
        userId = validator.isValidMongoId(userSesData.id, "userId");
    } catch (e) {
        return handleError(res, e);
    }

    try {
        await questionsData.addBookmark(questionId, userId);
        return res.status(200).json({ message: 'Bookmark added successfully' });
    } catch (e) {
        return handleError(res, e);
    }
});

router.delete("/bookmarks", checkAuth, async (req, res) => {
    const userSesData = req.session.user;
    let questionId;
    let userId;

    try {
        if (!userSesData || !userSesData.id) {
            return res.status(401).json({ message: 'User session not found' });
        }
        // Validate question_id from request body
        questionId = validator.isValidMongoId(req.body.question_id, "question_id");
        userId = validator.isValidMongoId(userSesData.id, "userId");
    } catch (e) {
        return handleError(res, e);
    }

    try {
        await questionsData.removeBookmark(questionId, userId);
        return res.status(200).json({ message: "Bookmark added successfully" });
    } catch (e) {
        return handleError(res, e);
    }
});



export default router;
