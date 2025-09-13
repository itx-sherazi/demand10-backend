import jwt from "jsonwebtoken";
import cookie from "cookie";
import User from "../model/User.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import sendEmail from "../helpers/send-email.js";
import { generateVerificationEmailTemplate, generatePasswordResetEmailTemplate } from "../helpers/email-templates.js";

// Generate random token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// User Signup with email verification
const signupUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res
        .status(400)
        .json({ ok: false, message: "User already exists with this email" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email verification token
    const emailVerificationToken = generateToken();
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create new user
    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      emailVerificationToken,
      emailVerificationExpires
    });

    await newUser.save();

    // Send verification email using the new template
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`;
    const emailTemplate = generateVerificationEmailTemplate(verificationUrl, newUser.email);
    
    const emailSubject = "Verify Your Email Address";

    await sendEmail({
      to: newUser.email,
      subject: emailSubject,
      text: emailTemplate.text,
      html: emailTemplate.html
    });

    return res.status(201).json({
      ok: true,
      message: "User registered successfully. Please check your email for verification.",
      user: {
        id: newUser._id,
        email: newUser.email,
        createdAt: newUser.createdAt
      },
    });
  } catch (err) {
    // Only log errors in development environment
    if (process.env.NODE_ENV === 'development') {
      console.error('Signup error:', err);
    }
    return res
      .status(500)
      .json({ ok: false, message: "Server error", error: err.message });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    // Find user with this token and check if it's not expired
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        ok: false,
        message: "Invalid or expired verification token"
      });
    }

    // Update user as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    
    await user.save();

    return res.status(200).json({
      ok: true,
      message: "Email verified successfully. You can now log in."
    });
  } catch (err) {
    // Only log errors in development environment
    if (process.env.NODE_ENV === 'development') {
      console.error('Email verification error:', err);
    }
    return res.status(500).json({
      ok: false,
      message: "Server error during email verification",
      error: err.message
    });
  }
};

// User Login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (!existingUser) {
      return res.status(404).json({
        ok: false,
        message: "Please sign up first before logging in.",
      });
    }

    // Check if user is blocked
    if (existingUser.status === 'blocked') {
      return res.status(403).json({
        ok: false,
        message: "Your account has been blocked. Please contact the support team.",
      });
    }

    // Check if email is verified
    if (!existingUser.isEmailVerified) {
      return res.status(401).json({
        ok: false,
        message: "Please verify your email address before logging in.",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        ok: false,
        message: "Incorrect password.",
      });
    }

    // Generate JWT token - Set to 24 hours as requested
    const token = jwt.sign(
      { 
        userId: existingUser._id,
        email: existingUser.email 
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h", // Changed to 24 hours as requested
      }
    );

    // Set cookie with proper configuration
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only true in production (HTTPS)
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      path: "/",
    };

    // Remove domain setting for development
    if (process.env.NODE_ENV !== "production") {
      delete cookieOptions.domain;
    }

    // Set the cookie properly
    res.cookie("userToken", token, cookieOptions);

    return res.status(200).json({
      ok: true,
      message: "Login successful",
      token, // Still include token in response for frontend use if needed
      user: {
        id: existingUser._id,
        email: existingUser.email,
        createdAt: existingUser.createdAt
      },
    });
  } catch (err) {
    // Only log errors in development environment
    if (process.env.NODE_ENV === 'development') {
      console.error('Login error:', err);
    }
    return res.status(500).json({
      ok: false,
      message: "Server error during login",
      error: err.message,
    });
  }
};

// User Logout
const logoutUser = async (req, res) => {
  try {
    // Clear the userToken cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 0, // Expire immediately
      path: "/",
    };

    // Remove domain setting for development
    if (process.env.NODE_ENV !== "production") {
      delete cookieOptions.domain;
    }

    res.cookie("userToken", "", cookieOptions);

    return res.status(200).json({
      ok: true,
      message: "Logout successful"
    });
  } catch (err) {
    // Only log errors in development environment
    if (process.env.NODE_ENV === 'development') {
      console.error('Logout error:', err);
    }
    return res.status(500).json({
      ok: false,
      message: "Server error during logout",
      error: err.message,
    });
  }
};

// Get Current Authenticated User
const getCurrentUser = async (req, res) => {
  try {
    // req.user is set by authMiddleware
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        ok: false,
        message: "User not authenticated"
      });
    }

    // Find user by ID
    const user = await User.findById(userId).select("-password"); // Exclude password field
    
    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      ok: true,
      user
    });
  } catch (err) {
    // Only log errors in development environment
    if (process.env.NODE_ENV === 'development') {
      console.error('Get current user error:', err);
    }
    return res.status(500).json({
      ok: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "No user found with this email address."
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(400).json({
        ok: false,
        message: "Please verify your email address first."
      });
    }

    // Generate reset token
    const resetToken = generateToken();
    const resetTokenExpires = Date.now() + 60 * 60 * 1000; // 1 hour

    // Save token and expiration to user
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetTokenExpires;
    
    await user.save();

    // Send password reset email using the new template
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const emailTemplate = generatePasswordResetEmailTemplate(resetUrl, user.email);
    
    const emailSubject = "Password Reset Request";

    await sendEmail({
      to: user.email,
      subject: emailSubject,
      text: emailTemplate.text,
      html: emailTemplate.html
    });

    return res.status(200).json({
      ok: true,
      message: "Password reset link sent to your email."
    });
  } catch (err) {
    // Only log errors in development environment
    if (process.env.NODE_ENV === 'development') {
      console.error('Forgot password error:', err);
    }
    return res.status(500).json({
      ok: false,
      message: "Server error during password reset request",
      error: err.message
    });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Find user with this token and check if it's not expired
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        ok: false,
        message: "Invalid or expired reset token."
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token fields
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    await user.save();

    return res.status(200).json({
      ok: true,
      message: "Password reset successfully. You can now log in with your new password."
    });
  } catch (err) {
    // Only log errors in development environment
    if (process.env.NODE_ENV === 'development') {
      console.error('Reset password error:', err);
    }
    return res.status(500).json({
      ok: false,
      message: "Server error during password reset",
      error: err.message
    });
  }
};

// Get All Users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Exclude password field
    return res.status(200).json({
      ok: true,
      count: users.length,
      users,
    });
  } catch (err) {
    // Only log errors in development environment
    if (process.env.NODE_ENV === 'development') {
      console.error('Get all users error:', err);
    }
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch users",
      error: err.message,
    });
  }
};

// Delete User
const deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "User deleted successfully",
      deletedUser: {
        id: deletedUser._id,
        email: deletedUser.email
      },
    });
  } catch (err) {
    // Only log errors in development environment
    if (process.env.NODE_ENV === 'development') {
      console.error('Delete user error:', err);
    }
    return res.status(500).json({
      ok: false,
      message: "Error deleting user",
      error: err.message,
    });
  }
};

// Block User
const blockUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { status: 'blocked' },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "User blocked successfully",
      user,
    });
  } catch (err) {
    // Only log errors in development environment
    if (process.env.NODE_ENV === 'development') {
      console.error('Block user error:', err);
    }
    return res.status(500).json({
      ok: false,
      message: "Error blocking user",
      error: err.message,
    });
  }
};

// Activate User
const activateUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { status: 'active' },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "User activated successfully",
      user,
    });
  } catch (err) {
    // Only log errors in development environment
    if (process.env.NODE_ENV === 'development') {
      console.error('Activate user error:', err);
    }
    return res.status(500).json({
      ok: false,
      message: "Error activating user",
      error: err.message,
    });
  }
};

export { signupUser, verifyEmail, loginUser, logoutUser, getCurrentUser, forgotPassword, resetPassword, getAllUsers, deleteUser, blockUser, activateUser };
