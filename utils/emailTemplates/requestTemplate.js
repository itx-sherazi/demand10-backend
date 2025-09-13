// utils/emailTemplates/requestTemplate.js

export const generateRequestEmail = ({
  fullName,
  email,
  phone,
  message,
  productTitle,
  categoryName,
}) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New Client Request</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .header {
      background-color: #fcfdfd;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #eee;
    }
    .header img {
      max-width: 120px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      color: black;
      text-align: right;
    }
    .content {
      padding: 25px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    table td {
      padding: 12px;
      border-bottom: 1px solid #eee;
      vertical-align: top;
    }
    table td.label {
      font-weight: bold;
      color: #139692;
      text-transform: uppercase;
      font-size: 13px;
      width: 40%;
    }
    table td.value {
      font-size: 15px;
    }
    .message-box {
      background-color: #f8f9fa;
      padding: 15px;
      border-left: 4px solid #139692;
      border-radius: 4px;
      margin-top: 10px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #777;
      padding: 15px;
      background-color: #fcfdfd;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://intentwire.com/images/logo.png" alt="Company Logo">
      <h1>New Client Request</h1>
    </div>

    <div class="content">
      <table>
        <tr>
          <td class="label">Client Name</td>
          <td class="value">${fullName}</td>
        </tr>
        <tr>
          <td class="label">Email Address</td>
          <td class="value">${email}</td>
        </tr>
        <tr>
          <td class="label">Phone Number</td>
          <td class="value">${phone || "Not provided"}</td>
        </tr>

        ${productTitle ? `
          <tr>
            <td class="label">Product Name</td>
            <td class="value">${productTitle}</td>
          </tr>
        ` : ''}

        ${categoryName ? `
          <tr>
            <td class="label">SubCategory Name</td>
            <td class="value">${categoryName}</td>
          </tr>
        ` : ''}

        <tr>
          <td class="label">Message</td>
          <td class="value">
            <div class="message-box">
              ${message.replace(/\n/g, "<br>")}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <div class="footer">
      <p>This request was submitted on ${new Date().toLocaleString()}</p>
      <p>© ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
};
