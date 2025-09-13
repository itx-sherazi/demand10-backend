import jwt from "jsonwebtoken";

export function userAuthMiddleware(req, res, next) {
  // Get cookies from the request
  const cookies = req.cookies;
  
  // Check if userToken cookie exists
  if (!cookies || !cookies.userToken) {
    return res.status(401).json({ message: "Please login first" });
  }

  const token = cookies.userToken;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (err) {
    // Only log errors in development environment
    if (process.env.NODE_ENV === 'development') {
      console.error('Authentication error:', err);
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired. Please login again." });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token. Please login again." });
    } else {
      return res.status(500).json({ message: "Authentication error" });
    }
  }
}