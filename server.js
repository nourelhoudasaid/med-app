const mongoose = require('mongoose');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const indexRoutes = require('./routes/index'); 
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();
const app = express();
const server = http.createServer(app);
// Initialize app


// Middleware
app.use(express.json());
app.use(cors());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static('uploads'));

// Initialize Socket.io after the server has been created
const io = socketio(server, {
  cors: {
    origin: "*", // Allow all origins (in production, restrict this to your front-end URL)
    methods: ["GET", "POST"]
  }
});
// Use the auth routes
app.use('/api/auth', authRoutes);


// Use routes from index.js
const routes = require('./routes/index')(io);
app.use('/', routes);  // Apply all routes from index.js

// Simple test route
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Initialize the HTTP server *before* using it with Socket.io




// Socket.io connection event
io.on('connection', (socket) => {
  console.log('New WebSocket connection:', socket.id);

  socket.on('message', (data) => {
    console.log('Message from client:', data);
    io.emit('message', { text: `Server: ${data}` });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server using `server.listen` instead of `app.listen`
const PORT = process.env.PORT || 3010;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Watch function to track changes in the patients collection
//const watchPatientChanges = async () => {
  //const patientCollection = mongoose.connection.collection('patients');

  // Create a change stream to watch for changes in the patients collection
  //const changeStream = patientCollection.watch();

  // When there is a change in the collection
  //changeStream.on('change', (change) => {
    //console.log('Change detected:', change);

    // Handle the type of operation (insert, update, delete)
    //if (change.operationType === 'insert') {
      //const patient = change.fullDocument;
      //console.log('New patient added:', patient);

      // Broadcast the new patient data to all connected clients
      //io.emit('newPatient', patient);
    //} else if (change.operationType === 'update') {
      //const updatedFields = change.updateDescription.updatedFields;
      //console.log('Patient updated:', updatedFields);

      // Broadcast the updated patient data to all clients
      //io.emit('updatePatient', updatedFields);
    //} else if (change.operationType === 'delete') {
      //const deletedPatientId = change.documentKey._id;
      //console.log('Patient deleted:', deletedPatientId);

      // Broadcast the ID of the deleted patient
      //io.emit('deletePatient', deletedPatientId);
    //}
  //});

  // Handle errors on the change stream
  //changeStream.on('error', (error) => {
    //console.error('Error in change stream:', error);
  //});
//};

// Initialize the change stream and link it with Socket.io
// watchPatientChanges();
