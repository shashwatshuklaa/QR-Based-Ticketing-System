const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // This tells Mongoose to connect to the database URL stored in our secret .env file
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // If the database connection fails, we stop the server
    process.exit(1);
  }
};

module.exports = connectDB;
