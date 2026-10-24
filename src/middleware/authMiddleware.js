import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const authenticateUser = async (req, res, next) => {
  try {
    const token = req.cookies?.nestro_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please sign in first",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select(
      "_id name email role"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired login session",
    });
  }
};