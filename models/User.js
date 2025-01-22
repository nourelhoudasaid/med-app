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
    phoneNumber: { type: String, required: true },
    CIN: { type: String, required: true }, 
    role: { type: String, enum: ["Doctor", "Patient", "Admin"], required: true },
    
    // Doctor specific fields
    specialization: { 
      type: String, 
      required: function() { return this.role === "Doctor" }
    },
    department: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: function() { return this.role === "Doctor" },
      default: null
    },
    profileImage: { 
      type: String, 
      required: function() { return this.role === "Doctor" },
      default: function() {
        return this.role === "Doctor" ? "https://res.cloudinary.com/ddwzg1xae/image/upload/v1/med/default-doctor.jpg" : undefined;
      }
    },
    diplomaImage: { 
      type: String, 
      required: function() { return this.role === "Doctor" },
      default: function() {
        return this.role === "Doctor" ? "https://res.cloudinary.com/ddwzg1xae/image/upload/v1/med/default-diploma.jpg" : undefined;
      }
    },
    availability: [{
      day: { 
        type: String,
        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
      },
      slots: [{
        time: String,
        isBooked: { type: Boolean, default: false }
      }]
    }],
    
    // Patient specific fields
    medicalHistory: { type: String },
    
    // Common fields
    isValidated: { type: Boolean, default: false }
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

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
