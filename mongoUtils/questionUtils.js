import { questions } from "../config/mongoCollections.js";
import { getEmbedding } from "../ragUtils/getEmbeddings.js";
import * as validator from "../validator.js";

/**
 * Insert a question into the questions collection along with
 * the vector embeddings
 * @param {*} question
 * @returns {Object}
 */
export const createQuestion = async (question) => {
    question = validator.isValidString(question);

    const questionsColl = await questions();

    const existing = await questionsColl.find({ question }).toArray();
    if (existing.length !== 0) return existing;

    let embedding = await getEmbedding(question);

    const doc = {
        question,
        embedding, // array of numbers for Atlas Vector Search
        createdAt: new Date(),
    };

    const { insertedId } = await questionsColl.insertOne(doc);
    const createdQuestion = await questionsColl.findOne({ _id: insertedId });
    return createdQuestion;
};
