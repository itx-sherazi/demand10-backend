import sendEmail from "../helpers/send-email.js";
import RequestData from "../model/DatasetRequest.js"; // adjust path if needed
import { generateClientConfirmationEmail } from "../utils/emailTemplates/clientConfirmationTemplate.js";
import { generateRequestEmail } from "../utils/emailTemplates/requestTemplate.js"; // adjust path if needed

export const createRequest = async (req, res) => {
  try {
    const { fullName, email, phone, message, productTitle, categoryName } =
      req.body;
    if (!fullName) {
      return res
        .status(400)
        .json({ success: false, message: "Full name is required" });
    }

    const newRequest = new RequestData({
      fullName,
      email,
      phone,
      message,
      productTitle,
      categoryName,
    });
    await newRequest.save();

    const emailHTML = generateRequestEmail({
      fullName,
      email,
      phone,
      message,
      productTitle,
      categoryName,
    });
    // Send email using helper
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `New Client Request from ${fullName}`,
      html: emailHTML,
      text: `
New Client Request

Name: ${fullName}
Email: ${email}
Phone: ${phone || "Not provided"}
productTitle:${productTitle || "Null"}
Sub Category Name:${categoryName}
Message:
${message}
  `.trim(),
    });
    
    const clientEmailHTML = generateClientConfirmationEmail({
      fullName,
      productTitle,
      categoryName,
    });

    await sendEmail({
      to: email,
      subject: " We've received your request at demand10",
      html: clientEmailHTML,
      text: `Hi ${fullName},\n\nThanks for contacting us! We have received your request and will respond shortly.\n\n- The Demand10 Team`,
    });

    res.status(201).json({
      success: true,
      message: "Request submitted and email sent successfully",
      data: newRequest,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error. Please try again later.",
    });
  }
};

export const getAllRequests = async (req, res) => {
  try {
    const allRequests = await RequestData.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "All requests fetched successfully",
      data: allRequests,
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch data. Please try again later.",
    });
  }
};
export const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await RequestData.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        ok: false,
        message: "Request not found",
      });
    }

    res.status(200).json({
      ok: true,
      message: "Request deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("Error deleting request:", error);
    res.status(500).json({
      ok: false,
      message: "Server Error. Please try again later.",
    });
  }
};
