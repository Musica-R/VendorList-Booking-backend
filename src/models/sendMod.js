import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});

export const sendMail = async (subject, body) => {
    await transporter.sendMail({
        from: process.env.EMAIL,
        to: "musicarameshsai@gmail.com",
        subject,
        text: body
    });
};