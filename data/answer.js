import { answers } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import * as validator from "../utils/validator.js";

/**
 * create answer 
 * @param {string} questionId
 * @param {string} answer
 * @param {string} created_by
 * @returns {Object}
 */

export const createAnswer = async (question_id, answer, answer_delta, answer_content, user_id, is_accepted) => {

    const answersColl = await answers();


    question_id = validator.isValidMongoId(question_id, "question_id");
    answer = validator.isValidString(answer, "answer");
    answer_delta = validator.isValidString(answer_delta, "answer_delta");
    answer_content = validator.isValidString(answer_content, "answer_content");
    user_id = validator.isValidMongoId(user_id, "user_id");
    is_accepted = validator.isValidBoolean(is_accepted, "is_accepted");



    const answerDoc = {
        question_id,
        answer,
        answer_delta,
        answer_content,
        user_id,
        is_accepted,
        created_at: new Date(),
    };

    const insertInfo = await answersColl.insertOne(answerDoc);

    if (!insertInfo.insertedId) {
        throw `failed to create answer`;
    }

    const newAnswer = await answersColl.findOne({
        _id: insertInfo.insertedId,
    });

    return newAnswer;
};


/**
 * get answer by id
 * @param {string} answerId 
 * @returns {Object} 
 */
export const getAnswerById = async (answerId) => {
    const answersColl = await answers();
    answerId = validator.isValidString(answerId);

    let answerObjectId;
    try {
        answerObjectId = new ObjectId(answerId);
    } catch (e) {
        throw `ERROR: answerId is not a valid ObjectId`;
    }

    const answerDoc = await answersColl.findOne({ _id: answerObjectId });
    if (!answerDoc) {
        throw `answer not found!`;
    }

    return answerDoc;
};


/**
 * get all answers for a specific question
 * @param {string} questionId  
 * @returns {Array}  
 */
export const getAnswersByQuestionId = async (questionId) => {
    const answersColl = await answers();
    questionId = validator.isValidMongoId(questionId);

    const answersList = await answersColl
        .find({ question_id: questionId })
        .toArray();

    return answersList;
};


/**
 * update answer 
 * @param {string} answerId
 * @param {Object} updateAnswer
 * @returns {Object}
 */
export const updateAnswer = async (answerId, updateAnswer) => {
    const answersColl = await answers();
    const updateFields = {};
    answerId = validator.isValidMongoId(answerId, "answerId");

    if (updateAnswer.answer) {
        updateAnswer.answer = validator.isValidString(updateAnswer.answer, "answer")
        updateFields.answer = updateAnswer.answer
    }

    if (updateAnswer.answer_content) {
        updateAnswer.answer_content = validator.isValidString(updateAnswer.answer_content, "answer_content")
        updateFields.answer_content = updateAnswer.answer_content
    }

    if (updateAnswer.answer_delta) {
        updateAnswer.answer_delta = validator.isValidString(updateAnswer.answer_delta, "answer_delta")
        updateFields.answer_delta = updateAnswer.answer_delta

    }

    if (updateAnswer.is_accepted) {
        is_accepted = validator.isValidBoolean(updateAnswer.is_accepted, "is_accepted")
        updateFields.is_accepted = updateAnswer.is_accepted
    }

    if (updateAnswer.user_id) {
        updateAnswer.user_id = validator.isValidMongoId(updateAnswer.user_id, "user_id")
        updateFields.user_id = updateAnswer.user_id
    }

    const existingAnswer = await answersColl.findOne({ _id: answerId });

    if (!existingAnswer) {
        throw `answer not found!`;
    }


    if (Object.keys(updateFields).length === 0) {
        throw `ERROR: no valid fields to update`;
    }

    const updateInfo = await answersColl.updateOne(
        { _id: answerId },
        { $set: updateFields }
    );

    if (updateInfo.modifiedCount === 0) {
        throw `500 failed to update answer!`;
    }

    const updatedAnswer = await answersColl.findOne({ _id: answerId })
    return updatedAnswer
};



/**
 * delete answer by id
 * @param {string} answerId 
 * @returns {Object} 
 */
export const deleteAnswer = async (answerId, user_id) => {

    answerId = validator.isValidMongoId(answerId);
    user_id = validator.isValidMongoId(user_id);

    const answersColl = await answers();

    const existingAnswer = await answersColl.findOne({ _id: answerId });
    if (!existingAnswer) {
        throw `answer not found!`;
    }

    if (existingAnswer.user_id.toString() !== user_id.toString()) {
        throw "You are not allowed to delete this answer."
    }
    const deleteInfo = await answersColl.deleteOne({ _id: answerId });

    if (deleteInfo.deletedCount === 0) {
        throw `failed to delete answer!`;
    }

    return {
        answerId: answerId,
        message: "Answer successfully deleted",
    };
};