
import mongoose from "mongoose";

const emailOtpSchema = new mongoose.Schema(
  {
    // Registration ke liye
    name: {
      type: String,
      trim: true,
      required: function () {
        return !this.user;
      },
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
    },

    password: {
      type: String,
      required: function () {
        return !this.user;
      },
      select: false,
    },

    // Email change ke liye logged-in user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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
      required: true,
    },
  },
  { timestamps: true }
);

// Registration OTP emails unique; email change records can
// have a different email for the same user.
emailOtpSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

// Registration email uniqueness is handled separately.
// See explanation below before removing the existing unique index.

const EmailOtp =
  mongoose.models.EmailOtp ||
  mongoose.model("EmailOtp", emailOtpSchema);

export default EmailOtp;
