import { pipeline, env } from "@xenova/transformers";

// load from disk only
env.localModelPath = "./models"; //
env.allowRemoteModels = false;

const MODEL_ID = "Xenova/bge-large-en-v1.5";

// reuse the pipeline (don’t reload every call)
let embedderPromise;
async function getEmbedder() {
    if (!embedderPromise) {
        embedderPromise = pipeline("feature-extraction", MODEL_ID);
    }
    return embedderPromise;
}

/**
 * Get the embeddings for some piece of
 * text document. Returns the embeddings
 * @param {*} data
 * @returns {Array}
 */
export async function getEmbedding(text, { isQuery = true } = {}) {
    const embedder = await getEmbedder();
    const input = isQuery ? `query: ${text}` : `passage: ${text}`;
    const out = await embedder(input, { pooling: "mean", normalize: true });
    return Array.from(out.data); // length ~ 1024
}
