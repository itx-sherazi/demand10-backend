import { getCompanyBadgesForFrontend } from "./BadgeController.js";
import CompanyTeamData from "../model/TeamCompany.js";
import Badge from "../model/Badge.js";
import CompanyBadge from "../model/CompanyBadge.js";
import BadgeReferral from "../model/BadgeReferral.js"; // Import the new model

// Helper function to get client IP
const getClientIp = (req) => {
  return req.headers['x-forwarded-for'] || 
    req.headers['x-real-ip'] || 
    req.connection.remoteAddress || 
    req.socket.remoteAddress || 
    (req.connection.socket ? req.connection.socket.remoteAddress : null) || 
    'Unknown';
};

// Helper function to validate and sanitize dimensions
const validateDimensions = (width, height) => {
  const validatedWidth = Math.max(50, Math.min(500, parseInt(width) || 200));
  const validatedHeight = Math.max(30, Math.min(300, parseInt(height) || 60));
  return { width: validatedWidth, height: validatedHeight };
};

// Helper function to construct full image URL (handle reverse proxy scenarios)
const getFullImageUrl = (imagePath, req) => {
  // If it's already a full URL, return it as is
  if (!imagePath) return "";
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Handle reverse proxy scenarios
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  
  // Construct full URL using request information
  return `${protocol}://${host}${imagePath}`;
};

// Generate badge image for embedding on external websites
export const generateBadgeEmbed = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { ref, width = 200, height = 60 } = req.query; // Get referral source and dimensions from query parameters
    
    // Validate dimensions
    const { width: validatedWidth, height: validatedHeight } = validateDimensions(width, height);
    
    // Set appropriate headers for cross-platform compatibility
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=3600, must-revalidate");
    res.setHeader("Access-Control-Allow-Origin", "*");
    
    // Track referral if ref parameter is provided
    if (ref) {
      try {
        const clientIp = getClientIp(req);
        const userAgent = req.headers['user-agent'] || 'Unknown';
        
        // Update or create referral record
        await BadgeReferral.findOneAndUpdate(
          { 
            companyId: companyId,
            sourceWebsite: ref 
          },
          { 
            $inc: { referralCount: 1 },
            $set: { 
              lastReferralAt: new Date(),
              userAgent: userAgent,
              ipAddress: clientIp
            }
          },
          { 
            upsert: true,
            new: true 
          }
        );
      } catch (trackingError) {
        console.error("Error tracking badge referral:", trackingError);
        // Don't fail the main request if tracking fails
      }
    }
    
    // Get company information
    const company = await CompanyTeamData.findById(companyId);
    if (!company) {
      // Return a simple SVG error badge with custom dimensions
      const svg = `
        <svg width="${validatedWidth}" height="${validatedHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${validatedWidth}" height="${validatedHeight}" fill="#ff6b6b" rx="8" />
          <text x="${validatedWidth/2}" y="${validatedHeight/2 + 5}" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle">
            Company Not Found
          </text>
        </svg>
      `;
      
      return res.status(404).send(svg);
    }
    
    // Get company's badges
    const now = new Date();
    const companyBadges = await CompanyBadge.find({
      company: companyId,
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: now } }
      ]
    })
    .populate("badge", "name image updatedAt")
    .sort({ assignedAt: -1 });
    
    // If no badges, return a default verification badge with custom dimensions
    if (companyBadges.length === 0) {
      // Return a simple SVG verification badge with custom dimensions
      const svg = `
        <svg width="${validatedWidth}" height="${validatedHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${validatedWidth}" height="${validatedHeight}" fill="#40c0b8" rx="8" />
          <text x="${validatedWidth/2}" y="${validatedHeight/3 + 5}" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle" font-weight="bold">
            VERIFIED
          </text>
          <text x="${validatedWidth/2}" y="${2*validatedHeight/3 + 5}" font-family="Arial, sans-serif" font-size="12" fill="white" text-anchor="middle">
            by demand10
          </text>
        </svg>
      `;
      
      return res.status(200).send(svg);
    }
    
    // Select the most recently assigned badge
    const selectedBadge = companyBadges[0].badge;
    const selectedCompanyBadge = companyBadges[0];
    
    // Create a unique ETag based on badge and company badge data
    const etagComponents = [
      selectedBadge._id,
      selectedBadge.updatedAt ? selectedBadge.updatedAt.getTime() : Date.now(),
      selectedCompanyBadge.assignedAt.getTime()
    ];
    
    const etag = `"badge-${etagComponents.join('-')}"`;
    res.set('ETag', etag);
    
    // For badges, redirect to the badge image with proper URL construction
    if (selectedBadge.image) {
      // Check if it's already a full URL
      if (selectedBadge.image.startsWith('http')) {
        // External URL - redirect directly
        return res.redirect(302, selectedBadge.image);
      } else {
        // Local path - construct full URL
        const fullImageUrl = getFullImageUrl(selectedBadge.image, req);
        return res.redirect(302, fullImageUrl);
      }
    }
    
    // Fallback to default badge with custom dimensions
    const svg = `
      <svg width="${validatedWidth}" height="${validatedHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${validatedWidth}" height="${validatedHeight}" fill="#40c0b8" rx="8" />
        <text x="${validatedWidth/2}" y="${validatedHeight/3 + 5}" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle" font-weight="bold">
          ${selectedBadge.name || 'VERIFIED'}
        </text>
        <text x="${validatedWidth/2}" y="${2*validatedHeight/3 + 5}" font-family="Arial, sans-serif" font-size="12" fill="white" text-anchor="middle">
          demand10 Badge
        </text>
      </svg>
    `;
    
    return res.status(200).send(svg);
    
  } catch (error) {
    console.error("Error generating badge embed:", error);
    
    // Set appropriate headers
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age-300");
    res.setHeader("Access-Control-Allow-Origin", "*");
    
    // Return a default error badge with default dimensions
    const svg = `
      <svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="60" fill="#cccccc" rx="8" />
        <text x="100" y="35" font-family="Arial, sans-serif" font-size="14" fill="#666666" text-anchor="middle">
          demand10 Badge
        </text>
      </svg>
    `;
    
    return res.status(200).send(svg);
  }
};

// Get badge information for embedding (JSON response)
export const getBadgeEmbedInfo = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { ref, width = 200, height = 60 } = req.query; // Get referral source and dimensions from query parameters
    
    // Validate dimensions
    const { width: validatedWidth, height: validatedHeight } = validateDimensions(width, height);
    
    // Set appropriate headers for cross-platform compatibility
    res.set('Cache-Control', 'public, max-age-3600, must-revalidate');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', 'application/json');
    
    // Track referral if ref parameter is provided
    if (ref) {
      try {
        const clientIp = getClientIp(req);
        const userAgent = req.headers['user-agent'] || 'Unknown';
        
        // Update or create referral record
        await BadgeReferral.findOneAndUpdate(
          { 
            companyId: companyId,
            sourceWebsite: ref 
          },
          { 
            $inc: { referralCount: 1 },
            $set: { 
              lastReferralAt: new Date(),
              userAgent: userAgent,
              ipAddress: clientIp
            }
          },
          { 
            upsert: true,
            new: true 
          }
        );
      } catch (trackingError) {
        console.error("Error tracking badge referral:", trackingError);
        // Don't fail the main request if tracking fails
      }
    }
    
    // Get company information
    const company = await CompanyTeamData.findById(companyId);
    if (!company) {
      return res.status(404).json({ 
        success: false,
        message: "Company not found" 
      });
    }
    
    // Get company's badges
    const now = new Date();
    const companyBadges = await CompanyBadge.find({
      company: companyId,
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: now } }
      ]
    })
    .populate("badge", "name image updatedAt")
    .sort({ assignedAt: -1 });
    
    // Generate company profile URL with UTM parameters for tracking
    const baseUrl = `https://demand10.com/${company.subcategory?.slug || 'company'}/${company.slug}`;
    const utmParams = ref ? `?utm_source=${ref}&utm_medium=badge&utm_campaign=badge-referral` : '';
    const companyUrl = baseUrl + utmParams;
    
    // Process badge data to ensure proper image URLs
    const processedBadges = companyBadges.map(cb => {
      let badgeImageUrl = cb.badge.image;
      
      // If it's a local path, construct full URL
      if (badgeImageUrl && !badgeImageUrl.startsWith('http')) {
        badgeImageUrl = getFullImageUrl(badgeImageUrl, req);
      }
      
      return {
        id: cb.badge._id,
        name: cb.badge.name,
        badge: {
          _id: cb.badge._id,
          name: cb.badge.name,
          image: badgeImageUrl,
          updatedAt: cb.badge.updatedAt,
          width: validatedWidth,
          height: validatedHeight
        },
        company: {
          _id: company._id,
          name: company.companyName,
          slug: company.slug,
          url: companyUrl
        },
        assignedAt: cb.assignedAt,
        expiresAt: cb.expiresAt
      };
    });
    
    res.status(200).json({
      success: true,
      company: {
        name: company.companyName,
        slug: company.slug,
        url: companyUrl
      },
      data: processedBadges
    });
    
  } catch (error) {
    console.error("Error fetching badge embed info:", error);
    
    // Set appropriate headers
    res.set('Cache-Control', 'public, max-age-300');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', 'application/json');
    
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// Get badge referral statistics (for admin dashboard)
export const getBadgeReferralStats = async (req, res) => {
  try {
    const { companyId, limit = 10 } = req.query;
    
    let filter = {};
    if (companyId) {
      filter.companyId = companyId;
    }
    
    const referrals = await BadgeReferral.find(filter)
      .sort({ referralCount: -1, lastReferralAt: -1 })
      .limit(parseInt(limit));
    
    // Populate company names
    const referralsWithCompanyNames = await Promise.all(referrals.map(async (referral) => {
      const company = await CompanyTeamData.findById(referral.companyId);
      return {
        ...referral.toObject(),
        companyName: company ? company.companyName : 'Unknown Company'
      };
    }));
    
    res.status(200).json({
      success: true,
      data: referralsWithCompanyNames
    });
  } catch (error) {
    console.error("Error fetching badge referral stats:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};