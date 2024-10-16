const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const User = require("../models/user");
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key_here";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

// Register Route
router.post(
  "/register",
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "diplomaImage", maxCount: 1 },
  ]),
  async (req, res) => {
    const {
      name,
      email,
      password,
      role,
      specialization,
      availability,
      medicalHistory,
    } = req.body;

    try {
      // Validate the required fields
      if (!name || !email || !password || !role) {
        return res
          .status(400)
          .json({ message: "Please provide all required fields" });
      }

      // Check if the user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "User with this email already exists" });
      }

      // Create a new user
      const newUser = new User({
        name,
        email,
        password,
        role,
        specialization: role === "Doctor" ? specialization : undefined,
        availability: role === "Doctor" ? availability : undefined,
        medicalHistory: role === "Patient" ? medicalHistory : undefined,
        profileImage: req.files["profileImage"]
          ? req.files["profileImage"][0].path
          : null,
        diplomaImage:
          role === "Doctor" && req.files["diplomaImage"]
            ? req.files["diplomaImage"][0].path
            : null,
        isValidated: role === "Doctor" ? false : true,
      });

      const validationError = newUser.validateSync();
      if (validationError) {
        const errors = Object.values(validationError.errors).map(
          (error) => error.message
        );
        return res.status(400).json({ message: "Validation failed", errors });
      }

      // Save the user to the database
      await newUser.save();

      res
        .status(201)
        .json({ message: "User registered successfully", user: newUser });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
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

    // Create a JWT token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    // Prepare user data to send back (excluding sensitive information)
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isValidated: user.isValidated,
      profileImage: user.profileImage,
    };

    res.json({ token, user: userData });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
