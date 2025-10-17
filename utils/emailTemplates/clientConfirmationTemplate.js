// utils/emailTemplates/clientConfirmationTemplate.js
export const generateClientConfirmationEmail = ({
  fullName,
  productTitle,
  categoryName,
}) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Thank You for Contacting Us</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header img {
            max-width: 80px;
            height: auto;
        }
        h2 {
            margin-top: 0;
            color: #333;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://demand10.com/images/logo.png" alt="demand10 Logo">
        </div>
        
        <h2>Hi ${fullName},</h2>
        
        <p>Thank you for reaching out to us!</p>
        
        <p>We've received your request and someone from our team will get back to you shortly.</p>
        
        ${productTitle ? `
        <p>We see you're interested in <strong>${productTitle}</strong>. Rest assured, you've come to the right place. Our team is trusted to help with exactly this.</p>
        ` : ""}
        
        ${categoryName ? `
        <p>You mentioned interest in <strong>${categoryName}</strong>. That's great! Our experts specialize in this area and will be in touch soon.</p>
        ` : ""}
        
        <p>If you have any urgent questions or need immediate assistance, feel free to reply directly to this email.</p>
        
        <p>Best regards,<br>The Demand10 Team</p>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} Demand10. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
};