import jwt from "jsonwebtoken";
import cookie from "cookie";
import AdminUser from "../model/AdminUser.js";
import bcrypt from "bcrypt";

const signinUserAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await AdminUser.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res
        .status(400)
        .json({ ok: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // 10 = salt rounds

    const newUser = new AdminUser({
      name: name.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    await newUser.save();

    return res.status(201).json({
      ok: true,
      message: "User registered successfully",
      user: newUser,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, message: "Server error", error: err.message });
  }
};
const loginUserAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await AdminUser.findOne({ email: email.toLowerCase() });

    if (!existingUser) {
      return res.status(404).json({
        ok: false,
        message: "User not found. Please sign up first.",
      });
    }

    if (existingUser.name.toLowerCase() !== name.toLowerCase()) {
      return res.status(400).json({
        ok: false,
        message: "Wrong name for this email. Please check your credentials.",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        ok: false,
        message: "Incorrect password",
      });
    }

    const token = jwt.sign(
      { 
        userId: existingUser._id,
        name: name.toLowerCase(), 
        email: email.toLowerCase() 
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    res.setHeader(
      "Set-Cookie",
      cookie.serialize("adminToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      })
    );
    

    return res.status(200).json({
      ok: true,
      message: "Login successful",
      token,
      user: existingUser,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Server error during login",
      error: err.message,
    });
  }
};
const getAllUsersAdmin = async (req, res) => {
  try {
    const users = await AdminUser.find().select("-password"); // Hide password
    return res.status(200).json({
      ok: true,
      users,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Failed to fetch users",
      error: err.message,
    });
  }
};
const deleteUserAdmin = async (req, res) => {
  const { userId } = req.params;

  try {
    const deletedUser = await AdminUser.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "User deleted successfully",
      deletedUser,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      message: "Error deleting user",
      error: err.message,
    });
  }
};

export { loginUserAdmin, signinUserAdmin, getAllUsersAdmin, deleteUserAdmin  };
