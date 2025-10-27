import { app } from "./app.js";
import { conf } from "./config/config.js";
import connectDB from "./config/db.js";

const PORT = conf.port;
function startServer() {
  app.listen(PORT, (): void => {
    console.log(`⚙️ Server is running at port : ${PORT}`);
  });
}

connectDB()
  .then(startServer)
  .catch((err: unknown) => console.log("ERROR WHILE CONNECTION TO DB", err));
