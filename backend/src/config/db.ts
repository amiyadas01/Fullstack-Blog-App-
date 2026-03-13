import mongoose from "mongoose";

const mongoURI =
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/newswaveDB"; // default to local MongoDB if not set

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB with ", mongoURI);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

export default connectDB;
