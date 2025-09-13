// Email template helper with improved design using the website color #139692

export const generateVerificationEmailTemplate = (verificationUrl, userEmail) => {
  return {
    text: `Hello,
      
Please click on the following link to verify your email address:
${verificationUrl}

This link will expire in 24 hours.

Thank you for signing up!

Best regards,
IntentWire Team`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 20px; background-color: #139692;">
        <h1 style="color: #ffffff; font-size: 28px; margin: 0;">Email Verification</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; font-size: 24px; margin-top: 0;">Hello,</h2>
        
        <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 20px 0;">
          Thank you for signing up! Please click the button below to verify your email address:
        </p>
        
        <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td align="center" style="border-radius: 5px; background-color: #139692;">
              <a href="${verificationUrl}" 
                 style="display: inline-block; padding: 15px 30px; color: #ffffff; text-decoration: none; 
                        font-size: 16px; font-weight: bold; border-radius: 5px;">
                Verify Email Address
              </a>
            </td>
          </tr>
        </table>
        
        <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 20px 0;">
          If the button above doesn't work, you can also copy and paste the following link in your browser:
          <br><br>
          <a href="${verificationUrl}" style="color: #139692; word-break: break-all;">${verificationUrl}</a>
        </p>
        
        <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 20px 0;">
          This link will expire in 24 hours.
        </p>
        
        <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
          Thank you for signing up!
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; background-color: #f8f8f8; text-align: center;">
        <p style="color: #999999; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} IntentWire. All rights reserved.
        </p>
        <p style="color: #999999; font-size: 12px; margin: 5px 0 0 0;">
          <a href="https://intentwire.com" style="color: #139692; text-decoration: none;">https://intentwire.com</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
  };
};

export const generatePasswordResetEmailTemplate = (resetUrl, userEmail) => {
  return {
    text: `Hello,
      
You have requested a password reset. Please click on the following link to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you did not request this, please ignore this email.

Best regards,
IntentWire Team`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 40px 20px; background-color: #139692;">
        <h1 style="color: #ffffff; font-size: 28px; margin: 0;">Password Reset</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; font-size: 24px; margin-top: 0;">Hello,</h2>
        
        <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 20px 0;">
          You have requested a password reset. Please click the button below to reset your password:
        </p>
        
        <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
          <tr>
            <td align="center" style="border-radius: 5px; background-color: #139692;">
              <a href="${resetUrl}" 
                 style="display: inline-block; padding: 15px 30px; color: #ffffff; text-decoration: none; 
                        font-size: 16px; font-weight: bold; border-radius: 5px;">
                Reset Password
              </a>
            </td>
          </tr>
        </table>
        
        <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 20px 0;">
          If the button above doesn't work, you can also copy and paste the following link in your browser:
          <br><br>
          <a href="${resetUrl}" style="color: #139692; word-break: break-all;">${resetUrl}</a>
        </p>
        
        <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 20px 0;">
          This link will expire in 1 hour.
        </p>
        
        <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 20px 0;">
          If you did not request this, please ignore this email.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; background-color: #f8f8f8; text-align: center;">
        <p style="color: #999999; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} IntentWire. All rights reserved.
        </p>
        <p style="color: #999999; font-size: 12px; margin: 5px 0 0 0;">
          <a href="https://intentwire.com" style="color: #139692; text-decoration: none;">https://intentwire.com</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
  };
};