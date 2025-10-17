import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const sesClient = new SESv2Client({
  region: "us-east-1", // ✅ Replace with your actual region
  credentials: {
    accessKeyId: process.env.AWS_SES_KEY,
    secretAccessKey: process.env.AWS_SES_SECRET,
  },
});

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    
    const params = {
      Destination: {
        ToAddresses: [to],
      },
      FromEmailAddress: "info@demand10.com", // ✅ Must be a verified email/domain
      Content: {
        Simple: {
          Subject: {
            Data: subject,
            Charset: "UTF-8",
          },
          Body: {
            Text: {
              Data: text,
              Charset: "UTF-8",
            },
            ...(html && {
              Html: {
                Data: html,
                Charset: "UTF-8",
              },
            }),
          },
        },
      },
    };

    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);
    

    return { success: true, messageId: response.MessageId };
  } catch (error) {
    console.error("❌ Email send failed:", error);
    return { success: false, error };
  }
};

export default sendEmail;