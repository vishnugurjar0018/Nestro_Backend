import Address from "../models/address.model.js";

const getUserId = (req) => req.user?.id || req.user?._id;

// GET: Login user ke saare addresses
export const getAddresses = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first.",
      });
    }

    const addresses = await Address.find({ user: userId }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      addresses,
    });
  } catch (error) {
    console.error("Get addresses error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch addresses.",
    });
  }
};

// POST: Naya address save karna
export const createAddress = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first.",
      });
    }

    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      addressType,
      isDefault,
    } = req.body;

    if (
      !fullName?.trim() ||
      !phone?.trim() ||
      !addressLine1?.trim() ||
      !city?.trim() ||
      !state?.trim() ||
      !pincode?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required address fields.",
      });
    }

    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit Indian mobile number.",
      });
    }

    if (!/^\d{6}$/.test(pincode.trim())) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 6-digit PIN code.",
      });
    }

    const shouldBeDefault =
      isDefault === true ||
      !(await Address.exists({ user: userId }));

    if (shouldBeDefault) {
      await Address.updateMany(
        { user: userId },
        { $set: { isDefault: false } }
      );
    }

    const address = await Address.create({
      user: userId,
      fullName: fullName.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2?.trim() || "",
      landmark: landmark?.trim() || "",
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      addressType: addressType || "Home",
      isDefault: shouldBeDefault,
    });

    return res.status(201).json({
      success: true,
      message: "Address saved successfully.",
      address,
    });
  } catch (error) {
    console.error("Create address error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save address.",
    });
  }
};

// PUT: Address update karna
export const updateAddress = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first.",
      });
    }

    const allowedFields = [
      "fullName",
      "phone",
      "addressLine1",
      "addressLine2",
      "landmark",
      "city",
      "state",
      "pincode",
      "addressType",
      "isDefault",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.fullName !== undefined) {
      if (
        typeof updates.fullName !== "string" ||
        !updates.fullName.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Full name is required.",
        });
      }

      updates.fullName = updates.fullName.trim();
    }

    if (updates.phone !== undefined) {
      if (
        typeof updates.phone !== "string" ||
        !/^[6-9]\d{9}$/.test(updates.phone.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid 10-digit mobile number.",
        });
      }

      updates.phone = updates.phone.trim();
    }

    if (updates.pincode !== undefined) {
      if (
        typeof updates.pincode !== "string" ||
        !/^\d{6}$/.test(updates.pincode.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid 6-digit PIN code.",
        });
      }

      updates.pincode = updates.pincode.trim();
    }

    if (updates.addressType !== undefined) {
      if (!["Home", "Work", "Other"].includes(updates.addressType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid address type.",
        });
      }
    }

    if (updates.isDefault === true) {
      await Address.updateMany(
        { user: userId },
        { $set: { isDefault: false } }
      );
    }

    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Address updated successfully.",
      address,
    });
  } catch (error) {
    console.error("Update address error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update address.",
    });
  }
};

// DELETE: Address delete karna
export const deleteAddress = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first.",
      });
    }

    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      user: userId,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    // Agar default address delete hua hai, to ek doosre ko default bana do
    if (address.isDefault) {
      const nextAddress = await Address.findOne({
        user: userId,
      }).sort({ createdAt: -1 });

      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully.",
    });
  } catch (error) {
    console.error("Delete address error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete address.",
    });
  }
};