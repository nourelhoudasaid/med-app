// middleware/authMiddleware.js
/*const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    console.log("Auth Header:", authHeader); // Log the auth header

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No token provided or invalid format"); // Log if no token
      return res.status(401).send({ error: "Please authenticate." });
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("Token:", token); // Log the extracted token

    // Verify and decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded); // Log the decoded token

    // Find user by decoded ID
    const user = await User.findOne({ _id: decoded.userId });
    console.log("User found:", user); // Log the found user

    if (!user) {
      console.log("User not found."); // Log if user is not found
      return res.status(401).send({ error: "Please authenticate." });
    }

// **Role-based Access Control (RBAC) Check**
if (user.role !== "Patient") {
  console.log("Access denied: Not a Patient."); // Debug log
  return res.status(403).send({ error: "Access denied. Only patients can perform this action." });
}




    // Attach the token and user to the request object
    req.token = token;
    req.user = user;
    next(); // Proceed to the next middleware
  } catch (error) {
    // Handle different types of errors
    if (error.name === "JsonWebTokenError") {
      return res.status(401).send({ error: "Invalid token." });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).send({ error: "Token has expired." });
    }
    console.error("Authentication error:", error.message); // Log the error message
    res.status(401).send({ error: "Please authenticate." });
  }
};

module.exports = authMiddleware;*/


const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Authentication Middleware
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).send({ error: "Please authenticate." });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({ _id: decoded.userId });
    if (!user) {
      return res.status(401).send({ error: "Please authenticate." });
    }

    req.token = token;
    req.user = user; // Attach user to the request
    next(); // Proceed
  } catch (error) {
    res.status(401).send({ error: "Invalid or expired token." });
  }
};

// Authorization Middleware for Patients
const authorizePatient = (req, res, next) => {
  if (req.user.role !== "Patient") {
    return res.status(403).send({ error: "Access denied. Patients only." });
  }
  next(); // Proceed if role is "Patient"
};

module.exports = { authenticateUser, authorizePatient };
