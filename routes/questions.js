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
    .route("/:id/answer")
    .post(async (req, res) => {

        let answer;
        let answer_delta
        let answer_content
        let user_id
        let is_accepted

        let question_id = req.params.id;

        try {
            question_id = validator.isValidMongoId(question_id, "question_id");
            answer = validator.isValidString(req.body.answer, "answer");
            answer_delta = validator.isValidString(req.body.answer_delta, "answer_delta");
            answer_content = validator.isValidString(req.body.answer_content, "answer_content");
            user_id = validator.isValidMongoId(req.body.user_id, "user_id");
            is_accepted = Boolean(req.body.is_accepted);
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
                await questionsData.updateAnswerCount(question_id);
            }

            return res.status(200).json({ message: "Answer added to the question" });
        } catch (e) {
            e.status = 404
            return handleError(res, e)
        }

    });

router
    .route("/:id/votes")
    .patch(async (req, res) => {
        let user_id = req.body.user_id;
        let question_id = req.params.id;

        try {
            question_id = validator.isValidMongoId(question_id, "question_id");
            user_id = validator.isValidMongoId(user_id, "user_id");
        } catch (e) {
            e.status = 400
            return handleError(res, e)
        }

        try {
            const updatedVotes = await questionsData.updateUpVotes(question_id, user_id);
            return res.status(200).json({ message: "Vote recorded successfully" });
        } catch (e) {
            e.status = 404
            return handleError(res, e)
        }

    })




export default router;
