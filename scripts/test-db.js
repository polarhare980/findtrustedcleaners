// Use require instead of import
const mongoose = require('mongoose');

// Replace this with your actual MongoDB connection URI
const MONGODB_URI = 'mongodb+srv://matjoneshare:4upMbZarPYjDtpiT@cleanmatch.icjdrij.mongodb.net/?retryWrites=true&w=majority&appName=Cleanmatch';

async function testDBConnection() {
  try {
    // Attempt to connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully!');
    
    // Close the connection after the test
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

testDBConnection();
