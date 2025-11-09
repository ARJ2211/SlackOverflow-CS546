import * as usersUtils from "../mongoUtils/usersUtils.js";
import * as validator from "../validator.js";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Function to seed the database for professors
 */
const seedProfessors = async () => {
    const jsonPath = path.resolve(__dirname, "../datasets/professors.json");
    let professorsData;

    try {
        const raw = await fs.readFile(jsonPath, "utf-8");
        professorsData = JSON.parse(raw);
    } catch (e) {
        console.error("Failed to read/parse JSON at:", jsonPath, e);
        throw e;
    }

    try {
        validator.isArray(professorsData);
        for (const elem of professorsData) {
            const full_name = elem.title.split(" ");
            const first_name = full_name[0];
            const last_name = full_name[full_name.length - 1];

            await usersUtils.createUser(
                first_name,
                last_name,
                elem.email,
                "professor"
            );
        }
        await usersUtils.createUser(
            "Dr.",
            "Aayush",
            "aayushrj22@gmail.com",
            "professor"
        );
    } catch (e) {
        console.log(e);
    }
    return professorsData.length;
};

export default seedProfessors;
