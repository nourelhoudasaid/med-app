
const watchCollectionChanges = (model, io, eventName) => {
  // Watch changes on the specified collection (model)
  const changeStream = model.watch();

  // Listen to the changes
  changeStream.on('change', (change) => {
    console.log(`Change detected in ${model.collection.collectionName}:`, change);

    // Broadcast the change event to connected WebSocket clients with the dynamic event name
    io.emit(eventName, change);
  });

  // Handle errors on the change stream
  changeStream.on('error', (error) => {
    console.error(`Error in change stream for ${model.collection.collectionName}:`, error);
  });
};

module.exports = watchCollectionChanges;




//***********this code is for 'watchChanges' function only for Patient model ***************
//const Patient = require('./models/patient');

//const watchPatientChanges = (io) => {
  // Watch changes on the Patient collection
  //const changeStream = Patient.watch();

  // Listen to the changes
  //changeStream.on('change', (change) => {
    //console.log('Change detected:', change);

    // Broadcast the change event to connected WebSocket clients
    //io.emit('patientChange', change);
  //});


  // Handle errors on the change stream
  //changeStream.on('error', (error) => {
    //console.error('Error in change stream:', error);
  //});
//};

//module.exports = watchPatientChanges;

//***********------------------------------------------------------------*****************

//*changeStream.js
//const Patient = require('./models/patient');
//const io = require('./server'); // Import Socket.io instance

//const mongoose = require('mongoose');

//const watchPatientChanges = () => {
 // const changeStream = Patient.watch();

  //changeStream.on('change', (change) => {
    //console.log('Change detected:', change);
    //io.emit('patientChange', change); // Broadcast change to WebSocket clients
  //});
//};

//module.exports = watchPatientChanges;


