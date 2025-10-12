import { pipeline } from "@xenova/transformers";

/**
 * Get the embeddings for some piece of
 * text document. Returns the embeddings
 * @param {*} data
 * @returns {Array}
 */
export async function getEmbedding(data) {
    try {
        const embedder = await pipeline(
            "feature-extraction",
            "Xenova/e5-large-v2"
        );
        const results = await embedder(data, {
            pooling: "mean",
            normalize: true,
        });
        return Array.from(results.data);
    } catch (e) {
        throw e;
    }
}
