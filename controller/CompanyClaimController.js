import CompanyClaim from "../model/CompanyClaim.js";
import CompanyTeamData from "../model/TeamCompany.js";
import { readAndPopulateTemplate } from "../utils/templateHelper.js";
import { generateBusinessEmailVerificationTemplate } from "../utils/emailTemplates/businessEmailVerificationTemplate.js";
import crypto from "crypto";

// In-memory storage for verification tokens (in production, use a database)
const verificationTokens = new Map();

// Helper function to send email notifications
const sendClaimNotificationEmail = async (emailData) => {
  try {
    const sendEmail = (await import('../helpers/send-email.js')).default;
    await sendEmail(emailData);
  } catch (emailError) {
    console.error("Failed to send email notification:", emailError);
  }
};

// Helper function to validate business email
const isBusinessEmail = (email) => {
  const businessEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const nonBusinessDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
    'aol.com', 'icloud.com', 'mail.com', 'protonmail.com',
    'yandex.com', 'qq.com', '163.com', '126.com', 'sina.com',
    'sohu.com', 'live.com', 'msn.com', 'comcast.net', 'verizon.net',
    'att.net', 'me.com', 'mac.com'
  ];
  
  const emailDomain = email.split('@')[1]?.toLowerCase();
  return businessEmailRegex.test(email) && !nonBusinessDomains.includes(emailDomain);
};

// Submit a company claim
const submitClaim = async (req, res) => {
  const { 
    companyId, 
    userName, 
    userEmail, 
    userPhone, 
    companyName, 
    issue,
    businessEmail, // New field for business email verification
    businessEmailToken // Token for business email verification
  } = req.body;
  
  const userId = req.user?.userId; // From auth middleware

  try {
    // If business email is provided, validate it
    if (businessEmail) {
      // Validate business email format
      if (!isBusinessEmail(businessEmail)) {
        return res.status(400).json({
          ok: false,
          message: "Please provide a valid business email address. Personal email providers are not accepted."
        });
      }

      // If token is provided, verify it
      if (businessEmailToken) {
        // Verify the token
        const storedTokenData = verificationTokens.get(businessEmail);
        
        if (!storedTokenData) {
          return res.status(400).json({
            ok: false,
            message: "Verification token has expired or is invalid. Please request a new one."
          });
        }
        
        if (storedTokenData.token !== businessEmailToken) {
          return res.status(400).json({
            ok: false,
            message: "Invalid verification token. Please check the token and try again."
          });
        }
        
        // Check if token has expired (5 minutes)
        if (Date.now() > storedTokenData.expiresAt) {
          verificationTokens.delete(businessEmail);
          return res.status(400).json({
            ok: false,
            message: "Verification token has expired. Please request a new one."
          });
        }
        
        // Token is valid, remove it from storage
        verificationTokens.delete(businessEmail);
        
        // Proceed with claim submission using the verified business email
        console.log(`Business email ${businessEmail} verified successfully`);
      } else {
        // Generate and store verification token
        const verificationToken = crypto.randomBytes(3).toString('hex').toUpperCase();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
        
        // Store token data
        verificationTokens.set(businessEmail, {
          token: verificationToken,
          expiresAt: expiresAt
        });
        
        // Send verification email
        const emailTemplate = generateBusinessEmailVerificationTemplate(verificationToken, userName, companyName);
        
        const emailSubject = "Business Email Verification for Company Claim";
        
        await sendClaimNotificationEmail({
          to: businessEmail,
          subject: emailSubject,
          text: emailTemplate.text,
          html: emailTemplate.html
        });
        
        return res.status(200).json({
          ok: true,
          message: "Business email verification required. Please check your email for the verification code.",
          verificationRequired: true,
          businessEmail: businessEmail
        });
      }
    }

    // Check if company exists and populate subcategory
    const company = await CompanyTeamData.findById(companyId).populate('subcategory', 'name');
    if (!company) {
      return res.status(404).json({
        ok: false,
        message: "Company not found"
      });
    }

    // Check if company is already claimed by another user
    if (company.claimedBy && company.claimedBy.toString() !== userId) {
      return res.status(400).json({
        ok: false,
        message: "Company has already been claimed"
      });
    }

    // Check if user has already submitted an active claim for this company
    // Only prevent submission if there's an approved or pending claim
    const existingClaim = await CompanyClaim.findOne({
      user: userId,
      company: companyId,
      status: { $in: ['pending', 'approved'] } // Only check for active claims
    });
    
    if (existingClaim) {
      return res.status(400).json({
        ok: false,
        message: "You have already submitted a claim for this company"
      });
    }

    // Create new claim
    const newClaim = new CompanyClaim({
      user: userId,
      company: companyId,
      userName,
      userEmail: businessEmail || userEmail, // Use business email if provided and verified
      userPhone,
      companyName,
      issue
    });

    await newClaim.save();

    // Prepare data for admin notification template
    const adminTemplateData = {
      userName,
      userEmail: businessEmail || userEmail,
      userPhone: userPhone || 'Not provided',
      companyName,
      subcategoryName: company.subcategory?.name || 'Unknown Subcategory',
      companyId,
      issue: issue || 'No additional information provided'
    };

    // Read and populate admin notification template
    const adminEmailHtml = await readAndPopulateTemplate('adminClaimNotification', adminTemplateData);

    const adminEmailSubject = "New Company Claim Request - Action Required";
    const adminEmailText = `Hello Admin,

A new company claim request has been submitted with the following details:

User Information:
- Name: ${userName}
- Email: ${businessEmail || userEmail}
- Phone: ${userPhone || 'Not provided'}

Company Information:
- Company Name: ${companyName}
- Subcategory: ${company.subcategory?.name || 'Unknown Subcategory'}
- Company ID: ${companyId}

Claim Details:
- Issue/Message: ${issue || 'No additional information provided'}

Please review this claim in the admin dashboard and either approve or reject it.

Best regards,
IntentWire System`;

    // Send email to admin
    await sendClaimNotificationEmail({
      to: process.env.ADMIN_EMAIL || "admin@intentwire.com",
      subject: adminEmailSubject,
      text: adminEmailText,
      html: adminEmailHtml
    });

    return res.status(201).json({
      ok: true,
      message: "Claim submitted successfully",
      claim: newClaim
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Get all claims (for admin)
const getAllClaims = async (req, res) => {
  try {
    const claims = await CompanyClaim.find()
      .populate('user', 'email')
      .populate({
        path: 'company',
        populate: {
          path: 'subcategory',
          select: 'name slug' // Added slug to the selected fields
        }
      })
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      ok: true,
      count: claims.length,
      claims
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Get claims by user (for website users)
const getUserClaims = async (req, res) => {
  const userId = req.user?.userId; // From auth middleware

  try {
    const claims = await CompanyClaim.find({ user: userId })
      .populate({
        path: 'company',
        populate: {
          path: 'subcategory',
          select: 'name slug' // Added slug to the selected fields
        }
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      ok: true,
      count: claims.length,
      claims
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Approve a claim (admin only)
const approveClaim = async (req, res) => {
  const { claimId } = req.params;
  const adminUserId = req.user?.userId; // From auth middleware (admin)

  try {
    // Find the claim and populate company with subcategory
    const claim = await CompanyClaim.findById(claimId)
      .populate('user', 'email')
      .populate({
        path: 'company',
        populate: {
          path: 'subcategory',
          select: 'name slug' // Added slug to the selected fields
        }
      });
      
    if (!claim) {
      return res.status(404).json({
        ok: false,
        message: "Claim not found"
      });
    }

    // Check if claim is already approved
    if (claim.status === 'approved') {
      return res.status(400).json({
        ok: false,
        message: "Claim is already approved"
      });
    }

    // Check if the company still exists
    const company = await CompanyTeamData.findById(claim.company._id);
    if (!company) {
      return res.status(404).json({
        ok: false,
        message: "Company not found. The company may have been deleted."
      });
    }

    // Check if company is already claimed by another user
    if (company.claimedBy && company.claimedBy.toString() !== claim.user._id.toString()) {
      return res.status(400).json({
        ok: false,
        message: "Company has already been claimed by another user"
      });
    }

    // Update claim status
    claim.status = 'approved';
    claim.approvedBy = adminUserId;
    claim.approvedAt = new Date();
    
    await claim.save();

    // Update company with claimedBy field
    await CompanyTeamData.findByIdAndUpdate(
      claim.company._id,
      { claimedBy: claim.user },
      { new: true }
    );

    // Prepare data for user notification template
    const userTemplateData = {
      userName: claim.userName,
      companyName: claim.companyName
    };

    // Read and populate user approval notification template
    const emailHtml = await readAndPopulateTemplate('claimApproved', userTemplateData);

    const emailSubject = "🎉 Your Company Claim Request has been Approved!";
    const emailText = `Hello ${claim.userName},

Great news! Your claim request for "${claim.companyName}" has been approved by our admin team.

You can now edit your company information by visiting your dashboard:
https://intentwire.com/user-dashboard

Here are the next steps:
1. Visit your dashboard at https://intentwire.com/user-dashboard
2. Navigate to "Edit Companies" section
3. Find your company "${claim.companyName}" and click "Edit"
4. Update your company details, add images, and enhance your listing

Need help? Contact our support team at info@intentwire.com

Thank you for choosing IntentWire!

Best regards,
IntentWire Team`;

    await sendClaimNotificationEmail({
      to: claim.userEmail,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    });

    return res.status(200).json({
      ok: true,
      message: "Claim approved successfully",
      claim
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Reject a claim (admin only)
const rejectClaim = async (req, res) => {
  const { claimId } = req.params;
  const adminUserId = req.user?.userId; // From auth middleware (admin)

  try {
    // Find the claim and populate company with subcategory
    const claim = await CompanyClaim.findById(claimId)
      .populate('user', 'email')
      .populate({
        path: 'company',
        populate: {
          path: 'subcategory',
          select: 'name'
        }
      });
      
    if (!claim) {
      return res.status(404).json({
        ok: false,
        message: "Claim not found"
      });
    }

    // Check if claim is already rejected
    if (claim.status === 'rejected') {
      return res.status(400).json({
        ok: false,
        message: "Claim is already rejected"
      });
    }

    // Update claim status
    claim.status = 'rejected';
    claim.approvedBy = adminUserId;
    claim.approvedAt = new Date();
    
    await claim.save();

    // Prepare data for user rejection notification template
    const userTemplateData = {
      userName: claim.userName,
      companyName: claim.companyName
    };

    // Read and populate user rejection notification template
    const emailHtml = await readAndPopulateTemplate('claimRejected', userTemplateData);

    // Send email notification to user
    const emailSubject = "Your Company Claim Request has been Rejected";
    const emailText = `Hello ${claim.userName},

We regret to inform you that your claim request for "${claim.companyName}" has been rejected by our admin team.

Reason for rejection:
Our team reviewed your claim request and determined that it did not meet our verification requirements. This could be due to:
- Insufficient information provided
- Company already claimed by another user
- Company information not matching our records

What you can do:
1. Review the information you provided and ensure it's accurate
2. Contact our support team at info@intentwire.com for more details
3. Submit a new claim with complete and accurate information

We appreciate your interest in IntentWire and hope you'll try again.

Best regards,
IntentWire Team`;

    await sendClaimNotificationEmail({
      to: claim.userEmail,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    });

    return res.status(200).json({
      ok: true,
      message: "Claim rejected successfully",
      claim
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Delete a claim (admin only)
const deleteClaim = async (req, res) => {
  const { claimId } = req.params;

  try {
    // Find the claim
    const claim = await CompanyClaim.findById(claimId);
    
    if (!claim) {
      return res.status(404).json({
        ok: false,
        message: "Claim not found"
      });
    }

    // If the claim was approved, we need to reset the company's claimed status
    if (claim.status === 'approved') {
      // Reset the company's claimedBy field
      await CompanyTeamData.findByIdAndUpdate(
        claim.company,
        { claimedBy: null },
        { new: true }
      );
    }

    // Delete the claim
    await CompanyClaim.findByIdAndDelete(claimId);

    return res.status(200).json({
      ok: true,
      message: "Claim deleted successfully"
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Check if user has access to edit a company by ID
const checkEditAccess = async (req, res) => {
  const { companyId } = req.params;
  const userId = req.user?.userId; // From auth middleware

  try {
    // Find company and check if claimedBy matches userId
    const company = await CompanyTeamData.findById(companyId);
    
    if (!company) {
      return res.status(404).json({
        ok: false,
        message: "Company not found"
      });
    }

    const hasAccess = company.claimedBy && company.claimedBy.toString() === userId;

    return res.status(200).json({
      ok: true,
      hasAccess,
      company: {
        id: company._id,
        companyName: company.companyName
      }
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Check if user has access to edit a company by slug
const checkEditAccessBySlug = async (req, res) => {
  const { slug } = req.params;
  const userId = req.user?.userId; // From auth middleware

  try {
    // Find company by slug and check if claimedBy matches userId
    const company = await CompanyTeamData.findOne({ slug });
    
    if (!company) {
      return res.status(404).json({
        ok: false,
        message: "Company not found"
      });
    }

    const hasAccess = company.claimedBy && company.claimedBy.toString() === userId;

    return res.status(200).json({
      ok: true,
      hasAccess,
      company: {
        id: company._id,
        slug: company.slug,
        companyName: company.companyName
      }
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

export {
  submitClaim,
  getAllClaims,
  getUserClaims,
  approveClaim,
  rejectClaim,
  deleteClaim,
  checkEditAccess,
  checkEditAccessBySlug
};