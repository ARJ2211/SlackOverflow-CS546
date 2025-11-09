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

const randomNumber = generateRandomSixDigitNumber();
console.log(randomNumber);

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

export const sendOTPEmail = async (id, type = "professor") => {
    id = validator.isValidMongoId(id);
    let data, otp;
    if (type === "professor") {
        const filePath = path.resolve(__dirname, "../htmls/otpMailer.html");
        try {
            ({ data, otp } = createAndUpdateProfessorOTP(id));
        } catch (e) {
            throw e;
        }
    } else if (type === "student") {
        // TODO: IMPLEMENT THIS!
        console.log("NOT IMPLEMENTED!!!!");
    }
    let html = await fs.readFile(filePath, "utf-8");
    html = renderTemplateLiteral(html, { otp, name: Pname });
    const email = data.email;
    await sendEmail(
        (to = email),
        (subject = "SlackOverflow OTP confirmation"),
        (text = `Good day ${data.Pname}! \nPlease use the below OTP to authenticate yourself to the website.`),
        (html = html)
    );
    return data;
};
