import * as questionUtils from "../data/question.js";
import * as validator from "../utils/validator.js";
import { fileURLToPath } from "url";
import * as cliProgress from "cli-progress";
import colors from "ansi-colors";
import fs from "fs/promises";
import path from "path";
import { createCourse, addLabelToCourse } from "../data/course.js";
import { users } from "../config/mongoCollections.js";
import prompt from "prompt";
import { createUser } from "../data/users.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, "../datasets/javascript_faq.txt");

// tiny helper to use prompt with async/await
const promptGet = (schema) =>
    new Promise((resolve, reject) => {
        prompt.get(schema, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });

const getOrCreateProfessor = async () => {
    const { email } = await promptGet({
        properties: {
            email: {
                description: "Professor email",
                required: true,
                message: "Email is required",
            },
        },
    });

    const normalizedEmail = String(email).trim().toLowerCase();
    const usersColl = await users();

    // Case-insensitive lookup so it matches how createUser checks for duplicates
    let creator = await usersColl.findOne({
        email: new RegExp(`^${normalizedEmail}$`, "i"),
    });

    if (creator) {
        console.log(`Found existing professor with email: ${normalizedEmail}`);
        return creator;
    }

    console.log(
        `No user found with email ${normalizedEmail}. Creating a new professor user for testing...`
    );

    const { firstName, lastName } = await promptGet({
        properties: {
            firstName: {
                description: "First name",
                required: true,
                message: "First name is required",
            },
            lastName: {
                description: "Last name",
                required: true,
                message: "Last name is required",
            },
        },
    });

    const firstNameValidated = validator.isValidString(firstName, "first name");
    const lastNameValidated = validator.isValidString(lastName, "last name");
    const validatedEmail = validator.isValidEmail
        ? validator.isValidEmail(normalizedEmail)
        : normalizedEmail;

    const newUser = await createUser(
        firstNameValidated,
        lastNameValidated,
        validatedEmail,
        "professor"
    );

    console.log(
        `Created test professor user with id: ${newUser._id.toString()}`
    );

    return newUser;
};

const getCourseMetaFromCLI = async () => {
    while (true) {
        const { courseName, courseCode, courseDescription } = await promptGet({
            properties: {
                courseName: {
                    description: "Course name (e.g., Web Programming I)",
                    required: true,
                },
                courseCode: {
                    description: "Course code (e.g., CS-546)",
                    required: true,
                },
                courseDescription: {
                    description: "Course description",
                    required: true,
                },
            },
        });

        try {
            const validatedCourseName = validator.isValidCourseName(
                courseName,
                "course name"
            );
            const validatedCourseCode = validator.isValidCourseId(
                courseCode,
                "course code"
            );
            const validatedCourseDescription = validator.isValidString(
                courseDescription,
                "course description"
            );

            // return ONLY after validation passes
            return {
                courseName: validatedCourseName,
                courseCode: validatedCourseCode,
                courseDescription: validatedCourseDescription,
            };
        } catch (e) {
            console.log("\n" + colors.red(String(e)) + "\n");
            console.log("Please enter the course information again.\n");
        }
    }
};

const ensureCourseForProfessor = async (
    creator,
    { courseName, courseCode, courseDescription }
) => {
    let courseDoc;
    try {
        courseDoc = await createCourse(
            courseName,
            courseCode,
            courseDescription,
            creator._id
        );
        console.log(
            `Created course '${courseName}' (${courseCode}) for ${creator.email}`
        );
    } catch (e) {
        if (e?.status === 409) {
            const courseColl = await (
                await import("../config/mongoCollections.js")
            ).courses();
            courseDoc = await courseColl.findOne({ course_id: courseCode });
            if (!courseDoc) {
                throw {
                    status: 400,
                    message: `Course with code ${courseCode} exists error-wise but could not be fetched`,
                };
            }
            console.log(
                `Reusing existing course '${courseDoc.course_name}' (${courseCode})`
            );
        } else {
            throw e;
        }
    }

    return courseDoc;
};

const seedFaqFileForCourse = async (creator, courseDoc) => {
    console.log(`Reading FAQ from: ${filePath}`);
    const fileData = (await fs.readFile(filePath, "utf-8")).split("\n");

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

    const generalLabelId =
        generalLabel._id?.toString?.() ?? generalLabel.id ?? generalLabel;

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
            const questionContent = `<p>${q}</p>`;
            const questionDelta = JSON.stringify([{ insert: q + "\n" }]);

            await questionUtils.createQuestion(
                q,
                courseDoc._id.toString(),
                creator._id.toString(),
                [generalLabelId],
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

const seedJavaScriptFAQ = async () => {
    // high-level explanation for whoever runs this
    console.log(
        "\nSeeding JavaScript FAQ questions for SlackOverflow. (This will take 3-5 mins)"
    );
    console.log(
        "You will be asked for a professor email and course details so we can attach the FAQ to a real course and professor."
    );
    console.log(
        "Important: the professor email MUST be a VALID EMAIL address that can receive OTP verification emails during sign-up.\n"
    );
    console.log(
        "Professors of Stevens Institute of Technology emails have already been seeded. If you are a professor of Stevens Institute of Technology, kindly enter your SIT email ID\n"
    );
    console.log(
        "Flow:\n" +
            "  1) Professor email: we will reuse an existing professor if found, or create a test professor.\n" +
            "  2) Course name, course code (e.g., CS-546), and description: the FAQ will be linked to this course.\n"
    );

    // config prompt UI
    prompt.message = "";
    prompt.delimiter = "";
    prompt.start();

    try {
        const creator = await getOrCreateProfessor();
        const courseMeta = await getCourseMetaFromCLI();
        const courseDoc = await ensureCourseForProfessor(creator, courseMeta);

        const inserted = await seedFaqFileForCourse(creator, courseDoc);
        return inserted;
    } finally {
        prompt.stop();
    }
};

export default seedJavaScriptFAQ;
