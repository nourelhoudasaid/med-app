const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const Appointment = require('../models/Appointment');
const MedicalHistory = require('../models/MedicalHistory');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const departments = [
  {
    name: 'Cardiology',
    description: 'Diagnosis and treatment of heart diseases'
  },
  {
    name: 'Neurology',
    description: 'Diagnosis and treatment of nervous system disorders'
  },
  {
    name: 'Pediatrics',
    description: 'Medical care for infants, children, and adolescents'
  },
  {
    name: 'Orthopedics',
    description: 'Treatment of musculoskeletal system conditions'
  },
  {
    name: 'Dermatology',
    description: 'Diagnosis and treatment of skin conditions'
  },
  {
    name: 'Ophthalmology',
    description: 'Eye care and vision health'
  }
];

const doctors = [
  {
    name: 'Dr. John Smith',
    email: 'john.smith@example.com',
    password: 'Doctor123!',
    phoneNumber: '+1234567890',
    CIN: 'D123456',
    role: 'Doctor',
    specialization: 'Cardiology',
    isValidated: true,
    department: 'Cardiology',
    profileImage: 'https://res.cloudinary.com/ddwzg1xae/image/upload/v1/med/default-doctor.jpg',
    diplomaImage: 'https://res.cloudinary.com/ddwzg1xae/image/upload/v1/med/default-diploma.jpg',
    availability: [
      {
        day: 'Monday',
        slots: [
          { time: '09:00', isBooked: false },
          { time: '10:00', isBooked: false },
          { time: '11:00', isBooked: false }
        ]
      },
      {
        day: 'Wednesday',
        slots: [
          { time: '14:00', isBooked: false },
          { time: '15:00', isBooked: false },
          { time: '16:00', isBooked: false }
        ]
      }
    ]
  },
  {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@example.com',
    password: 'Doctor456!',
    phoneNumber: '+1234567891',
    CIN: 'D123457',
    role: 'Doctor',
    specialization: 'Neurology',
    department: 'Neurology',
    isValidated: true,
    profileImage: 'https://res.cloudinary.com/ddwzg1xae/image/upload/v1/med/default-doctor.jpg',
    diplomaImage: 'https://res.cloudinary.com/ddwzg1xae/image/upload/v1/med/default-diploma.jpg',
    availability: [
      {
        day: 'Tuesday',
        slots: [
          { time: '09:00', isBooked: false },
          { time: '10:00', isBooked: false },
          { time: '11:00', isBooked: false }
        ]
      },
      {
        day: 'Thursday',
        slots: [
          { time: '14:00', isBooked: false },
          { time: '15:00', isBooked: false },
          { time: '16:00', isBooked: false }
        ]
      }
    ]
  },
  {
    name: 'Dr. Michael Chen',
    email: 'michael.chen@example.com',
    password: 'Doctor789!',
    phoneNumber: '+1234567892',
    CIN: 'D123458',
    role: 'Doctor',
    specialization: 'Pediatrics',
    department: 'Pediatrics',
    isValidated: true,
    profileImage: 'https://res.cloudinary.com/ddwzg1xae/image/upload/v1/med/default-doctor.jpg',
    diplomaImage: 'https://res.cloudinary.com/ddwzg1xae/image/upload/v1/med/default-diploma.jpg',
    availability: [
      {
        day: 'Monday',
        slots: [
          { time: '09:00', isBooked: false },
          { time: '10:00', isBooked: false },
          { time: '11:00', isBooked: false }
        ]
      },
      {
        day: 'Friday',
        slots: [
          { time: '14:00', isBooked: false },
          { time: '15:00', isBooked: false },
          { time: '16:00', isBooked: false }
        ]
      }
    ]
  },
  {
    name: 'Dr. Emily Brown',
    email: 'emily.brown@example.com',
    password: 'Doctor101!',
    phoneNumber: '+1234567893',
    CIN: 'D123459',
    role: 'Doctor',
    specialization: 'Dermatology',
    department: 'Dermatology',
    isValidated: true,
    profileImage: 'https://res.cloudinary.com/ddwzg1xae/image/upload/v1/med/default-doctor.jpg',
    diplomaImage: 'https://res.cloudinary.com/ddwzg1xae/image/upload/v1/med/default-diploma.jpg',
    availability: [
      {
        day: 'Tuesday',
        slots: [
          { time: '09:00', isBooked: false },
          { time: '10:00', isBooked: false },
          { time: '11:00', isBooked: false }
        ]
      },
      {
        day: 'Thursday',
        slots: [
          { time: '14:00', isBooked: false },
          { time: '15:00', isBooked: false },
          { time: '16:00', isBooked: false }
        ]
      }
    ]
  }
];

const admin = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'Admin123!',
  phoneNumber: '+1234567899',
  CIN: 'A123456',
  role: 'Admin',
  isValidated: true
};

// Add patients data
const patients = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'Patient123!',
    phoneNumber: '+1234567892',
    CIN: 'P123456',
    role: 'Patient',
    medicalHistory: 'No chronic conditions',
    isValidated: true
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    password: 'Patient456!',
    phoneNumber: '+1234567893',
    CIN: 'P123457',
    role: 'Patient',
    medicalHistory: 'Allergic to penicillin',
    isValidated: true
  },
  {
    name: 'Robert Wilson',
    email: 'robert.wilson@example.com',
    password: 'Patient789!',
    phoneNumber: '+1234567894',
    CIN: 'P123458',
    role: 'Patient',
    medicalHistory: 'Asthma',
    isValidated: true
  },
  {
    name: 'Maria Garcia',
    email: 'maria.garcia@example.com',
    password: 'Patient101!',
    phoneNumber: '+1234567895',
    CIN: 'P123459',
    role: 'Patient',
    medicalHistory: 'Diabetes Type 2',
    isValidated: true
  }
];

// Add medical history data generator
const createMedicalHistories = (appointments, patients, doctors) => {
  const medicalHistories = [];
  
  // Create medical history for completed appointments
  const completedAppointments = appointments.filter(app => app.status === 'Completed');
  
  completedAppointments.forEach((appointment, index) => {
    const vitalSigns = {
      bloodPressure: `${Math.floor(Math.random() * (140 - 110) + 110)}/${Math.floor(Math.random() * (90 - 70) + 70)}`,
      heartRate: `${Math.floor(Math.random() * (100 - 60) + 60)}`,
      temperature: `${(Math.random() * (37.8 - 36.5) + 36.5).toFixed(1)}`,
      respiratoryRate: `${Math.floor(Math.random() * (20 - 12) + 12)}`
    };

    const diagnoses = [
      'Common cold',
      'Hypertension',
      'Type 2 Diabetes',
      'Bronchitis',
      'Migraine',
      'Arthritis',
      'Allergic rhinitis',
      'Gastritis'
    ];

    const medications = [
      { name: 'Amoxicillin', dosage: '500mg', frequency: 'Twice daily', duration: '7 days' },
      { name: 'Ibuprofen', dosage: '400mg', frequency: 'As needed', duration: '5 days' },
      { name: 'Metformin', dosage: '850mg', frequency: 'With meals', duration: '30 days' },
      { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily', duration: '30 days' },
      { name: 'Cetirizine', dosage: '10mg', frequency: 'Once daily', duration: '14 days' }
    ];

    const notes = [
      'Patient showing good progress',
      'Follow-up required in 2 weeks',
      'Diet and exercise recommendations provided',
      'Referred to specialist for further evaluation',
      'Blood tests ordered'
    ];

    medicalHistories.push({
      patient: appointment.patient,
      doctor: appointment.doctor,
      appointment: appointment._id,
      diagnosis: diagnoses[Math.floor(Math.random() * diagnoses.length)],
      prescription: {
        medications: [
          medications[Math.floor(Math.random() * medications.length)],
          medications[Math.floor(Math.random() * medications.length)]
        ]
      },
      notes: notes[Math.floor(Math.random() * notes.length)],
      vitalSigns,
      followUpDate: new Date(appointment.appointmentDate.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks after
      createdAt: appointment.appointmentDate
    });
  });

  return medicalHistories;
};

// Update createAppointments function with more detailed data
const createAppointments = (patients, doctors, departments) => {
  const now = new Date();
  const appointments = [];
  const reasons = [
    'Annual check-up',
    'Follow-up visit',
    'Acute illness',
    'Chronic condition management',
    'Prescription renewal',
    'Lab results review',
    'Vaccination',
    'Consultation'
  ];

  // Create past appointments (completed)
  for (let i = 0; i < patients.length * 2; i++) {
    appointments.push({
      patient: patients[i % patients.length]._id,
      doctor: doctors[i % doctors.length]._id,
      department: departments[i % departments.length]._id,
      appointmentDate: new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000), // Past dates, weekly intervals
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      status: 'Completed'
    });
  }

  // Create upcoming confirmed appointments
  for (let i = 0; i < patients.length; i++) {
    appointments.push({
      patient: patients[i]._id,
      doctor: doctors[(i + 1) % doctors.length]._id,
      department: departments[(i + 1) % departments.length]._id,
      appointmentDate: new Date(now.getTime() + (i + 1) * 3 * 24 * 60 * 60 * 1000), // Future dates, 3-day intervals
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      status: 'Confirmed'
    });
  }

  // Create pending appointments
  for (let i = 0; i < patients.length; i++) {
    appointments.push({
      patient: patients[i]._id,
      doctor: doctors[(i + 2) % doctors.length]._id,
      department: departments[(i + 2) % departments.length]._id,
      appointmentDate: new Date(now.getTime() + (i + 7) * 24 * 60 * 60 * 1000), // Future dates, weekly intervals
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      status: 'Pending'
    });
  }

  return appointments;
};

const seedDatabase = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Department.deleteMany({});
    await Appointment.deleteMany({});
    await MedicalHistory.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user directly (password will be hashed by the pre-save hook)
    const adminUser = await User.create(admin);
    console.log('Admin user created');

    // Create departments
    const createdDepartments = await Department.insertMany(departments);
    console.log('Departments created');

    // Map department names to their ObjectIds
    const departmentMap = createdDepartments.reduce((map, dept) => {
      map[dept.name] = dept._id;
      return map;
    }, {});

    // Create doctors with department ObjectIds and hashed passwords
    const doctorsWithDepartmentIds = doctors.map(doctor => ({
      ...doctor,
      department: departmentMap[doctor.specialization]
    }));

    // Create doctors
    const createdDoctors = await Promise.all(
      doctorsWithDepartmentIds.map(async (doctor) => {
        const createdDoctor = await User.create(doctor);
        
        // Add doctor to corresponding department
        const department = createdDepartments.find(d => d._id.equals(doctor.department));
        if (department) {
          department.doctors.push(createdDoctor._id);
          await department.save();
        }
        
        return createdDoctor;
      })
    );
    console.log('Doctors created and added to departments');

    // Create patients with hashed passwords
    const createdPatients = await Promise.all(
      patients.map(async (patient) => {
        return await User.create(patient);
      })
    );
    console.log('Patients created');

    // Create appointments
    const appointmentsData = createAppointments(createdPatients, createdDoctors, createdDepartments);
    const createdAppointments = await Appointment.insertMany(appointmentsData);
    console.log('Appointments created');

    // Create medical histories
    const medicalHistoriesData = createMedicalHistories(createdAppointments, createdPatients, createdDoctors);
    await MedicalHistory.insertMany(medicalHistoriesData);
    console.log('Medical histories created');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase(); 