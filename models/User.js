// models/User.js
//const mongoose = require('mongoose');

//const userSchema = new mongoose.Schema({
  //name: {
    //type: String,
    //required: true,
  //},
  //email: {
    //type: String,
    //required: true,
    //unique: true,
  //},
  //password: {
  //  type: String,
   // required: true,
  //},
  //date: {
    //type: Date,
    //default: Date.now,
  //},
//});

//const User = mongoose.model('User', userSchema);

//module.exports = User;



const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Doctor', 'Patient'], required: true },
  medicalHistory: { type: String }, // for patients
  specialization: { type: String }, // for doctors
  availability: { type: String },  // for doctors
}, { timestamps: true });

// Hash the password before saving the user
userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

const User = mongoose.model('User', userSchema);
//const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
