import { questions } from "../config/mongoCollections.js";

/**
 * Creates the vector index for the vector store
 */
export const createVectorIndex = async () => {
    const coll = await questions();

    const indexName = "vector_index";
    const index = {
        name: indexName,
        type: "vectorSearch",
        definition: {
            fields: [
                {
                    type: "vector",
                    path: "embedding",
                    similarity: "euclidean",
                    numDimensions: 1024,
                },
            ],
        },
    };

    try {
        await coll.dropSearchIndex(indexName);
    } catch {}

    console.log("VECTOR DATABASE IS CREATING THE INDEX PLEASE WAIT........");
    await new Promise((r) => setTimeout(r, 3500)); // allow Atlas to index

    await coll.createSearchIndex(index);
};
