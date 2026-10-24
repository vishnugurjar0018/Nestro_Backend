
import mongoose from "mongoose";

const accountChangeOtpSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    newEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

accountChangeOtpSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const AccountChangeOtp =
  mongoose.models.AccountChangeOtp ||
  mongoose.model("AccountChangeOtp", accountChangeOtpSchema);

export default AccountChangeOtp;
