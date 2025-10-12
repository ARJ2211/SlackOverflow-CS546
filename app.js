import * as professorUtils from "./mongoUtils/professorUtils.js";
import * as questionUtils from "./mongoUtils/questionUtils.js";

try {
    const prof = await professorUtils.getProfessorByFullName("Patrick hill");
    console.log(prof);
} catch (e) {
    console.log(e);
}

try {
    const saved = await questionUtils.createQuestion(
        "Why is my Mongo index not being used?"
    );
    console.log(saved);
} catch (e) {
    console.log(e);
}
