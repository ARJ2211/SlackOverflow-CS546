import { professors } from "../config/mongoCollections.js";
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
    const professorsColl = await professors();
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
            const insertedData = await professorsColl.insertOne({
                Pname: elem.title,
                status: elem.status,
                email: elem.email,
                phone: elem.phone,
                office: elem.office,
                profilePicture: elem.image,
            });
            console.log(`inserted ${elem.title} as ${insertedData.insertedId}`);
        }
    } catch (e) {
        console.log(e);
    }
};

export default seedProfessors;
