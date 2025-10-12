/**
 * Check if object is an array
 */
export const isArray = (val) => {
    if (!Array.isArray(val)) throw `object is not an array`;
    if (val.length === 0) throw `empty array`;
};
