import mongoose from "mongoose";

const emailOtpSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    password: { type: String, required: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, required: true },
  },
  { timestamps: true }
);

emailOtpSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const EmailOtp =
  mongoose.models.EmailOtp ||
  mongoose.model("EmailOtp", emailOtpSchema);

export default EmailOtp;