// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/user");

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

module.exports = authMiddleware;
