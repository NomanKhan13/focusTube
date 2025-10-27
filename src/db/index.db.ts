import mongoose from "mongoose";
import { conf } from "../config/config.js";

async function connectDB() {
  try {
    const connectionInstance = await mongoose.connect(
      `${conf.mongoDBURI}/${conf.dbName}`,
    );
    console.log("CONNECTION WITH HOST:: ", connectionInstance.connection.host);
  } catch (error) {
    console.log("ERROR WHILE CONNECTING TO DATABSE", error);
    process.exit(1);
  }
}

export default connectDB;
