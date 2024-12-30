import mongoose from "mongoose";
import DB_NAME from "../constants.js";

export default async function connectDB() {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`,
    );
    console.log(
      `MONGODB connected !! DB HOST: ${connectionInstance.connection.host}`,
    );
  } catch (err) {
    console.error("MONGODB connection failed:", err);
    process.exit(1);
  }
}
