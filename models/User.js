const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please enter a valid email address']
    },
    password: { 
      type: String, 
      required: true,
      select: false,
      match: [/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/, 'Password must contain at least 8 characters, including uppercase, lowercase, number and special character']
    },
    role: { type: String, enum: ["Doctor", "Patient", "Admin"], required: true },
    // Fields for patients
    medicalHistory: { type: String, required: function() { return this.role === "Patient"; } },
    // Fields for doctors
    specialization: { type: String, required: function() { return this.role === "Doctor"; } },
    availability: { type: String, required: function() { return this.role === "Doctor"; } },
    diplomaImage: { type: String, required: function() { return this.role === "Doctor"; } },
    // Common fields
    profileImage: { type: String , required: function() { return this.role === "Doctor"; }},
    isValidated: { type: Boolean, default: function() { return this.role === "Patient" || this.role === "Admin"; } },
  },
  { timestamps: true }
);

// Hash the password before saving the user
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

// Check if the model already exists before creating a new one
module.exports = mongoose.models.User || mongoose.model("User", userSchema);
