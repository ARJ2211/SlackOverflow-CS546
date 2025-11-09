import * as validator from "../validator.js";
import sendEmail from "../mailer/sendEmail.js";
import * as professorUtils from "../mongoUtils/professorUtils.js";
// TODO: Create one for the students also!!!!!!

import { fileURLToPath } from "url";
import fs from "fs/promises";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const renderTemplateLiteral = (template, vars) => {
    // Evaluates `template` as a JS template literal with vars in scope.
    // Only use with trusted templates.
    const fn = new Function(...Object.keys(vars), `return \`${template}\`;`);
    return fn(...Object.values(vars));
};

/**
 * Generate a random number between 100,000 (inclusive) and 999,999 (inclusive)
 * @returns
 */
const generateRandomSixDigitNumber = () => {
    return Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
};

const createAndUpdateProfessorOTP = async (id) => {
    id = validator.isValidMongoId(id);
    const otp = generateRandomSixDigitNumber();
    try {
        var updatedData = professorUtils.updateProfessor(
            (filter = { _id: id }),
            (obj = { otp: otp })
        );
    } catch (e) {
        throw e;
    }
    return { updatedData, otp };
};

export const sendOTPEmail = async (email) => {
    email = validator.isValidEmail(email);
    const temp_name = email.split("@")[0];
    const otp = generateRandomSixDigitNumber();
    let html = await fs.readFile(filePath, "utf-8");
    html = renderTemplateLiteral(html, { otp, name: temp_name });
    await sendEmail(
        (to = email),
        (subject = "SlackOverflow OTP confirmation"),
        (text = `Good day ${temp_name}! \nPlease use the below OTP to authenticate yourself to the website.`),
        (html = html)
    );
    return otp;
};
