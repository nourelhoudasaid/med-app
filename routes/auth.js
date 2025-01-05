const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const User = require("../models/user");
const { sendConfirmationEmail } = require("../services/emailService");
const cloudinary = require('../config/cloudinary');
const router = express.Router();
const { Readable } = require('stream');

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key_here";

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = async (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'doctors', // Optional: organize uploads in folders
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
};

// Register Route
router.post(
  "/register",
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "diplomaImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        role,
        phoneNumber,
        CIN,
        specialization,
        availability,
        medicalHistory,
      } = req.body;

      // Validate required fields
      if (!name || !email || !password || !role || !phoneNumber || !CIN) {
        return res.status(400).json({ 
          message: "Please provide all required fields" 
        });
      }

      let profileImageUrl = null;
      let diplomaImageUrl = null;

      // Upload images if present and if user is a doctor
      if (role === "Doctor" && req.files) {
        try {
          if (req.files.profileImage) {
            const profileResult = await uploadToCloudinary(
              req.files.profileImage[0].buffer
            );
            profileImageUrl = profileResult.secure_url;
          }

          if (req.files.diplomaImage) {
            const diplomaResult = await uploadToCloudinary(
              req.files.diplomaImage[0].buffer
            );
            diplomaImageUrl = diplomaResult.secure_url;
          }
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          return res.status(500).json({ 
            message: "Error uploading images", 
            error: uploadError.message 
          });
        }
      }

      // Create new user
      const newUser = new User({
        name,
        email,
        password,
        role,
        phoneNumber,
        CIN,
        specialization: role === "Doctor" ? specialization : undefined,
        availability: role === "Doctor" ? availability : undefined,
        medicalHistory: role === "Patient" ? medicalHistory : undefined,
        profileImage: profileImageUrl,
        diplomaImage: diplomaImageUrl,
        isValidated: role === "Doctor" ? false : true,
      });

      await newUser.save();

      // Send confirmation email
      await sendConfirmationEmail(email, name, role);

      res.status(201).json({
        message: "User registered successfully",
        user: newUser
      });

    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ 
        message: "Server error", 
        error: error.message 
      });
    }
  }
);

// Login Route
router.post("/login", async (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide both email and password" });
  }

  try {
    console.log("Searching for email:", email);

    const user = await User.findOne({ email }).select("+password");

    console.log("User found:", user);

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check if the doctor is validated
    if (user.role === "Doctor" && !user.isValidated) {
      return res.status(403).json({
        message:
          "Your account has not been validated yet. Please wait for admin approval.",
      });
    }

    // Create a JWT token with the user role added
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "1h",
    });

    // Prepare user data to send back (excluding sensitive information)
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      CIN: user.CIN,
      isValidated: user.isValidated,
      profileImage: user.profileImage,
    };

    res.json({ token, user: userData });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Logout endpoint
router.post("/logout", (req, res) => {
  // Client-side will handle removing token
  res.status(200).json({ message: "User logged out successfully" });
});
module.exports = router;
