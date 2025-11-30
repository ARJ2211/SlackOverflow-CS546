import * as questionsData from "../data/question.js";
import * as answersData from "../data/answer.js";
import * as validator from "../utils/validator.js";
import { handleError } from "../utils/helperFunctions.js";
import { Router } from "express";

const router = Router();

router
    .route("/")
    .post(async (req, res) => {

        let answer;
        let answer_delta
        let answer_content
        let user_id
        let is_accepted
        let question_id
        let question_status

        try {
            question_id = validator.isValidMongoId(req.body.question_id, "question_id");
            answer = validator.isValidString(req.body.answer, "answer");
            answer_delta = validator.isValidString(req.body.answer_delta, "answer_delta");
            answer_content = validator.isValidString(req.body.answer_content, "answer_content");
            user_id = validator.isValidMongoId(req.body.user_id, "user_id");
            is_accepted = Boolean(req.body.is_accepted);
            question_status = validator.isValidString(req.body.question_status, "question_status");
        } catch (e) {
            e.status = 400
            return handleError(res, e)
        }

        try {
            const newAnswer = await answersData.createAnswer(
                question_id,
                answer,
                answer_delta,
                answer_content,
                user_id,
                is_accepted
            );

            if (newAnswer) {
                await questionsData.updateAnswerCount(question_id, user_id);
            }

            if (question_status === 'closed') {
                await questionsData.updateStatus(question_id, 'open');
            }


            return res.status(200).json({ message: "Answer added to the question" });
        } catch (e) {
            e.status = 404
            return handleError(res, e)
        }

    });


router
    .route("/:id")
    .patch(async (req, res) => {
        let answer_id = req.params.id;
        let { answer, answer_delta, answer_content, user_id, is_accepted, question_id } = req.body;

        try {
            answer_id = validator.isValidMongoId(answer_id, "answer_id");

            if (question_id) {
                question_id = validator.isValidMongoId(question_id, "question_id");
            }

            if (answer) {
                answer = validator.isValidString(answer, "answer");
            }

            if (answer_content) {
                answer_content = validator.isValidString(answer_content, "answer_content");
            }

            if (answer_delta) {
                answer_delta = validator.isValidString(answer_delta, "answer_delta");
            }

            if (is_accepted !== undefined && typeof is_accepted === 'boolean' && is_accepted != null) {
                is_accepted = validator.isValidBoolean(is_accepted, "is_accepted")
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
            await answersData.updateAnswer(answer_id, { answer, answer_delta, answer_content, user_id, is_accepted });

            if (is_accepted) {
                await questionsData.updateStatus(question_id, 'closed')
            }

            return res.status(200).json({ message: "Answer updated successfully" });
        } catch (e) {
            if (e.status) {
                e.status = 404
            }
            return handleError(res, e)
        }
    })
    .delete(async (req, res) => {
        let user_id = req.body.user_id;
        let answer_id = req.params.id;
        let question_id = req.body.question_id;
        let action = 'remove'

        try {
            answer_id = validator.isValidMongoId(answer_id, "answer_id");
            user_id = validator.isValidMongoId(user_id, "user_id")
            question_id = validator.isValidMongoId(question_id, "question_id")
        } catch (e) {
            e.status = 400
            return handleError(res, e)
        }

        try {
            await answersData.deleteAnswer(answer_id, user_id)
            await questionsData.updateAnswerCount(question_id, user_id, action)

            return res.status(200).json({ message: "Answer deleted successfully" })
        } catch (e) {
            e.status = 404
            return handleError(res, e)
        }

    })

export default router;

