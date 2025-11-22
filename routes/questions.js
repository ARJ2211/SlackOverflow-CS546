import * as coursesData from "../mongoUtils/courseUtils.js";
import * as usersData from "../mongoUtils/usersUtils.js";
import * as questionsData from "../mongoUtils/questionUtils.js";
import { getUserById } from "../mongoUtils/usersUtils.js";
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




export default router;
