/**
 * Normalizes a string by lowercasing, replacing non-word chars with spaces,
 * collapsing repeated spaces, and trimming.
 * @param {*} s
 * @returns {string}
 */
export const Normalize = (s) =>
    s
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

/**
 * Returns normalized tokens (length > 1) from the input string.
 * @param {*} s
 * @returns {Array<string>}
 */
export const Tokens = (s) =>
    Normalize(s)
        .split(" ")
        .filter((t) => t.length > 1);

/**
 * Computes Jaccard similarity between two token arrays.
 * @param {*} aTokens
 * @param {*} bTokens
 * @returns {number}
 */
export const Jaccard = (aTokens, bTokens) => {
    const A = new Set(aTokens);
    const B = new Set(bTokens);
    let inter = 0;
    for (const x of A) if (B.has(x)) inter++;
    const union = A.size + B.size - inter;
    return union ? inter / union : 0;
};
