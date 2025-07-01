import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Register a new user
 */
export const register: RequestHandler = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate required fields
    if (!username || !email || !password || !role) {
      return res.status(400).json({
        error: "All fields are required",
        message: "Please provide username, email, password, and role",
      });
    }

    // Validate role
    if (!["Caregiver", "Standard User"].includes(role)) {
      return res.status(400).json({
        error: "Invalid role",
        message: 'Role must be either "Caregiver" or "Standard User"',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === email ? "email" : "username";
      return res.status(400).json({
        error: "User already exists",
        message: `A user with this ${field} already exists`,
      });
    }

    // Create new user
    console.log(`📝 Creating new user: ${username} (${role})`);
    const user = new User({
      username,
      email,
      password,
      role,
    });

    await user.save();
    console.log(`✅ User saved to database: ${user._id}`);

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });

    console.log(`✅ New user registered: ${username} (${role})`);
  } catch (error: any) {
    console.error("Registration error:", error);

    // Ensure response hasn't been sent already
    if (res.headersSent) {
      return;
    }

    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message,
      );
      return res.status(400).json({
        error: "Validation error",
        message: messages.join(", "),
      });
    }

    return res.status(500).json({
      error: "Server error",
      message: "An error occurred during registration",
    });
  }
};

/**
 * Login user
 */
export const login: RequestHandler = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        error: "Missing credentials",
        message: "Please provide username and password",
      });
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Username or password is incorrect",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Username or password is incorrect",
      });
    }

    // Generate token
    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });

    console.log(`✅ User logged in: ${user.username} (${user.role})`);
  } catch (error) {
    console.error("Login error:", error);

    // Ensure response hasn't been sent already
    if (res.headersSent) {
      return;
    }

    return res.status(500).json({
      error: "Server error",
      message: "An error occurred during login",
    });
  }
};

/**
 * Get current user profile
 */
export const getProfile: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User profile not found",
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      error: "Server error",
      message: "An error occurred while fetching profile",
    });
  }
};

/**
 * Logout user (invalidate token on client side)
 */
export const logout: RequestHandler = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "Server error",
      message: "An error occurred during logout",
    });
  }
};
