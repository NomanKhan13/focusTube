import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import express from "express";
import connectDB from "./db/index.db.js";

console.log(DB_NAME);

const app = express();
const PORT = process.env.PORT;

connectDB().then(() => {
  app.listen(PORT || 8000, () => {
    console.log(`⚙️ Server is running at port : ${PORT}`);
  });
});
