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
router.post("/register", async (req, res) => {
  try {
    // Parse the availability if it's a string
    let availability;
    if (typeof req.body.availability === 'string') {
      availability = JSON.parse(req.body.availability);
    }

    const userData = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phoneNumber: req.body.phoneNumber,
      CIN: req.body.CIN,
      role: req.body.role,
      specialization: req.body.specialization,
      department: req.body.departmentId,
      availability: availability,
      medicalHistory: req.body.medicalHistory,
      profileImage: req.files?.profileImage?.[0]?.path,
      diplomaImage: req.files?.diplomaImage?.[0]?.path,
    };

    const user = new User(userData);
    await user.save();

    res.status(201).json({ 
      message: "User registered successfully", 
      user: user 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: "Error registering user", 
      error: error.message 
    });
  }
});

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

    // Convert user document to object and remove password
    const userObject = user.toObject();
    delete userObject.password;

    // Return all user data except password
    res.json({ 
      token, 
      user: userObject
    });
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
