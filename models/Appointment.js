// models/appointment.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const appointmentSchema = new Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User model (Patient)
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Reference to User model (Doctor)
  appointmentDate: { type: Date, required: true },
  reason: { type: String, required: true }, // Reason for the appointment
  status: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled'], default: 'Pending' }
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;

