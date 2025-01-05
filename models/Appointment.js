// models/appointment.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const appointmentSchema = new Schema(
  {
    name: { type: String, required: true }, // Nom du patient
    phone: { type: String, required: true }, // Numéro de téléphone du patient
    department: { type: String, required: true }, // Département sélectionné
    doctor: { type: String, required: true }, // Référence au docteur
    appointmentDate: { type: Date, required: true }, // Date du rendez-vous
    reason: { type: String, required: true }, // Raison du rendez-vous
   
  },
  { timestamps: true } // Pour inclure createdAt et updatedAt
);

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
