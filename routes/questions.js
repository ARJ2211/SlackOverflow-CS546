import * as coursesData from "../data/course.js";
import * as usersData from "../data/users.js";
import * as questionsData from "../data/question.js";
import * as answersData from "../data/answer.js";
import { getUserById } from "../data/users.js";
import * as validator from "../utils/validator.js";
import { handleError } from "../utils/helperFunctions.js";
import { Router } from "express";

const router = Router();

router
    .route("/")
    .post(async (req, res) => {

        let { labels, course_id, question, user_id, question_content, question_delta } = req.body;


        try {
            user_id = validator.isValidMongoId(user_id, "user_id");
            course_id = validator.isValidMongoId(course_id, "course_id");

            for (let i = 0; i < labels.length; i++) {
                labels[i] = validator.isValidMongoId(labels[i], `label ${i}`);
            }
            question = validator.isValidString(question);
            question_content = validator.isValidString(question_content);
            question_delta = validator.isValidString(question_delta);

        } catch (e) {
            return handleError(res, e)
        }

        try {
            await questionsData.createQuestion(
                question,
                course_id,
                user_id,
                labels,
                question_content,
                question_delta
            );
            return res.status(200).json({ message: 'Question created successfully' });
        } catch (e) {
            return handleError(res, e)
        }
    });

router
    .route("/:id")
    .patch(async (req, res) => {
        let question_id = req.params.id;
        let { question, question_delta, question_content, user_id, labels } = req.body;

        try {
            question_id = validator.isValidMongoId(question_id, "question_id");

            if (question) {
                question = validator.isValidString(question, "question");
            }

            if (question_content) {
                question_content = validator.isValidString(question_content, "question_content");
            }

            if (question_delta) {
                question_delta = validator.isValidString(question_delta, "question_delta");
            }

            if (labels && Array.isArray(labels) && labels.length > 0) {
                labels.map((label) => {
                    label = validator.isValidMongoId(label, "label");
                })
            }

            if (user_id) {
                user_id = validator.isValidMongoId(user_id, "user_id");
            }

        } catch (e) {
            if (e.status) {
                e.status = 400
            }
            return handleError(res, e)
        }

        try {
            await questionsData.updateQuestion({ _id: question_id }, { question, question_delta, question_content, user_id, labels });
            return res.status(200).json({ message: "Question updated successfully" });
        } catch (e) {
            return handleError(res, e)
        }
    })
    .delete(async (req, res) => {
        let user_id = req.body.user_id;
        let question_id = req.params.id;

        try {
            question_id = validator.isValidMongoId(question_id, "question_id");
            user_id = validator.isValidMongoId(user_id, "user_id");
        } catch (e) {
            if (e.status) {
                e.status = 400
            }
            return handleError(res, e)
        }

        try {
            await questionsData.deleteQuestion(question_id, user_id)
            return res.status(200).json({ message: "Question deleted successfully" })
        } catch (e) {
            if (e.status) {
                e.status = 404
            } return handleError(res, e)
        }

    })



router
    .route("/:id/votes")
    .patch(async (req, res) => {
        let user_id = req.body.user_id;
        let question_id = req.params.id;

        try {
            question_id = validator.isValidMongoId(question_id, "question_id");
            user_id = validator.isValidMongoId(user_id, "user_id");
        } catch (e) {
            if (e.status) {
                e.status = 400
            }
            return handleError(res, e)
        }

        try {
            const updatedVotes = await questionsData.updateUpVotes(question_id, user_id);
            return res.status(200).json({ message: "Vote recorded successfully" });
        } catch (e) {
            if (e.status) {
                e.status = 404
            }
            return handleError(res, e)
        }

    })

router
    .route("/:id/status")
    .patch(async (req, res) => {
        let question_id = req.params.id;
        let status = req.body.status;

        try {
            question_id = validator.isValidMongoId(question_id, "question_id");
            status = validator.isValidString(status, "status");
        } catch (e) {
            if (e.status) {
                e.status = 400
            }
            return handleError(res, e)
        }

        try {
            const updatedStatus = await questionsData.updateStatus(question_id, status);
            return res.status(200).json({ message: "Status changed successfully" });
        } catch (e) {
            if (e.status) {
                e.status = 404
            }
            return handleError(res, e)
        }
    })

router.post("/:id/bookmarks", async (req, res) => {
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

router.delete("/bookmarks", async (req, res) => {
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
