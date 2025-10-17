import mongoose from "mongoose";

const connectDB = async () => {
try{
  mongoose.connection.on('connected', () => console.log("Database Connected"));
  mongoose.connection.on('error', (err) => console.log("MongoDB Connection Error"));
await(mongoose.connect(`${process.env.MONGODB_URI}/mental-health`))
} catch (error) {
console.log(error.message);
}
}

export default connectDB;