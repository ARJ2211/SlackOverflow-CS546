// seeds/seed_js_faq.js
import * as questionUtils from "../mongoUtils/questionUtils.js";
import * as validator from "../validator.js";
import { fileURLToPath } from "url";
import * as cliProgress from "cli-progress";
import colors from "ansi-colors";
import fs from "fs/promises";
import path from "path";
import { createCourse, addLabelToCourse } from "../mongoUtils/courseUtils.js";
import { users, questions } from "../config/mongoCollections.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const seedJavaScriptFAQ = async () => {
    const filePath = path.resolve(__dirname, "../datasets/javascript_faq.txt");
    const lines = (await fs.readFile(filePath, "utf-8")).split("\n");

    const usersColl = await users();
    const creator =
        (await usersColl.findOne({ role: "professor" })) ||
        (await usersColl.findOne({ role: "admin" }));
    if (!creator) throw { status: 400, message: "No professor/admin found" };

    const courseName = "Web Programming I";
    const courseCode = "CS546";

    // just createCourse (existence checks handled elsewhere)
    const courseDoc = await createCourse(
        courseName,
        courseCode,
        "Course Q&A for JavaScript basics",
        creator._id
    );

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

    const qsColl = await questions();

    const questionsList = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const m = /^\d+\./.exec(line);
        if (m) {
            try {
                const q = validator.isValidString(line.replace(m[0], ""));
                questionsList.push(q);
            } catch {}
        }
    }

    const bar = new cliProgress.SingleBar(
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

    bar.start(questionsList.length, 0, { name: "" });

    const originalLog = console.log;
    console.log = () => {};

    let inserted = 0;
    try {
        for (const q of questionsList) {
            try {
                const created = await questionUtils.createQuestion(
                    q,
                    courseDoc._id.toString()
                );
                await qsColl.updateOne(
                    { _id: created._id },
                    {
                        $addToSet: { labels: generalLabel._id },
                        $set: { updated_at: new Date() },
                    }
                );
                inserted += 1;
                bar.increment(1, { name: q.slice(0, 40) });
            } catch {
                bar.increment(1, { name: "skipped" });
            }
        }
    } finally {
        bar.stop();
        console.log = originalLog;
    }

    return inserted;
};

export default seedJavaScriptFAQ;
