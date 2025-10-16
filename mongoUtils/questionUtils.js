import { Normalize, Jaccard, Tokens } from "../ragUtils/jaccardNormalizer.js";
import { questions } from "../config/mongoCollections.js";
import { getEmbedding } from "../ragUtils/getEmbeddings.js";
import * as validator from "../validator.js";
import { fileURLToPath } from "url";

const THRESOLD = 0.9;
const JACCARD_THRESHOLD = 0.65;

/**
 * Insert a question into the questions collection along with
 * the vector embeddings
 * @param {*} question
 * @returns {Object}
 */
export const createQuestion = async (question, course) => {
    course = validator.isValidString(course); //TODO: This has to be a mongo ObjectID
    question = validator.isValidString(question);

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
        embedding, // array of numbers for Atlas Vector Search
        canonical_key, // helps prevent trivial duplicates like punctuation/case changes
        created_time: new Date(),
        replies: [], // will be empty on create as no replies yet
        course: course, // TODO: will need to get the course ID from the input params
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
        const existingQuestion = await searchQuestion(obj.question);
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

/**
 * Delete a question from the questions collection.
 * @param {*} questionId
 * @returns {Object}
 */
export const deleteQuestion = async (questionId) => {
    questionId = validator.isValidMongoId(questionId);
    const questionsColl = await questions();
    const deletedResult = await questionsColl.deleteOne({ _id: questionId });
    return deletedResult;
};
