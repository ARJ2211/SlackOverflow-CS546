import { questions } from "../config/mongoCollections.js";
import { getEmbedding } from "../ragUtils/getEmbeddings.js";
import * as validator from "../validator.js";

const THRESOLD = 0.9;

/**
 * Insert a question into the questions collection along with
 * the vector embeddings
 * @param {*} question
 * @returns {Object}
 */
export const createQuestion = async (question) => {
    question = validator.isValidString(question);

    const questionsColl = await questions();

    let embedding = await getEmbedding(question);

    const prevSimilarQuestions = await searchQuestion(question);
    if (prevSimilarQuestions.length !== 0) {
        const bestFirstScore = prevSimilarQuestions[0].score;
        if (bestFirstScore >= THRESOLD) {
            throw "Error: This question already exists!";
        }
    }
    const doc = {
        question,
        embedding, // array of numbers for Atlas Vector Search
        createdAt: new Date(),
    };

    const { insertedId } = await questionsColl.insertOne(doc);
    await new Promise((r) => setTimeout(r, 1500)); // Allow mongo Atlas to index the question
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

    return await questionsColl.aggregate(pipeline).toArray();
};
