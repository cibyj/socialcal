require("dotenv").config();
const nodemailer = require("nodemailer");

async function run() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: "cibyj@hotmail.com",
    subject: "Hotmail SMTP Test",
    text: "This is a test email sent via Hotmail SMTP.",
  });

  console.log("Sent:", info.messageId);
}

run().catch(console.error);
