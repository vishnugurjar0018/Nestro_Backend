
import User from "../models/user.model.js";
import Address from "../models/address.model.js";

// ========================================
// GET USER PROFILE + SAVED ADDRESSES
// GET /api/profile
// ========================================
export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login to view your profile.",
      });
    }

    // Fetch user details; password is excluded
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Fetch only addresses belonging to this user
    const addresses = await Address.find({ user: userId }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully.",
      user: {
        ...user.toObject(),
        id: user._id.toString(),
      },
      addresses: addresses.map((address) => ({
        ...address.toObject(),
        id: address._id.toString(),
      })),
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile.",
    });
  }
};

// ========================================
// UPDATE USER PROFILE
// PUT /api/profile
// ========================================
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login to update your profile.",
      });
    }

    const { name, phone } = req.body;
    const updates = {};

    // Validate name
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty.",
        });
      }

      if (name.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: "Name cannot exceed 100 characters.",
        });
      }

      updates.name = name.trim();
    }

    // Validate phone
    if (phone !== undefined) {
      if (typeof phone !== "string") {
        return res.status(400).json({
          success: false,
          message: "Phone number must be text.",
        });
      }

      const cleanedPhone = phone.trim();

      if (cleanedPhone && !/^[6-9]\d{9}$/.test(cleanedPhone)) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid 10-digit Indian mobile number.",
        });
      }

      updates.phone = cleanedPhone;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a name or phone number to update.",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Return updated user and their saved addresses
    const addresses = await Address.find({ user: userId }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        ...user.toObject(),
        id: user._id.toString(),
      },
      addresses: addresses.map((address) => ({
        ...address.toObject(),
        id: address._id.toString(),
      })),
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
    });
  }
};
