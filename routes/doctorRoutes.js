// routes/doctorRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Appointment = require("../models/Appointment");
const Department = require("../models/Department");
const { upload } = require('../config/cloudinary');
const mongoose = require('mongoose');
const { authenticateUser } = require('../middleware/auth');

// Update the upload middleware configuration
const uploadFields = upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'diplomaImage', maxCount: 1 }
]);

// Update doctor's own profile (must come before /:id routes)
router.put("/profile", authenticateUser, uploadFields, async (req, res) => {
  try {
    // Ensure user is a doctor
    if (req.user.role !== "Doctor") {
      return res.status(403).json({ message: "Access denied. Doctors only." });
    }

    const {
      name,
      email,
      phoneNumber,
      CIN,
      specialization,
      departmentId,
      availability
    } = req.body;

    const updateData = {
      name,
      email,
      phoneNumber,
      CIN,
      specialization
    };

    // Only update fields that are provided
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    // Update department if provided
    if (departmentId) {
      updateData.department = departmentId;
    }

    // Update availability if provided
    if (availability) {
      updateData.availability = JSON.parse(availability);
    }

    // Update images if provided
    if (req.files) {
      if (req.files.profileImage) {
        updateData.profileImage = req.files.profileImage[0].path;
      }
      if (req.files.diplomaImage) {
        updateData.diplomaImage = req.files.diplomaImage[0].path;
      }
    }

    const updatedDoctor = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedDoctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      doctor: updatedDoctor
    });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({ 
      message: "Error updating doctor profile", 
      error: error.message 
    });
  }
});

// Get doctor's profile by ID
router.get("/:id/profile", async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: "Doctor" })
      .select('-password')
      .populate('department', 'name description')
      .lean();

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Get doctor's statistics
    const stats = await Appointment.aggregate([
      { $match: { doctor: new mongoose.Types.ObjectId(req.params.id) } },
      {
        $group: {
          _id: null,
          totalAppointments: { $sum: 1 },
          confirmedAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'Confirmed'] }, 1, 0] }
          },
          completedAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          cancelledAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get total number of patients
    const uniquePatients = await Appointment.distinct('patient', { 
      doctor: new mongoose.Types.ObjectId(req.params.id) 
    });

    const profile = {
      ...doctor,
      statistics: {
        ...(stats[0] || { 
          totalAppointments: 0, 
          confirmedAppointments: 0, 
          completedAppointments: 0,
          cancelledAppointments: 0 
        }),
        totalPatients: uniquePatients.length
      }
    };

    res.status(200).json(profile);
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    res.status(500).json({ 
      message: "Error fetching doctor profile", 
      error: error.message 
    });
  }
});

// Create doctor
router.post("/register", uploadFields, async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phoneNumber,
      CIN,
      specialization,
      department,
      availability
    } = req.body;

    const doctor = new User({
      name,
      email,
      password,
      phoneNumber,
      CIN,
      role: "Doctor",
      specialization,
      department,
      availability: JSON.parse(availability),
      profileImage: req.files?.profileImage?.[0]?.path,
      diplomaImage: req.files?.diplomaImage?.[0]?.path,
      isValidated: false
    });

    await doctor.save();
    res.status(201).json({ message: "Doctor registered successfully", doctor });
  } catch (error) {
    res.status(500).json({ message: "Error registering doctor", error: error.message });
  }
});

// Get all doctors
router.get("/", async (req, res) => {
  try {
    const doctors = await User.find({ role: "Doctor" })
      .lean();

    // Transform the data to include only necessary fields
    const formattedDoctors = doctors.map(doctor => ({
      _id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      specialization: doctor.specialization,
      availability: doctor.availability,
      isValidated: doctor.isValidated,
      profileImage: doctor.profileImage,
      diplomaImage: doctor.diplomaImage
    }));

    res.status(200).json(formattedDoctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get doctor by ID
router.get("/:id", async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Update doctor by ID
router.put("/:id", uploadFields, async (req, res) => {
  try {
    const { name, specialty, availableTimes } = req.body;
    const doctor = await User.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Update basic fields
    doctor.name = name || doctor.name;
    doctor.specialty = specialty || doctor.specialty;
    doctor.availableTimes = availableTimes ? JSON.parse(availableTimes) : doctor.availableTimes;

    // Update images if provided
    if (req.files) {
      if (req.files.profileImage) {
        doctor.profileImage = req.files.profileImage[0].path;
      }
      if (req.files.diplomaImage) {
        doctor.diplomaImage = req.files.diplomaImage[0].path;
      }
    }

    await doctor.save();
    res.status(200).json({ message: "Doctor updated successfully", doctor });
  } catch (error) {
    console.error('Doctor update error:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete doctor by ID
router.delete("/:id", async (req, res) => {
  try {
    const doctor = await User.findByIdAndDelete(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.status(200).json({ message: "Doctor deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Get doctor availability
router.get('/:id/availability', async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id)
      .select('availability')
      .lean();

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor.availability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update doctor availability
router.put('/:id/availability', authenticateUser, async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.availability = req.body.availability;
    await doctor.save();

    res.json(doctor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get doctor statistics
router.get('/:id/stats', authenticateUser, async (req, res) => {
  try {
    const doctorId = new mongoose.Types.ObjectId(req.params.id);
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    // Get basic appointment stats
    const basicStats = await Appointment.aggregate([
      { $match: { doctor: doctorId } },
      {
        $group: {
          _id: null,
          totalAppointments: { $sum: 1 },
          confirmedAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'Confirmed'] }, 1, 0] }
          },
          completedAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          cancelledAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
          },
          totalRevenue: { 
            $sum: { 
              $cond: [
                { $eq: ['$status', 'Completed'] },
                { $ifNull: ['$fee', 0] },
                0
              ]
            }
          }
        }
      }
    ]);

    // Get monthly appointments data for graph
    const monthlyStats = await Appointment.aggregate([
      { 
        $match: { 
          doctor: doctorId,
          createdAt: { $gte: startOfYear }
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
          },
          revenue: {
            $sum: { 
              $cond: [
                { $eq: ['$status', 'Completed'] },
                { $ifNull: ['$fee', 0] },
                0
              ]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get daily stats for the current week
    const dailyStats = await Appointment.aggregate([
      {
        $match: {
          doctor: doctorId,
          appointmentDate: { $gte: startOfWeek }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$appointmentDate' },
            month: { $month: '$appointmentDate' },
            day: { $dayOfMonth: '$appointmentDate' }
          },
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Get time slot distribution
    const timeSlotStats = await Appointment.aggregate([
      { $match: { doctor: doctorId } },
      {
        $group: {
          _id: { $hour: '$appointmentDate' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Get patient demographics
    const patientStats = await Appointment.aggregate([
      { 
        $match: { 
          doctor: doctorId,
          status: 'Completed'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'patient',
          foreignField: '_id',
          as: 'patientInfo'
        }
      },
      { $unwind: '$patientInfo' },
      {
        $group: {
          _id: null,
          totalUniquePatients: { $addToSet: '$patient' },
          averageAge: { 
            $avg: { 
              $cond: [
                { $ifNull: ['$patientInfo.dateOfBirth', false] },
                {
                  $divide: [
                    { $subtract: [new Date(), '$patientInfo.dateOfBirth'] },
                    (365 * 24 * 60 * 60 * 1000)
                  ]
                },
                null
              ]
            }
          }
        }
      }
    ]);

    // Calculate period comparisons
    const periodComparisons = {
      thisMonth: await Appointment.countDocuments({
        doctor: doctorId,
        createdAt: { $gte: startOfMonth }
      }),
      thisWeek: await Appointment.countDocuments({
        doctor: doctorId,
        createdAt: { $gte: startOfWeek }
      }),
      today: await Appointment.countDocuments({
        doctor: doctorId,
        createdAt: {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lt: new Date(today.setHours(23, 59, 59, 999))
        }
      })
    };

    res.json({
      overview: basicStats[0] || {
        totalAppointments: 0,
        confirmedAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        totalRevenue: 0
      },
      graphData: {
        monthly: monthlyStats,
        daily: dailyStats,
        timeSlotDistribution: timeSlotStats
      },
      patientAnalytics: {
        ...patientStats[0],
        totalUniquePatients: patientStats[0]?.totalUniquePatients?.length || 0
      },
      periodComparisons,
      performanceMetrics: {
        completionRate: basicStats[0] 
          ? (basicStats[0].completedAppointments / basicStats[0].totalAppointments * 100).toFixed(2)
          : 0,
        cancellationRate: basicStats[0]
          ? (basicStats[0].cancelledAppointments / basicStats[0].totalAppointments * 100).toFixed(2)
          : 0,
        averageAppointmentsPerDay: basicStats[0]
          ? (basicStats[0].totalAppointments / 30).toFixed(2)
          : 0
      }
    });
  } catch (error) {
    console.error('Error fetching doctor stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get doctor's patients (unique patients from appointments)
router.get("/:id/patients", authenticateUser, async (req, res) => {
  try {
    // Find all appointments for this doctor
    const appointments = await Appointment.find({ doctor: req.params.id })
      .populate({
        path: 'patient',
        select: 'name email phoneNumber CIN medicalHistory'
      })
      .lean();

    // Extract unique patients
    const uniquePatients = Array.from(
      new Map(
        appointments.map(app => [app.patient._id.toString(), app.patient])
      ).values()
    );

    res.status(200).json(uniquePatients);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching doctor's patients", 
      error: error.message 
    });
  }
});

// Get doctor's appointments
router.get("/:id/appointments", authenticateUser, async (req, res) => {
  try {
    const doctorId = new mongoose.Types.ObjectId(req.params.id);
    
    const appointments = await Appointment.find({ doctor: doctorId })
      .populate('patient', 'name email phoneNumber CIN medicalHistory')
      .populate('doctor', 'name email specialization availability')
      .sort({ appointmentDate: 'asc' })
      .lean();

    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ 
      message: "Error fetching doctor's appointments", 
      error: error.message 
    });
  }
});

// Add this endpoint after your existing routes
router.post('/:id/availability', authenticateUser, async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);
    if (!doctor || doctor.role !== 'Doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const { availability } = req.body;
    
    // Validate availability data structure
    if (!Array.isArray(availability)) {
      return res.status(400).json({ 
        message: 'Availability must be an array of day schedules' 
      });
    }

    // Validate each day's data
    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const isValid = availability.every(day => {
      return (
        validDays.includes(day.day) &&
        Array.isArray(day.slots) &&
        day.slots.every(slot => typeof slot.time === 'string')
      );
    });

    if (!isValid) {
      return res.status(400).json({
        message: 'Invalid availability format',
        format: {
          availability: [{
            day: 'Monday-Sunday',
            slots: [{ time: 'HH:MM', isBooked: false }]
          }]
        }
      });
    }

    // Update doctor's availability
    doctor.availability = availability;
    await doctor.save();

    res.status(200).json({
      message: 'Availability updated successfully',
      availability: doctor.availability
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ 
      message: 'Error updating availability', 
      error: error.message 
    });
  }
});

module.exports = router;
