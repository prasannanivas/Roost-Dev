const nodemailer = require("nodemailer");
const twilio = require("twilio");

const sendEmailNotification = async (email, message) => {
  try {
    // 1) Create a transporter using your Gmail credentials
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER || "varkalavanaja69@gmail.com",
        pass: process.env.GMAIL_PASS || "nedlhvhptuvqvfqc",
      },
    });

    // 2) Define mail options
    const mailOptions = {
      from: "roost@no-reply.com",
      to: email,
      subject: "Notification",
      text: message,
    };

    // 3) Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}: ${info.response}`);
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
  }
};

const sendSMSNotification = async (phone, message) => {};

exports.sendInviteNotification = async (
  realtor,
  email,
  phone,
  referenceName
) => {
  // Send invite notification
  const inviteMessage = `Hi ${referenceName}, ${realtor.name} has invited you to join our platform. Please sign up to get started!
     click the link to sign up: https://www.realtorrewards.com/signup`;
  console.log(inviteMessage);
  if (email) {
    sendEmailNotification(email, inviteMessage);
  }
  if (phone) {
    sendSMSNotification(phone, inviteMessage);
  }
};
