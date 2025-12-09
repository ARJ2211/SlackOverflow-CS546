// seeds/seed_js_faq.js
import * as questionUtils from "../data/question.js";
import * as validator from "../utils/validator.js";
import { fileURLToPath } from "url";
import * as cliProgress from "cli-progress";
import colors from "ansi-colors";
import fs from "fs/promises";
import path from "path";
import { createCourse, addLabelToCourse } from "../data/course.js";
import { users } from "../config/mongoCollections.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const seedJavaScriptFAQ = async () => {
    const filePath = path.resolve(__dirname, "../datasets/javascript_faq.txt");
    console.log(filePath);
    const fileData = (await fs.readFile(filePath, "utf-8")).split("\n");

    const usersColl = await users();
    const creator = await usersColl.findOne({ email: "aayushrj22@gmail.com" });
    if (!creator) throw { status: 400, message: "No professor/admin found" };

    const courseName = "Web Programming I";
    const courseCode = "CS-546";

    // Try to create course; if it already exists, reuse it
    let courseDoc;
    try {
        courseDoc = await createCourse(
            courseName,
            courseCode,
            "Course Q&A for JavaScript basics",
            creator._id
        );
    } catch (e) {
        // If course already exists, fetch it instead of failing seeding
        if (e?.status === 409) {
            const courseColl = await (
                await import("../config/mongoCollections.js")
            ).courses();
            courseDoc = await courseColl.findOne({ course_id: courseCode });
        } else {
            throw e;
        }
    }

    // Ensure "General" label exists for this course
    const updatedCourse = await addLabelToCourse(
        courseDoc._id.toString(),
        "General"
    );
    const generalLabel =
        updatedCourse.labels?.find((l) => /^general$/i.test(l.name || "")) ||
        (() => {
            throw {
                status: 400,
                message: "Failed to create/find 'General' label",
            };
        })();

    const questionsList = [];
    for (let line = 0; line < fileData.length; line++) {
        let lineData = fileData[line];
        const linePattern = /^\d+\./.exec(lineData);
        if (linePattern !== null) {
            lineData = lineData.replace(linePattern[0], "");
            try {
                lineData = validator.isValidString(lineData);
                questionsList.push(lineData);
            } catch (_) {
                // skip invalid lines
            }
        }
    }

    const bar = new cliProgress.SingleBar(
        {
            format:
                "CLI Progress |" +
                colors.cyan("{bar}") +
                "| {percentage}% || {value}/{total} || {status}",
            barCompleteChar: "\u2588",
            barIncompleteChar: "\u2591",
            hideCursor: true,
            clearOnComplete: true,
            stopOnComplete: true,
            stream: process.stdout,
        },
        cliProgress.Presets.shades_classic
    );

    let confirmCount = 0;
    bar.start(questionsList.length, 0, { status: "" });

    for (const q of questionsList) {
        bar.update({ status: `Trying: ${q.slice(0, 80)}` });

        try {
            // Minimal Quill-like content/delta for seeded questions
            const questionContent = `<p>${q}</p>`;
            const questionDelta = JSON.stringify([{ insert: q + "\n" }]);

            // createQuestion(
            //   question,
            //   course_id,
            //   user_id,
            //   labels = [],
            //   question_content,
            //   question_delta
            // )
            await questionUtils.createQuestion(
                q,
                courseDoc._id.toString(),
                creator._id.toString(),
                [generalLabel._id.toString()],
                questionContent,
                questionDelta
            );

            confirmCount += 1;
            bar.increment(1, { status: `Inserted: ${q.slice(0, 60)}` });
        } catch (e) {
            const msg = String(e).replace(/\s+/g, " ").slice(0, 120);
            bar.increment(1, { status: `Skipped: ${msg}` });
        }
    }

    bar.stop();
    return confirmCount;
};

export default seedJavaScriptFAQ;
