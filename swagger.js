/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - role
 *         - phoneNumber
 *         - CIN
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *         role:
 *           type: string
 *           enum: [Doctor, Patient, Admin]
 *         phoneNumber:
 *           type: string
 *         CIN:
 *           type: string
 *         specialization:
 *           type: string
 *         isValidated:
 *           type: boolean
 *           default: false
 * 
 * paths:
 *   /api/auth/register:
 *     post:
 *       tags: [Auth]
 *       summary: Register a new user
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       responses:
 *         201:
 *           description: User registered successfully
 *         400:
 *           description: Invalid input
 * 
 *   /api/doctors:
 *     get:
 *       tags: [Doctors]
 *       summary: Get all doctors
 *       responses:
 *         200:
 *           description: List of doctors
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/User'
 *     post:
 *       tags: [Doctors]
 *       summary: Register a new doctor
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           multipart/form-data:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 specialty:
 *                   type: string
 *                 availableTimes:
 *                   type: string
 *                 profileImage:
 *                   type: string
 *                   format: binary
 *                 diplomaImage:
 *                   type: string
 *                   format: binary
 *       responses:
 *         201:
 *           description: Doctor registered successfully
 * 
 *   /api/doctors/{id}:
 *     get:
 *       tags: [Doctors]
 *       summary: Get doctor by ID
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *       responses:
 *         200:
 *           description: Doctor details
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/User'
 *     put:
 *       tags: [Doctors]
 *       summary: Update doctor
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *       requestBody:
 *         content:
 *           multipart/form-data:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 specialty:
 *                   type: string
 *                 availableTimes:
 *                   type: string
 *                 profileImage:
 *                   type: string
 *                   format: binary
 *                 diplomaImage:
 *                   type: string
 *                   format: binary
 *       responses:
 *         200:
 *           description: Doctor updated successfully
 * 
 *   /api/appointments:
 *     get:
 *       tags: [Appointments]
 *       summary: Get all appointments
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: List of appointments
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Appointment'
 *     post:
 *       tags: [Appointments]
 *       summary: Create new appointment
 *       security:
 *         - bearerAuth: []
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - name
 *                 - phone
 *                 - department
 *                 - doctor
 *                 - appointmentDate
 *                 - reason
 *               properties:
 *                 name:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 department:
 *                   type: string
 *                 doctor:
 *                   type: string
 *                 appointmentDate:
 *                   type: string
 *                   format: date-time
 *                 reason:
 *                   type: string
 *       responses:
 *         201:
 *           description: Appointment created successfully
 * 
 *   /api/appointments/{id}:
 *     put:
 *       tags: [Appointments]
 *       summary: Update appointment
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *       requestBody:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 appointmentDate:
 *                   type: string
 *                   format: date-time
 *                 reason:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [Pending, Confirmed, Cancelled]
 *       responses:
 *         200:
 *           description: Appointment updated successfully
 *     delete:
 *       tags: [Appointments]
 *       summary: Delete appointment
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *       responses:
 *         200:
 *           description: Appointment deleted successfully
 * 
 *   /api/admin/verify-doctor/{id}:
 *     put:
 *       tags: [Admin]
 *       summary: Verify doctor
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: id
 *           required: true
 *           schema:
 *             type: string
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isValidated:
 *                   type: boolean
 *       responses:
 *         200:
 *           description: Doctor verification status updated
 * 
 *   /api/admin/stats:
 *     get:
 *       tags: [Admin]
 *       summary: Get system statistics
 *       security:
 *         - bearerAuth: []
 *       responses:
 *         200:
 *           description: System statistics
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   totalDoctors:
 *                     type: number
 *                   totalPatients:
 *                     type: number
 *                   totalAppointments:
 *                     type: number
 *                   totalDepartments:
 *                     type: number
 *                   appointmentsByStatus:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         count:
 *                           type: number
 */ 