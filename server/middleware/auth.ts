import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";

/**
 * Middleware to authenticate user using JWT token
 */
export const authenticateToken: RequestHandler = async (req, res, next) => {
  try {
    // Check if MongoDB is connected
    if (require("mongoose").connection.readyState !== 1) {
      return res.status(503).json({
        error: "Database unavailable",
        message:
          "MongoDB is not connected. Authentication temporarily disabled.",
      });
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: "Access denied",
        message: "No token provided",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: "Access denied",
        message: "Invalid token - user not found",
      });
    }

    // Add user info to request
    (req as any).userId = user._id.toString();
    (req as any).user = user;

    next();
  } catch (error: any) {
    console.error("Auth middleware error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Access denied",
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Access denied",
        message: "Token expired",
      });
    }

    return res.status(500).json({
      error: "Server error",
      message: "Authentication error",
    });
  }
};

/**
 * Middleware to check if user has Caregiver role
 */
export const requireCaregiver: RequestHandler = async (req, res, next) => {
  try {
    const user = (req as any).user;

    if (!user || user.role !== "Caregiver") {
      return res.status(403).json({
        error: "Access denied",
        message: "Caregiver role required for this action",
      });
    }

    next();
  } catch (error) {
    console.error("Role check error:", error);
    return res.status(500).json({
      error: "Server error",
      message: "Role verification error",
    });
  }
};

/**
 * Optional authentication - adds user to request if token is valid, but doesn't require it
 */
export const optionalAuth: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        const user = await User.findById(decoded.userId);

        if (user) {
          (req as any).userId = user._id.toString();
          (req as any).user = user;
        }
      } catch (error) {
        // Token invalid but we don't reject the request
        console.log("Optional auth - invalid token, proceeding without user");
      }
    }

    next();
  } catch (error) {
    console.error("Optional auth error:", error);
    next(); // Continue without authentication
  }
};
