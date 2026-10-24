
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import nodemailer from "nodemailer";

import User from "../models/user.model.js";
import EmailOtp from "../models/emailOtp.model.js";

// ==========================================
// COOKIE OPTIONS
// ==========================================

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

// ==========================================
// EMAIL TRANSPORTER
// ==========================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// ==========================================
// OTP HASH
// ==========================================

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(otp).digest("hex");

// ==========================================
// SEND REGISTRATION OTP
// POST /api/auth/send-otp
// ==========================================

export const sendRegistrationOtp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      return res.status(500).json({
        success: false,
        message: "Email service is not configured",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const now = new Date();

    const existingOtp = await EmailOtp.findOne({
      email: normalizedEmail,
    });

    if (
      existingOtp &&
      now.getTime() - new Date(existingOtp.lastSentAt).getTime() < 60000
    ) {
      return res.status(429).json({
        success: false,
        message: "Please wait 60 seconds before requesting another OTP",
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const hashedPassword = await bcrypt.hash(password, 12);

    await EmailOtp.findOneAndUpdate(
      { email: normalizedEmail },
      {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        otpHash: hashOtp(otp),
        expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
        attempts: 0,
        lastSentAt: now,
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    try {
      await transporter.sendMail({
        from: `"Nestro" <${process.env.EMAIL_USER}>`,
        to: normalizedEmail,
        subject: "Your Nestro Email Verification Code",
        text: `Your Nestro verification code is ${otp}. It expires in 5 minutes. Do not share this code with anyone.`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px">
            <h2 style="color:#9a633b">Welcome to Nestro!</h2>
            <p>Use the verification code below to create your account.</p>
            <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#9a633b;padding:16px 0">
              ${otp}
            </div>
            <p>This code expires in 5 minutes.</p>
            <p style="color:#777;font-size:13px">
              If you did not request this code, you can ignore this email.
            </p>
          </div>
        `,
      });
    } catch (mailError) {
      await EmailOtp.deleteOne({ email: normalizedEmail });
      throw mailError;
    }

    return res.status(200).json({
      success: true,
      message: "Verification OTP sent to your email",
    });
  } catch (error) {
    console.error("SEND OTP ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to send verification email",
    });
  }
};

// ==========================================
// VERIFY OTP AND CREATE ACCOUNT
// POST /api/auth/verify-otp
// ==========================================

export const verifyRegistrationOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email?.trim() || !/^\d{6}$/.test(String(otp ?? ""))) {
      return res.status(400).json({
        success: false,
        message: "A valid email and six-digit OTP are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const pending = await EmailOtp.findOne({
      email: normalizedEmail,
    });

    if (!pending) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please request a new OTP",
      });
    }

    if (pending.expiresAt.getTime() <= Date.now()) {
      await EmailOtp.deleteOne({ email: normalizedEmail });

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one",
      });
    }

    if (pending.attempts >= 5) {
      await EmailOtp.deleteOne({ email: normalizedEmail });

      return res.status(429).json({
        success: false,
        message: "Too many attempts. Please request a new OTP",
      });
    }

    const submittedBuffer = Buffer.from(hashOtp(String(otp)), "hex");
    const storedBuffer = Buffer.from(pending.otpHash, "hex");

    const otpMatches =
      submittedBuffer.length === storedBuffer.length &&
      crypto.timingSafeEqual(submittedBuffer, storedBuffer);

    if (!otpMatches) {
      pending.attempts += 1;

      if (pending.attempts >= 5) {
        await EmailOtp.deleteOne({ email: normalizedEmail });

        return res.status(429).json({
          success: false,
          message: "Too many incorrect attempts. Please request a new OTP",
        });
      }

      await pending.save();

      return res.status(400).json({
        success: false,
        message: "Incorrect OTP",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      await EmailOtp.deleteOne({ email: normalizedEmail });

      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const user = await User.create({
      name: pending.name,
      email: pending.email,
      password: pending.password,
      role: "user",
    });

    await EmailOtp.deleteOne({ email: normalizedEmail });

    return res.status(201).json({
      success: true,
      message: "Email verified and account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    console.error("VERIFY OTP ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify OTP",
    });
  }
};

// ==========================================
// LOGIN USER
// POST /api/auth/login
// ==========================================

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("nestro_token", token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to log in",
    });
  }
};

// ==========================================
// LOGOUT USER
// POST /api/auth/logout
// ==========================================

export const logoutUser = (req, res) => {
  res.clearCookie("nestro_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// ==========================================
// GET CURRENT LOGGED-IN USER
// GET /api/auth/me
// Requires authenticateUser middleware
// ==========================================

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("GET CURRENT USER ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch current user",
    });
  }
};

// Compatibility alias if authRouter imports getMe
export const getMe = getCurrentUser;
