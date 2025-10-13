import { app } from "./app.js";
import connectDB from "./db/index.db.js";

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`⚙️ Server is running at port : ${PORT}`);
    });
  })
  .catch((err) => console.log("ERROR WHILE CONNECTION TO DB"));
