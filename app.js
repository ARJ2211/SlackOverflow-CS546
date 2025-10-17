import * as professorUtils from "./mongoUtils/professorUtils.js";
import * as questionUtils from "./mongoUtils/questionUtils.js";


async function seedQuestions() {
    const questions = [
        "What is closure in JavaScript? What is it used for?",
        "State the difference between '==' and '===' in JavaScript.",
        "Explain strict mode in JavaScript.",
        "What are template literals in ES6?",
        "How do you convert a string to an integer in JavaScript?",
    ];

    for (const q of questions) {
        try {
            console.log("createQuestion start");
            const saved = await questionUtils.createQuestion(q);
            console.log("Saved:", saved._id);
        } catch (e) {
            console.error("createQuestion error:", q, e);
        }
    }
}

async function searchQuestions(query) {
    try {
        const res = await questionUtils.searchQuestion(query);
        console.log("Search results:", res[0]);
        return res;
    } catch (e) {
        console.error("searchQuestion error:", e);
        throw e;
    }
}

async function startApp() {
    try {
        // await seedQuestions();

        const queries = [
            "Good evening professor, I wanted to know what the difference is between == and ===",
            "I wanted to know more about strict mode in javascript",
            "What should I do if I am constipated?",
            "What is the difference between common js and module",
        ];
        for (const q of queries) {
            console.log(q);
            await searchQuestions(q);
        }
    } catch (e) {
        console.error("startApp error:", e);
    }
}

startApp();
