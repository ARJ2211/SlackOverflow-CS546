import {
    Normalize,
    Jaccard,
    Tokens,
} from "../utils/ragUtils/jaccardNormalizer.js";
import { questions } from "../config/mongoCollections.js";
import { getEmbedding } from "../utils/ragUtils/getEmbeddings.js";
import * as validator from "../utils/validator.js";
import { answers } from "../config/mongoCollections.js";

const THRESOLD = 0.9;
const JACCARD_THRESHOLD = 0.65;

/**
 * Insert a question into the questions collection along with
 * the vector embeddings
 * @param {*} question
 * @returns {Object}
 */
export const createQuestion = async (
    question,
    course_id,
    user_id,
    labels = [],
    question_content,
    question_delta
) => {
    course_id = validator.isValidMongoId(course_id);
    question = validator.isValidString(question);
    question_content = validator.isValidString(question_content);
    question_delta = validator.isValidString(question_delta);

    const questionsColl = await questions();

    const canonical_key = Normalize(question);
    const exact = await questionsColl.findOne({ canonical_key });
    if (exact) {
        throw `ERROR: This question already exists (exact/near-exact match) for question ${exact.question}!`;
    }

    let embedding = await getEmbedding(question);

    await new Promise((r) => setTimeout(r, 1500)); // allow Atlas to index
    const prevSimilarQuestions = await searchQuestion(question);

    if (prevSimilarQuestions.length !== 0) {
        const best = prevSimilarQuestions[0];
        const jacScore = Jaccard(Tokens(question), Tokens(best.question));

        // only block if it's both semantically very close AND has high token overlap
        if (best.score >= THRESOLD && jacScore >= JACCARD_THRESHOLD) {
            throw `ERROR: This question already exists with score ${best.score} for question ${best.question}! JACCARD SORE: ${jacScore}`;
        }
    }

    const doc = {
        question,
        question_content,
        question_delta,
        embedding, // array of numbers for Atlas Vector Search
        canonical_key, // helps prevent trivial duplicates like punctuation/case changes
        created_time: new Date(),
        replies: [], // will be empty on create as no replies yet
        course: course_id,
        user_id: user_id,
        labels: labels,
        up_votes: [],
        bookmarks: [],
        accepted_answer_id: null,
        status: "open",
        answer_count: [],
        views: [],
    };

    const { insertedId } = await questionsColl.insertOne(doc);
    await new Promise((r) => setTimeout(r, 1500)); // allow Atlas to index
    const createdQuestion = await questionsColl.findOne({ _id: insertedId });
    return createdQuestion;
};

/**
 * Get the top 5 similar questions that the user has asked
 * @param {*} query
 * @param {*} param1
 * @returns
 */
export const searchQuestion = async (query, { k = 5, numCandidates } = {}) => {
    query = validator.isValidString(query);
    const questionsColl = await questions();
    const queryVector = await getEmbedding(query);
    const indexName = "vector_index";
    const candidates = numCandidates ?? Math.max(100, k * 20);

    const pipeline = [
        {
            $vectorSearch: {
                index: indexName,
                path: "embedding",
                queryVector,
                numCandidates: candidates,
                limit: k,
            },
        },
        {
            $project: {
                _id: 1,
                question: 1,
                createdAt: 1,
                score: { $meta: "vectorSearchScore" },
            },
        },
    ];

    const similarQuestions = await questionsColl.aggregate(pipeline).toArray();

    const qTokens = Tokens(query);
    for (const sq of similarQuestions) {
        sq.jaccard_score = Jaccard(qTokens, Tokens(sq.question));
        // re-rank scores cuz why not (best of both worlds)
        sq.combined_score = 0.8 * sq.score + 0.2 * sq.jaccard_score;
    }
    return similarQuestions;
};

/**
 * Update the collection based on the inputs provided. Returns the
 * newly updated object
 * @param {Object} filter
 * @param {Object} obj
 * @returns {Object}
 */
export const updateQuestion = async (filter, obj) => {
    const questionsColl = await questions();
    filter = validator.isValidObject(filter);
    obj = validator.isValidObject(obj);
    if (obj.hasOwnProperty("question")) {
        var new_question = obj.question;
        var canonical_key = Normalize(obj.question);
        let existingQuestion = await searchQuestion(obj.question);

        existingQuestion = existingQuestion.filter(
            (question) => question._id.toString() != filter._id.toString()
        );

        if (
            existingQuestion.length > 0 &&
            existingQuestion[0].score > THRESOLD
        ) {
            throw `ERROR: similar question already exists, ${existingQuestion[0].question}, score: ${existingQuestion[0].score}`;
        }
        var embedding = await getEmbedding(new_question);
        obj = { ...obj, embedding, canonical_key };
    }

    canonical_key;
    const updateObj = {
        $set: {
            ...obj,
        },
    };

    const updatedObj = await questionsColl.findOneAndUpdate(filter, updateObj, {
        returnDocument: "after",
    });
    if (!updateObj || updatedObj === null) throw `ERROR: document not updated.`;
    return updatedObj;
};

export const updateAnswerCount = async (questionId, userId, action = "add") => {
    questionId = validator.isValidMongoId(questionId);
    userId = validator.isValidMongoId(userId);

    const questionsColl = await questions();

    const question = await questionsColl.findOne({ _id: questionId });
    if (!question) {
        throw "Question not found";
    }

    let query;

    if (action == "remove") {
        const index = question.answer_count
            .map((id) => id.toString())
            .indexOf(userId.toString());
        if (index !== -1) {
            question.answer_count.splice(index, 1);
        }
        query = { $set: { answer_count: question.answer_count } };
    } else {
        query = { $push: { answer_count: userId } };
    }

    await questionsColl.updateOne({ _id: questionId }, query);

    const updatedQuestion = await questionsColl.findOne({ _id: questionId });

    return updatedQuestion.answer_count;
};

export const updateViews = async (questionId, userId) => {
    questionId = validator.isValidMongoId(questionId);
    userId = validator.isValidMongoId(userId);

    const questionsColl = await questions();

    const updateInfo = await questionsColl.updateOne(
        { _id: questionId },
        { $addToSet: { views: userId } }
    );

    const question = await questionsColl.findOne({ _id: questionId });

    return question.views;
};

export const updateUpVotes = async (questionId, userId) => {
    let query;

    questionId = validator.isValidMongoId(questionId);
    userId = validator.isValidMongoId(userId);

    const questionsColl = await questions();

    const question = await questionsColl.findOne({ _id: questionId });

    if (!question) {
        throw `Question ${questionId} not found`;
    }

    const hasUpvoted = question.up_votes
        .map((id) => id.toString())
        .includes(userId.toString());

    if (hasUpvoted) {
        query = { $pull: { up_votes: userId } };
    } else {
        query = { $addToSet: { up_votes: userId } };
    }
    const updateInfo = await questionsColl.updateOne(
        { _id: questionId },
        query
    );

    const updatedQuestion = await questionsColl.findOne({ _id: questionId });

    return updatedQuestion.up_votes;
};

export const updateStatus = async (questionId, status) => {
    questionId = validator.isValidMongoId(questionId);
    status = validator.isValidString(status);

    if (!(status == "open" || status == "closed")) {
        throw `Invalid Status: ${status}`;
    }

    const questionsColl = await questions();

    const updateInfo = await questionsColl.updateOne(
        { _id: questionId },
        { $set: { status: status } }
    );

    const question = await questionsColl.findOne({ _id: questionId });

    return question.status;
};

export const getQuestionById = async (questionId) => {
    questionId = validator.isValidMongoId(questionId);

    const questionsColl = await questions();
    const question = await questionsColl.findOne({ _id: questionId });

    return question;
};

/**
 * get all questions including course id.
 * @param {string} courseId
 * @returns {Array}
 */
export const getQuestionsByCourseId = async (courseId) => {
    courseId = validator.isValidMongoId(courseId);

    const questionsColl = await questions();
    const questionsArray = await questionsColl
        .find({ course: courseId })
        .sort({ created_time: -1 })
        .toArray();

    return questionsArray;
};

export const getQuestionsByCourseIdFiltered = async (courseId, filters) => {
    courseId = validator.isValidMongoId(courseId);

    let {
        question = "",
        status_open = "",
        status_closed = "",
        labels = [],
    } = filters;

    let query = { course: courseId };

    if (question.trim() !== "") {
        question = validator.isValidString(question);
        question = question.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        query.question = { $regex: new RegExp(question, "i") };
    }

    if (status_open && !status_closed) {
        query.status = "open";
    } else if (!status_open && status_closed) {
        query.status = "closed";
    }

    if (labels && labels.length > 0) {
        labels = labels.map((id) => {
            return validator.isValidMongoId(id, "query.labels");
        });

        query["labels"] = { $all: labels };
    }

    const questionsColl = await questions();
    const questionsArray = await questionsColl
        .find(query)
        .sort({ created_time: -1 })
        .toArray();

    return questionsArray;
};

/**
 * Get all questions bookmarked by a user
 * @param {string} userId
 * @returns {Array}
 */
export const getBookmarkedQuestionsByUserId = async (userId) => {
    userId = validator.isValidMongoId(userId);
    const questionsColl = await questions();
    const questionsArray = await questionsColl
        .find({ bookmarks: userId })
        .sort({ created_time: -1 })
        .toArray();
    return questionsArray;
};

/**
 * Add a bookmark to a question
 * @param {string} questionId
 * @param {string} userId
 * @returns {Object}
 */
export const addBookmark = async (questionId, userId) => {
    questionId = validator.isValidMongoId(questionId);
    userId = validator.isValidMongoId(userId);
    let query;

    const questionsColl = await questions();

    const question = await questionsColl.findOne({ _id: questionId });

    if (!question) {
        throw `Question ${questionId} not found`;
    }

    const hasBookmarked = question.bookmarks
        .map((id) => id.toString())
        .includes(userId.toString());

    if (hasBookmarked) {
        query = { $pull: { bookmarks: userId } };
    } else {
        query = { $addToSet: { bookmarks: userId } };
    }

    const updateResult = await questionsColl.updateOne(
        { _id: questionId },
        query
    );

    const updatedQuestion = await questionsColl.findOne({ _id: questionId });

    return updatedQuestion.bookmarks;
};

/**
 * Remove a bookmark from a question
 * @param {string} questionId
 * @param {string} userId
 * @returns {Object}
 */
export const removeBookmark = async (questionId, userId) => {
    questionId = validator.isValidMongoId(questionId);
    userId = validator.isValidMongoId(userId);
    const questionsColl = await questions();

    // Verify that the question exists before removing bookmark
    const question = await questionsColl.findOne({ _id: questionId });
    if (!question) {
        throw "Question not found";
    }

    // Check if user has bookmarked this question
    if (
        !question.bookmarks ||
        !question.bookmarks.some((id) => id.toString() === userId.toString())
    ) {
        throw "User has not bookmarked this question";
    }

    const updateResult = await questionsColl.updateOne(
        { _id: questionId },
        { $pull: { bookmarks: userId } }
    );
    if (updateResult.matchedCount === 0) {
        throw "Question not found";
    }
    return { success: true, message: "Bookmark removed successfully" };
};

/**
 * Delete a question from the questions collection.
 * @param {*} questionId
 * @returns {Object}
 */
export const deleteQuestion = async (questionId, user_id) => {
    questionId = validator.isValidMongoId(questionId, "question id");
    user_id = validator.isValidMongoId(user_id, "user id");

    const questionsColl = await questions();
    const answersColl = await answers();

    const question = await questionsColl.findOne({ _id: questionId });

    if (!question) {
        throw `Question ${questionId} not found`;
    }

    if (question.user_id.toString() !== user_id.toString()) {
        throw "You are not allowed to delete this question.";
    }

    await answersColl.deleteMany({ question_id: questionId });

    const deletedResult = await questionsColl.deleteOne({ _id: questionId });

    if (deletedResult.deletedCount === 0) {
        throw "Failed to delete question.";
    }

    return deletedResult;
};
