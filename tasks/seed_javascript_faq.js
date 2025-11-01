// seeds/seed_js_faq.js
import * as questionUtils from "../mongoUtils/questionUtils.js";
import * as validator from "../validator.js";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Read datasets/javascript_faq.txt, extract the numbered questions,
 * and insert them into the questions collection (with embeddings)
 */
const seedJavaScriptFAQ = async () => {
    const filePath = path.resolve(__dirname, "../datasets/javascript_faq.txt");
    console.log(filePath);
    const fileData = (await fs.readFile(filePath, "utf-8")).split("\n");
    let confirmCount = 0;
    for (let line = 0; line < fileData.length; line++) {
        let lineData = fileData[line];
        const linePattern = /^\d+./.exec(lineData);

        if (linePattern !== null) {
            lineData = lineData.replace(linePattern[0], "");
            lineData = validator.isValidString(lineData);
            try {
                console.log(`\n Trying to insert question ${lineData}`);
                await questionUtils.createQuestion(lineData, "CS546");
                confirmCount += 1;
            } catch (e) {
                console.log(e);
            }
        }
    }
    return confirmCount;
};
export default seedJavaScriptFAQ;
