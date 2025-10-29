import nodemailer from 'nodemailer';

// Create transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'support@demand10.com',
    pass: 'runq brbl jtky diyq', // App password
  },
});

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // Define mail options
    const mailOptions = {
      from: '"Demand10 Support" <support@demand10.com>',
      to,
      subject,
      text,
      html,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email send failed:", error);
    return { success: false, error };
  }
};

export default sendEmail;