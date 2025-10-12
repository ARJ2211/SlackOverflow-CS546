import * as professorUtils from "./mongoUtils/professorUtils.js";

const prof = await professorUtils.getProfessorByFullName("patrick hill");
console.log(prof);
