
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import nodemailer from "nodemailer";

import User from "../models/user.model.js";
import AccountChangeOtp from "../models/accountChangeOtp.model.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(otp).digest("hex");

const getUserId = (req) => req.user?._id || req.user?.id;

// 1. Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match.",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password.",
      });
    }

    const user = await User.findById(getUserId(req)).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to change password.",
    });
  }
};

// 2. Send OTP to the new email address
export const sendEmailChangeOtp = async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body;

    if (!newEmail || !currentPassword) {
      return res.status(400).json({
        success: false,
        message: "New email and current password are required.",
      });
    }

    const normalizedEmail = newEmail.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const user = await User.findById(getUserId(req)).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!passwordMatches) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    if (normalizedEmail === user.email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: "This is already your current email address.",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: user._id },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This email address is already registered.",
      });
    }

    const existingOtp = await AccountChangeOtp.findOne({
      user: user._id,
    });

    if (
      existingOtp &&
      Date.now() - new Date(existingOtp.lastSentAt).getTime() < 60_000
    ) {
      return res.status(429).json({
        success: false,
        message: "Please wait 60 seconds before requesting another OTP.",
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    await AccountChangeOtp.findOneAndUpdate(
      { user: user._id },
      {
        user: user._id,
        newEmail: normalizedEmail,
        otpHash: hashOtp(otp),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 0,
        lastSentAt: new Date(),
      },
      { upsert: true, new: true, runValidators: true }
    );

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: normalizedEmail,
        subject: "Verify your new Nestro email address",
        text: `Your Nestro email verification OTP is ${otp}. It expires in 5 minutes. If you did not request this, please ignore this email.`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto">
            <h2>Verify your new email</h2>
            <p>Use this OTP to update your Nestro account email:</p>
            <h1 style="letter-spacing:8px">${otp}</h1>
            <p>This OTP expires in 5 minutes.</p>
            <p>If you did not request this change, ignore this email.</p>
          </div>
        `,
      });
    } catch (mailError) {
      await AccountChangeOtp.deleteOne({ user: user._id });

      console.error("Email OTP sending error:", mailError);
      return res.status(500).json({
        success: false,
        message: "Could not send OTP. Please check your email configuration.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent to your new email address.",
    });
  } catch (error) {
    console.error("Send email change OTP error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An OTP request is already being processed. Please retry.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to send verification OTP.",
    });
  }
};

// 3. Verify OTP and update email
export const verifyEmailChangeOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!/^\d{6}$/.test(String(otp || ""))) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 6-digit OTP.",
      });
    }

    const user = await User.findById(getUserId(req));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const pending = await AccountChangeOtp.findOne({
      user: user._id,
    });

    if (!pending) {
      return res.status(400).json({
        success: false,
        message: "No pending email verification. Request a new OTP.",
      });
    }

    if (pending.expiresAt.getTime() <= Date.now()) {
      await AccountChangeOtp.deleteOne({ _id: pending._id });

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (pending.attempts >= 5) {
      await AccountChangeOtp.deleteOne({ _id: pending._id });

      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Request a new OTP.",
      });
    }

    const submittedHash = Buffer.from(hashOtp(String(otp)), "hex");
    const savedHash = Buffer.from(pending.otpHash, "hex");

    const isOtpValid =
      submittedHash.length === savedHash.length &&
      crypto.timingSafeEqual(submittedHash, savedHash);

    if (!isOtpValid) {
      pending.attempts += 1;

      if (pending.attempts >= 5) {
        await AccountChangeOtp.deleteOne({ _id: pending._id });
      } else {
        await pending.save();
      }

      return res.status(400).json({
        success: false,
        message:
          pending.attempts >= 5
            ? "Too many incorrect attempts. Request a new OTP."
            : "Incorrect OTP. Please try again.",
      });
    }

    const existingUser = await User.findOne({
      email: pending.newEmail,
      _id: { $ne: user._id },
    });

    if (existingUser) {
      await AccountChangeOtp.deleteOne({ _id: pending._id });

      return res.status(409).json({
        success: false,
        message: "This email address is already registered.",
      });
    }

    user.email = pending.newEmail;
    await user.save();

    await AccountChangeOtp.deleteOne({ _id: pending._id });

    return res.status(200).json({
      success: true,
      message: "Email address updated successfully.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Verify email change OTP error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This email address is already registered.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update email address.",
    });
  }
};
