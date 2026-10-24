
import crypto from "node:crypto";
import mongoose from "mongoose";
import Razorpay from "razorpay";

import ProductModel from "../models/product.model.js";
import OrderModel from "../models/order.model.js";

const FREE_SHIPPING_LIMIT = 5000;
const SHIPPING_CHARGE = 199;

function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error("Razorpay API keys are missing in backend .env");
  }

  return {
    client: new Razorpay({ key_id, key_secret }),
    key_id,
  };
}

function validateAddress(address) {
  if (!address || typeof address !== "object") {
    return "Shipping address is required";
  }

  const requiredFields = [
    "fullName",
    "phone",
    "addressLine1",
    "city",
    "state",
    "pincode",
  ];

  for (const field of requiredFields) {
    if (
      typeof address[field] !== "string" ||
      !address[field].trim()
    ) {
      return `${field} is required`;
    }
  }

  return null;
}

async function prepareOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Your cart is empty");
  }

  if (items.length > 50) {
    throw new Error("Too many items in the order");
  }

  const quantities = new Map();

  for (const item of items) {
    const id = item?.id;
    const quantity = Number(item?.quantity);

    if (!mongoose.isValidObjectId(id)) {
      throw new Error("Invalid product ID in cart");
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 100
    ) {
      throw new Error("Invalid product quantity");
    }

    const key = String(id);

    quantities.set(
      key,
      (quantities.get(key) || 0) + quantity
    );

    if (quantities.get(key) > 100) {
      throw new Error("Maximum quantity per product is 100");
    }
  }

  const ids = [...quantities.keys()];

  const products = await ProductModel.find({
    _id: { $in: ids },
    status: true,
    stock: true,
  });

  if (products.length !== ids.length) {
    throw new Error(
      "One or more products are unavailable. Please refresh your cart."
    );
  }

  const orderItems = products.map((product) => {
    const quantity = quantities.get(String(product._id));

    const unitPrice = Math.round(
      product.price * (1 - (product.discount || 0) / 100) * 100
    ) / 100;

    return {
      product: product._id,
      name: product.name,
      image: product.thumbnail || "",
      price: unitPrice,
      quantity,
    };
  });

  const subtotal = Math.round(
    orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ) * 100
  ) / 100;

  const shippingCharge =
    subtotal >= FREE_SHIPPING_LIMIT ? 0 : SHIPPING_CHARGE;

  const totalAmount = Math.round(
    (subtotal + shippingCharge) * 100
  ) / 100;

  return {
    items: orderItems,
    subtotal,
    shippingCharge,
    totalAmount,
  };
}

function getShippingAddress(address) {
  return {
    fullName: address.fullName.trim(),
    phone: address.phone.trim(),
    addressLine1: address.addressLine1.trim(),
    addressLine2: (address.addressLine2 || "").trim(),
    city: address.city.trim(),
    state: address.state.trim(),
    pincode: address.pincode.trim(),
    landmark: (address.landmark || "").trim(),
  };
}

// ==========================================
// CREATE CASH ON DELIVERY ORDER
// POST /api/orders/cod
// ==========================================

export const createCODOrder = async (req, res) => {
  try {
    const addressError = validateAddress(req.body.shippingAddress);

    if (addressError) {
      return res.status(400).json({
        success: false,
        message: addressError,
      });
    }

    const prepared = await prepareOrderItems(req.body.items);

    const order = await OrderModel.create({
      user: req.user._id,
      items: prepared.items,
      shippingAddress: getShippingAddress(req.body.shippingAddress),
      subtotal: prepared.subtotal,
      shippingCharge: prepared.shippingCharge,
      totalAmount: prepared.totalAmount,
      paymentMethod: "cod",
      paymentStatus: "pending",
      orderStatus: "placed",
    });

    return res.status(201).json({
      success: true,
      message: "Cash on Delivery order placed successfully",
      order: {
        _id: order._id,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
      },
    });
  } catch (error) {
    console.error("COD order error:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to place COD order",
    });
  }
};

// ==========================================
// CREATE RAZORPAY ORDER
// POST /api/orders/razorpay/create
// ==========================================

export const createRazorpayOrder = async (req, res) => {
  let savedOrder = null;

  try {
    const addressError = validateAddress(req.body.shippingAddress);

    if (addressError) {
      return res.status(400).json({
        success: false,
        message: addressError,
      });
    }

    const prepared = await prepareOrderItems(req.body.items);
    const { client, key_id } = getRazorpayInstance();

    savedOrder = await OrderModel.create({
      user: req.user._id,
      items: prepared.items,
      shippingAddress: getShippingAddress(req.body.shippingAddress),
      subtotal: prepared.subtotal,
      shippingCharge: prepared.shippingCharge,
      totalAmount: prepared.totalAmount,
      paymentMethod: "razorpay",
      paymentStatus: "pending",
      orderStatus: "placed",
    });

    const razorpayOrder = await client.orders.create({
      amount: Math.round(prepared.totalAmount * 100),
      currency: "INR",
      receipt: String(savedOrder._id),
      notes: {
        internalOrderId: String(savedOrder._id),
        userId: String(req.user._id),
      },
    });

    savedOrder.razorpayOrderId = razorpayOrder.id;
    await savedOrder.save();

    return res.status(201).json({
      success: true,
      keyId: key_id,
      orderId: String(savedOrder._id),
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: req.user.name || "Customer",
      email: req.user.email || "",
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error.message);

    // Keep a saved order for reconciliation if Razorpay created
    // an order but saving its ID failed.
    if (savedOrder && !savedOrder.razorpayOrderId) {
      try {
        await OrderModel.findOneAndUpdate(
          {
            _id: savedOrder._id,
            paymentStatus: "pending",
            razorpayOrderId: null,
          },
          { $set: { orderStatus: "cancelled" } }
        );
      } catch (cleanupError) {
        console.error("Order cleanup error:", cleanupError.message);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Unable to start online payment. Please try again.",
    });
  }
};

// ==========================================
// VERIFY RAZORPAY PAYMENT
// POST /api/orders/razorpay/verify
// ==========================================

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !mongoose.isValidObjectId(orderId) ||
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment verification details",
      });
    }

    const order = await OrderModel.findOne({
      _id: orderId,
      user: req.user._id,
      paymentMethod: "razorpay",
    });

    if (!order || !order.razorpayOrderId) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "paid") {
      if (
        order.razorpayOrderId === razorpay_order_id &&
        order.razorpayPaymentId === razorpay_payment_id
      ) {
        return res.json({
          success: true,
          message: "Payment already verified",
          orderId: order._id,
        });
      }

      return res.status(409).json({
        success: false,
        message: "Order has already been paid",
      });
    }

    if (order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Payment order does not match",
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      throw new Error("Razorpay secret is missing");
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${order.razorpayOrderId}|${razorpay_payment_id}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(razorpay_signature, "hex");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed",
      });
    }

    // Verify the payment status and amount with Razorpay itself.
    const { client } = getRazorpayInstance();

    const payment = await client.payments.fetch(razorpay_payment_id);

    if (
      payment.order_id !== order.razorpayOrderId ||
      payment.currency !== "INR" ||
      payment.amount !== Math.round(order.totalAmount * 100) ||
      !["authorized", "captured"].includes(payment.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment amount or status could not be verified",
      });
    }

    if (payment.status !== "captured") {
      return res.status(409).json({
        success: false,
        message:
          "Payment is authorized but not captured. Configure payment capture before completing the order.",
      });
    }

    // Atomic update prevents concurrent requests from paying the
    // same pending order twice.
    const updatedOrder = await OrderModel.findOneAndUpdate(
      {
        _id: order._id,
        user: req.user._id,
        paymentStatus: "pending",
        razorpayOrderId: razorpay_order_id,
      },
      {
        $set: {
          paymentStatus: "paid",
          razorpayPaymentId: razorpay_payment_id,
          orderStatus: "confirmed",
        },
      },
      { new: true }
    );

    if (!updatedOrder) {
      const latestOrder = await OrderModel.findById(order._id);

      if (
        latestOrder?.paymentStatus === "paid" &&
        latestOrder.razorpayPaymentId === razorpay_payment_id
      ) {
        return res.json({
          success: true,
          message: "Payment verified successfully",
          orderId: latestOrder._id,
        });
      }

      return res.status(409).json({
        success: false,
        message: "Order status changed. Please check your order.",
      });
    }

    return res.json({
      success: true,
      message: "Payment verified successfully",
      orderId: updatedOrder._id,
      paymentStatus: updatedOrder.paymentStatus,
    });
  } catch (error) {
    console.error("Payment verification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment. Please contact support if money was deducted.",
    });
  }
};



export const getMyOrders = async (req, res) => {
  try {
    const orders = await OrderModel.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get my orders error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your orders.",
    });
  }
};
