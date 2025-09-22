/**
 * Generates email template for business email verification
 * @param {string} verificationCode - The verification code to include in the email
 * @param {string} userName - The name of the user
 * @param {string} companyName - The name of the company being claimed
 * @returns {Object} - Object containing text and HTML versions of the email
 */
export const generateBusinessEmailVerificationTemplate = (verificationCode, userName, companyName) => {
  return {
    text: `Hello ${userName},

You have requested to claim the company "${companyName}" on Demand10.

To verify your business email address, please use the following verification code:

Verification Code: ${verificationCode}

This code will expire in 5 minutes.

If you did not request this, please ignore this email.

Best regards,
Demand10 Team`,

    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Business Email Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 20px; background-color: #139692;">
        <h1 style="color: #ffffff; font-size: 28px; margin: 0;">Business Email Verification</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; font-size: 24px; margin-top: 0;">Hello ${userName},</h2>
        
        <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 20px 0;">
          You have requested to claim the company <strong>"${companyName}"</strong> on Demand10.
        </p>
        
        <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 20px 0;">
          To verify your business email address, please use the following verification code:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; padding: 15px 30px; background-color: #f8f8f8; border: 2px dashed #139692; border-radius: 8px;">
            <span style="font-size: 24px; font-weight: bold; color: #139692; letter-spacing: 5px;">${verificationCode}</span>
          </div>
        </div>
        
        <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 20px 0;">
          This code will expire in 5 minutes.
        </p>
        
        <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 20px 0;">
          If you did not request this, please ignore this email.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; background-color: #f8f8f8; text-align: center;">
        <p style="color: #999999; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} Demand10. All rights reserved.
        </p>
        <p style="color: #999999; font-size: 12px; margin: 5px 0 0 0;">
          <a href="https://demand10.com" style="color: #139692; text-decoration: none;">https://demand10.com</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
  };
};