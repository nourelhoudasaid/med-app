const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");

module.exports = function(io) {
  // @desc    Get all appointments
  // @route   GET /api/appointments
  // @access  Public
  router.get("/", async (req, res) => {
    try {
      const appointments = await Appointment.find()
        .populate("patient", "name email")
        .populate("doctor", "name specialization");
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  });

  // @desc    Get single appointment by ID
  // @route   GET /api/appointments/:id
  // @access  Public
  router.get("/:id", async (req, res) => {
    try {
      const appointment = await Appointment.findById(req.params.id)
        .populate("patient", "name email")
        .populate("doctor", "name specialization");
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  });

  // @desc    Create new appointment
  // @route   POST /api/appointments
  // @access  Public
  router.post("/create", async (req, res) => {
    console.log("Appointment creation route hit");
    const { patient, doctor, appointmentDate, reason } = req.body;
    console.log("Request body:", req.body);

    if (!patient || !doctor || !appointmentDate || !reason) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    try {
      console.log("Creating new appointment");
      const newAppointment = new Appointment({
        patient,
        doctor,
        appointmentDate,
        reason,
      });

      console.log("Saving appointment");
      const savedAppointment = await newAppointment.save();
      console.log("Appointment saved:", savedAppointment);

      console.log("Emitting newAppointment event");
      io.emit("newAppointment", savedAppointment);

      console.log("Sending response");
      res.status(201).json(savedAppointment);
    } catch (error) {
      console.error("Error saving appointment:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  });

  // @desc    Update appointment by ID
  // @route   PUT /api/appointments/:id
  // @access  Public
  router.put("/:id", async (req, res) => {
    const { appointmentDate, reason, status } = req.body;

    try {
      const appointment = await Appointment.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      appointment.appointmentDate = appointmentDate || appointment.appointmentDate;
      appointment.reason = reason || appointment.reason;
      appointment.status = status || appointment.status;

      const updatedAppointment = await appointment.save();
      

      io.emit("updateAppointment", updatedAppointment);

      res.json(updatedAppointment);
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  });

  // @desc    Delete appointment by ID
  // @route   DELETE /api/appointments/:id
  // @access  Public
  router.delete("/:id", async (req, res) => {
    try {
      const appointment = await Appointment.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      await appointment.deleteOne();

      io.emit("deleteAppointment", appointment._id);

      res.json({ message: "Appointment removed" });
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  });

  return router;
};
