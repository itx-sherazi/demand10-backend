import sendEmail from "./send-email.js";

/**
 * Send email notification to admin when a new review is submitted
 */
export const sendNewReviewNotificationToAdmin = async (companyName) => {
  try {
    const adminEmailSubject = "New Company Review Submitted";
    const adminEmailText = `A new review has been submitted for ${companyName}.
    
Please review the review in the admin dashboard.`;

    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>New Company Review Submitted</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #139692 0%, #4ecfc5 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">New Review Submitted</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0;">
          <h2 style="color: #139692;">Action Required</h2>
          
          <p>Hello Admin,</p>
          
          <p>A new review has been submitted for <strong>${companyName}</strong> and is pending your review.</p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0; margin: 20px 0;">
            <h3 style="color: #139692; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Review Details</h3>
            <p><strong>Company:</strong> ${companyName}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://dashboard.intentwire.com/" 
               style="background: linear-gradient(135deg, #139692 0%, #4ecfc5 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Review in Dashboard
            </a>
          </div>
          
          <p>Please review this submission in the admin dashboard and either approve or reject it.</p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} IntentWire. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail({
      to: process.env.ADMIN_EMAIL || "info@intentwire.com",
      subject: adminEmailSubject,
      text: adminEmailText,
      html: adminEmailHtml
    });

    return result;
  } catch (error) {
    console.error("Error sending new review notification to admin:", error);
    return { success: false, error };
  }
};

/**
 * Send email notification to user when their review is submitted
 */
export const sendReviewSubmittedNotificationToUser = async (userEmail, companyName) => {
  try {
    const userEmailSubject = "Your Review has been Submitted!";
    const userEmailText = `Hello,
      
Thank you for submitting your review for ${companyName}. Our admin team will review your submission shortly.

You will receive another email once your review has been approved or rejected.

Thank you for choosing IntentWire.

Best regards,
IntentWire Team`;

    const userEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Your Review has been Submitted!</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #139692 0%, #4ecfc5 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Review Submitted!</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0;">
          <h2 style="color: #139692;">Thank You!</h2>
          
          <p>Hello,</p>
          
          <p>Thank you for submitting your review for <strong>${companyName}</strong>. Our admin team will review your submission shortly.</p>
          
          <div style="background-color: #e8f4f3; padding: 20px; border-radius: 8px; border-left: 5px solid #4ecfc5; margin: 20px 0;">
            <h3 style="color: #139692; margin-top: 0;">What happens next?</h3>
            <ul>
              <li>Our team will review your submission</li>
              <li>You'll receive a notification once it's approved or rejected</li>
              <li>Approved reviews will appear on the company's profile</li>
            </ul>
          </div>
          
          <p>Thank you for choosing IntentWire and helping our community make informed decisions!</p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} IntentWire. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail({
      to: userEmail,
      subject: userEmailSubject,
      text: userEmailText,
      html: userEmailHtml
    });

    return result;
  } catch (error) {
    console.error("Error sending review submitted notification to user:", error);
    return { success: false, error };
  }
};

/**
 * Send email notification to user when their review is approved
 */
export const sendReviewApprovedNotificationToUser = async (userEmail, companyName) => {
  try {
    const emailSubject = "Your Review Status Updated";
    const emailText = `Hello,
      
The status of your review for ${companyName} has been updated to approved by our admin team.

Your review is now visible on the company's profile page.

Thank you for choosing IntentWire.

Best regards,
IntentWire Team`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Your Review Status Updated</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #139692 0%, #4ecfc5 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🎉 Review Approved!</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0;">
          <h2 style="color: #139692;">Congratulations!</h2>
          
          <p>Hello,</p>
          
          <p>Great news! The status of your review for <strong>${companyName}</strong> has been updated to <strong>approved</strong> by our admin team.</p>
          
          <div style="background-color: #e8f4f3; padding: 20px; border-radius: 8px; border-left: 5px solid #4ecfc5; margin: 20px 0;">
            <h3 style="color: #139692; margin-top: 0;">Your Review is Live</h3>
            <p>Your review is now visible on the company's profile page and will help other users make informed decisions.</p>
            
            
            
          </div>
          
          <p>Thank you for contributing to our community and helping others make informed decisions!</p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} IntentWire. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail({
      to: userEmail,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    });

    return result;
  } catch (error) {
    console.error("Error sending review approved notification to user:", error);
    return { success: false, error };
  }
};

/**
 * Send email notification to user when their review is rejected
 */
export const sendReviewRejectedNotificationToUser = async (userEmail, companyName) => {
  try {
    
    const emailSubject = "Your Review Status Updated";
    const emailText = `Hello,
      
The status of your review for ${companyName} has been updated to rejected by our admin team.

If you believe this was an error, please contact our support team at info@intentwire.com.

Thank you for your interest in IntentWire.

Best regards,
IntentWire Team`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Your Review Status Updated</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Review Update</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0;">
          <h2 style="color: #ff6b6b;">Review Status Updated</h2>
          
          <p>Hello,</p>
          
          <p>We're writing to inform you that the status of your review for <strong>${companyName}</strong> has been updated to <strong>rejected</strong> by our admin team.</p>
          
          <div style="background-color: #fff0f0; padding: 20px; border-radius: 8px; border-left: 5px solid #ff6b6b; margin: 20px 0;">
            <h3 style="color: #ff6b6b; margin-top: 0;">Reason for rejection:</h3>
            <p>Our team reviewed your submission and determined that it did not meet our community guidelines. This could be due to:</p>
            <ul>
              <li>Inappropriate content</li>
              <li>Insufficient details</li>
              <li>Violation of our review policies</li>
            </ul>
          </div>
          
          <div style="background-color: #e8f4f3; padding: 20px; border-radius: 8px; border-left: 5px solid #4ecfc5; margin: 20px 0;">
            <h3 style="color: #139692; margin-top: 0;">What you can do:</h3>
            <p>If you believe this was an error, please contact our support team at <a href="mailto:info@intentwire.com" style="color: #139692;">info@intentwire.com</a> with details about your submission.</p>
          </div>
          
          <p>Thank you for your interest in IntentWire.</p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} IntentWire. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail({
      to: userEmail,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    });
    

    return result;
  } catch (error) {
    console.error("Error sending review rejected notification to user:", error);
    return { success: false, error };
  }
};

/**
 * Send email notification to admin when a new company listing request is submitted
 */
export const sendNewCompanyListingNotificationToAdmin = async (companyName) => {
  try {
    const adminEmailSubject = "New Company Listing Request";
    const adminEmailText = `A new company listing request has been submitted for ${companyName}.
    
Please review the request in the admin dashboard.`;

    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>New Company Listing Request</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #139692 0%, #4ecfc5 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">New Listing Request</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0;">
          <h2 style="color: #139692;">Action Required</h2>
          
          <p>Hello Admin,</p>
          
          <p>A new company listing request has been submitted for <strong>${companyName}</strong> and is pending your review.</p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0; margin: 20px 0;">
            <h3 style="color: #139692; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Company Details</h3>
            <p><strong>Company Name:</strong> ${companyName}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://dashboard.intentwire.com/" 
               style="background: linear-gradient(135deg, #139692 0%, #4ecfc5 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Review in Dashboard
            </a>
          </div>
          
          <p>Please review this request in the admin dashboard and either approve or reject it.</p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} IntentWire. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail({
      to: process.env.ADMIN_EMAIL || "info@intentwire.com",
      subject: adminEmailSubject,
      text: adminEmailText,
      html: adminEmailHtml
    });

    return result;
  } catch (error) {
    console.error("Error sending new company listing notification to admin:", error);
    return { success: false, error };
  }
};

/**
 * Send email notification to user when their company listing request is submitted
 */
export const sendCompanyListingSubmittedNotificationToUser = async (userEmail, companyName) => {
  try {
    const emailSubject = "Your Company Listing Request has been Received!";
    const emailText = `Hello,
    
Thank you for submitting your company listing request for ${companyName}. Our admin team will review your request shortly.

You will receive another email once your request has been approved or rejected.

Thank you for choosing IntentWire.

Best regards,
IntentWire Team`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Your Company Listing Request has been Received!</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #139692 0%, #4ecfc5 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Request Received!</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0;">
          <h2 style="color: #139692;">Thank You!</h2>
          
          <p>Hello,</p>
          
          <p>Thank you for submitting your company listing request for <strong>${companyName}</strong>. Our admin team will review your request shortly.</p>
          
          <div style="background-color: #e8f4f3; padding: 20px; border-radius: 8px; border-left: 5px solid #4ecfc5; margin: 20px 0;">
            <h3 style="color: #139692; margin-top: 0;">What happens next?</h3>
            <ul>
              <li>Our team will review your submission</li>
              <li>You'll receive a notification once it's approved or rejected</li>
              <li>Approved listings will appear in our directory</li>
            </ul>
          </div>
          
          <p>Thank you for choosing IntentWire to showcase your business!</p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} IntentWire. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail({
      to: userEmail,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    });

    return result;
  } catch (error) {
    console.error("Error sending company listing submitted notification to user:", error);
    return { success: false, error };
  }
};

/**
 * Send email notification to user when their company listing request is approved
 */
export const sendCompanyListingApprovedNotificationToUser = async (userEmail, companyName, subcategoryName) => {
  try {
    const emailSubject = "Your Company Listing Request Status Updated";
    const emailText = `Hello,
        
The status of your company listing request for ${companyName} has been updated to approved by our admin team.

Your company is now visible in the ${subcategoryName} subcategory.

Thank you for choosing IntentWire.

Best regards,
IntentWire Team`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Your Company Listing Request Status Updated</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #139692 0%, #4ecfc5 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🎉 Listing Approved!</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0;">
          <h2 style="color: #139692;">Congratulations!</h2>
          
          <p>Hello,</p>
          
          <p>Great news! The status of your company listing request for <strong>${companyName}</strong> has been updated to <strong>approved</strong> by our admin team.</p>
          
          <div style="background-color: #e8f4f3; padding: 20px; border-radius: 8px; border-left: 5px solid #4ecfc5; margin: 20px 0;">
            <h3 style="color: #139692; margin-top: 0;">Your Listing is Live</h3>
            <p>Your company is now visible in the <strong>${subcategoryName}</strong> subcategory and will help potential customers find your business.</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="https://intentwire.com/${subcategoryName.toLowerCase().replace(/\s+/g, '-')}/${companyName.toLowerCase().replace(/\s+/g, '-')}" 
                 style="background: linear-gradient(135deg, #139692 0%, #4ecfc5 100%); color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                View Your Listing
              </a>
            </div>
          </div>
          
          <p>Thank you for choosing IntentWire to showcase your business!</p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} IntentWire. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail({
      to: userEmail,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    });

    return result;
  } catch (error) {
    console.error("Error sending company listing approved notification to user:", error);
    return { success: false, error };
  }
};

/**
 * Send email notification to user when their company listing request is rejected
 */
export const sendCompanyListingRejectedNotificationToUser = async (userEmail, companyName) => {
  try {
    const emailSubject = "Your Company Listing Request Status Updated";
    const emailText = `Hello,
      
The status of your company listing request for ${companyName} has been updated to rejected by our admin team.

If you believe this was an error, please contact our support team at info@intentwire.com.

Thank you for your interest in IntentWire.

Best regards,
IntentWire Team`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Your Company Listing Request Status Updated</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Listing Update</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0;">
          <h2 style="color: #ff6b6b;">Listing Status Updated</h2>
          
          <p>Hello,</p>
          
          <p>We're writing to inform you that the status of your company listing request for <strong>${companyName}</strong> has been updated to <strong>rejected</strong> by our admin team.</p>
          
          <div style="background-color: #fff0f0; padding: 20px; border-radius: 8px; border-left: 5px solid #ff6b6b; margin: 20px 0;">
            <h3 style="color: #ff6b6b; margin-top: 0;">Reason for rejection:</h3>
            <p>Our team reviewed your submission and determined that it did not meet our listing requirements. This could be due to:</p>
            <ul>
              <li>Incomplete information</li>
              <li>Invalid business details</li>
              <li>Violation of our listing policies</li>
            </ul>
          </div>
          
          <div style="background-color: #e8f4f3; padding: 20px; border-radius: 8px; border-left: 5px solid #4ecfc5; margin: 20px 0;">
            <h3 style="color: #139692; margin-top: 0;">What you can do:</h3>
            <p>If you believe this was an error, please contact our support team at <a href="mailto:info@intentwire.com" style="color: #139692;">info@intentwire.com</a> with details about your submission.</p>
          </div>
          
          <p>Thank you for your interest in IntentWire.</p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} IntentWire. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail({
      to: userEmail,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    });

    return result;
  } catch (error) {
    console.error("Error sending company listing rejected notification to user:", error);
    return { success: false, error };
  }
};

/**
 * Send email notification to admin when a review is deleted
 */
export const sendReviewDeletedNotificationToAdmin = async (companyName, reviewId, reviewStatus) => {
  try {
    const adminEmailSubject = "Review Deleted Successfully";
    const adminEmailText = `Hello,
    
The review for ${companyName} has been successfully deleted from the system.

Review ID: ${reviewId}
Review Status: ${reviewStatus}

Best regards,
IntentWire System`;

    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Review Deleted Successfully</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #139692 0%, #4ecfc5 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Review Deleted</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0;">
          <h2 style="color: #139692;">Deletion Confirmed</h2>
          
          <p>Hello Admin,</p>
          
          <p>The review for <strong>${companyName}</strong> has been successfully deleted from the system.</p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0; margin: 20px 0;">
            <h3 style="color: #139692; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Review Details</h3>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Review ID:<s/strong> ${reviewId}</p>
            <p><strong>Review Status:</strong> ${reviewStatus}</p>
          </div>
          
          <p>This action has been completed successfully.</p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} IntentWire. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail({
      to: process.env.ADMIN_EMAIL || "info@intentwire.com",
      subject: adminEmailSubject,
      text: adminEmailText,
      html: adminEmailHtml
    });

    return result;
  } catch (error) {
    console.error("Error sending review deleted notification to admin:", error);
    return { success: false, error };
  }
};

/**
 * Send email notification to user when their review is deleted
 */
export const sendReviewDeletedNotificationToUser = async (userEmail, companyName) => {
  try {
    const userEmailSubject = "Your Review has been Removed";
    const userEmailText = `Hello,
      
We're writing to inform you that your review for ${companyName} has been removed from our system.

If you have any questions about this removal, please contact our support team at info@intentwire.com.

Thank you for your understanding.

Best regards,
IntentWire Team`;

    const userEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Your Review has been Removed</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Review Removed</h1>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0;">
          <h2 style="color: #ff6b6b;">Review Removal Notice</h2>
          
          <p>Hello,</p>
          
          <p>We're writing to inform you that your review for <strong>${companyName}</strong> has been removed from our system.</p>
          
          <div style="background-color: #fff0f0; padding: 20px; border-radius: 8px; border-left: 5px solid #ff6b6b; margin: 20px 0;">
            <h3 style="color: #ff6b6b; margin-top: 0;">Reason for removal:</h3>
            <p>Your review was removed because it violated our community guidelines or terms of service.</p>
          </div>
          
          <div style="background-color: #e8f4f3; padding: 20px; border-radius: 8px; border-left: 5px solid #4ecfc5; margin: 20px 0;">
            <h3 style="color: #139692; margin-top: 0;">Have questions?</h3>
            <p>If you have any questions about this removal, please contact our support team at <a href="mailto:info@intentwire.com" style="color: #139692;">info@intentwire.com</a>.</p>
          </div>
          
          <p>Thank you for your understanding.</p>
        </div>
        
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666;">
          <p>© ${new Date().getFullYear()} IntentWire. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const result = await sendEmail({
      to: userEmail,
      subject: userEmailSubject,
      text: userEmailText,
      html: userEmailHtml
    });

    return result;
  } catch (error) {
    console.error("Error sending review deleted notification to user:", error);
    return { success: false, error };
  }
};