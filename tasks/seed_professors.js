import * as usersUtils from "../mongoUtils/usersUtils.js";
import * as validator from "../validator.js";
import { fileURLToPath } from "url";
import * as cliProgress from "cli-progress";
import colors from "ansi-colors";
import fs from "fs/promises";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Function to seed the database for professors
 */
const seedProfessors = async () => {
    // progress bar config (only progress bar behavior changed)
    const progressBar = new cliProgress.SingleBar(
        {
            format:
                "CLI Progress |" +
                colors.cyan("{bar}") +
                "| {percentage}% || {value}/{total} || {name}",
            barCompleteChar: "\u2588",
            barIncompleteChar: "\u2591",
            hideCursor: true,
            clearOnComplete: true,
            stopOnComplete: true,
            stream: process.stdout,
        },
        cliProgress.Presets.shades_classic
    );

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

        // start bar; +1 to include the extra manual user added later
        progressBar.start(professorsData.length + 1, 0, { name: "" });

        // silence console.log while the bar is active to avoid new lines
        const originalLog = console.log;
        console.log = () => {};

        try {
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

                // update the bar in place; no console.log per item
                progressBar.increment(1, {
                    name: `${first_name} ${last_name}`,
                });
            }

            await usersUtils.createUser(
                "Dr.",
                "Aayush",
                "aayushrj22@gmail.com",
                "professor"
            );

            // final increment for the manual user
            progressBar.increment(1, { name: "Dr. Aayush" });
        } finally {
            // stop/clear the bar line and restore logging
            progressBar.stop();
            console.log = originalLog;
        }
    } catch (e) {
        console.log(e);
    }
    return professorsData.length;
};

export default seedProfessors;
