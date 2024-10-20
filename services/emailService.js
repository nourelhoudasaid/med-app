const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendConfirmationEmail = async (to, name, role) => {
  let subject, text;

  if (role === 'Doctor') {
    subject = 'Registration Confirmation - Awaiting Validation';
    text = `Dear ${name},\n\nThank you for registering as a doctor. Your account has been created successfully and is awaiting validation by our admin team. We will notify you once your account has been validated.\n\nBest regards,\nYour Healthcare Team`;
  } else {
    subject = 'Registration Confirmation';
    text = `Dear ${name},\n\nThank you for registering. Your account has been created successfully. You can now log in to access our services.\n\nBest regards,\nYour Healthcare Team`;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: to,
      subject: subject,
      text: text,
    });
    console.log('Confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
};

module.exports = { sendConfirmationEmail };
