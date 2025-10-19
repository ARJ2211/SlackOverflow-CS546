import * as nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: "OAuth2",
        user: "slackoverflowcs546@gmail.com",
        clientId: process.env.EMAIL_CLIENT_ID,
        clientSecret: process.env.EMAIL_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    },
});

/**
 * Send an email to the reciever using nodemailer
 * @param {*} to
 * @param {*} subject
 * @param {*} text
 * @param {*} html
 */
const sendEmail = async (to, subject, text, html) => {
    const info = await transporter.sendMail({
        from: `"SlackOverflow" <${process.env.GMAIL_ID}>`,
        to: to,
        subject: subject,
        text: text, // plain‑text body
        html: html, // HTML body
    });

    console.log("Message sent:", info.messageId);
};

export default sendEmail;
