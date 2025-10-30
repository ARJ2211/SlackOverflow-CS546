import { answers } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import * as validator from "../validator.js";

/**
 * create answer 
 * @param {string} questionId
 * @param {string} answer
 * @param {string} created_by
 * @returns {Object}
 */

export const createAnswer = async (questionId, answer, created_by) => {
    const answersColl = await answers();

    try {
        questionId = validator.isValidString(questionId);
    } catch (e) {
        throw `questionId: ${e}`;
    }


    try {
        answer = validator.isValidString(answer);
    } catch (e) {
        throw `answer: ${e}`;
    }

    try {
        created_by = validator.isValidString(created_by);
    } catch (e) {
        throw `created_by: ${e}`;
    }

    let questionObjectId;
    try {
        questionObjectId = new ObjectId(questionId);
    } catch (e) {
        throw `ERROR: questionId is not a valid ObjectId`;
    }

    let createdByObjectId;

    try {
        createdByObjectId = new ObjectId(created_by);
    } catch (e) {
        throw `ERROR: created_by is not a valid ObjectId`;
    }

    const answerDoc = {
        questionId: questionObjectId,
        answer,
        created_by: createdByObjectId,
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
    questionId = validator.isValidString(questionId);

    let questionObjectId;
    try {
        questionObjectId = new ObjectId(questionId);
    } catch (e) {
        throw `ERROR: questionId is not a valid ObjectId`;
    }

    const answersList = await answersColl
        .find({ questionId: questionObjectId })
        .sort({ created_at: -1 })
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
    answerId = validator.isValidString(answerId);
    updateAnswer = validator.isValidObject(updateAnswer);
    let answerObjectId;

    try {
        answerObjectId = new ObjectId(answerId);
    } catch (e) {
        throw `ERROR: answerId is not a valid ObjectId`;
    }

    const existingAnswer = await answersColl.findOne({ _id: answerObjectId });

    if (!existingAnswer) {
        throw `answer not found!`;
    }

    const updateFields = {};

    if (updateAnswer.questionId !== undefined) {
        try {
            const questionId = validator.isValidString(updateAnswer.questionId);
            updateFields.questionId = new ObjectId(questionId);
        } catch (e) {
            throw `questionId: ${e}`;
        }
    }

    if (updateAnswer.answer !== undefined) {
        try {
            updateFields.answer = validator.isValidString(updateAnswer.answer);
        } catch (e) {
            throw `answer: ${e}`;
        }
    }

    if (updateAnswer.created_by !== undefined) {
        try {
            const created_by = validator.isValidString(updateAnswer.created_by);
            updateFields.created_by = new ObjectId(created_by);
        } catch (e) {
            throw `created_by: ${e}`;
        }
    }

    if (Object.keys(updateFields).length === 0) {
        throw `ERROR: no valid fields to update`;
    }

    const updateInfo = await answersColl.updateOne(
        { _id: answerObjectId },
        { $set: updateFields }
    );

    if (updateInfo.modifiedCount === 0) {
        throw `500 failed to update answer!`;
    }

    const updatedAnswer = await answersColl.findOne({ _id: answerObjectId });
    return updatedAnswer;
};



/**
 * delete answer by id
 * @param {string} answerId 
 * @returns {Object} 
 */
export const deleteAnswer = async (answerId) => {
    const answersColl = await answers();
    answerId = validator.isValidString(answerId);

    let answerObjectId;
    try {
        answerObjectId = new ObjectId(answerId);
    } catch (e) {
        throw `ERROR: answerId is not a valid ObjectId`;
    }

    const existingAnswer = await answersColl.findOne({ _id: answerObjectId });
    if (!existingAnswer) {
        throw `answer not found!`;
    }

    const deleteInfo = await answersColl.deleteOne({ _id: answerObjectId });

    if (deleteInfo.deletedCount === 0) {
        throw `failed to delete answer!`;
    }

    return {
        answerId: answerId,
        message: "Answer successfully deleted",
    };
};