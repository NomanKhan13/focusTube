import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

const corsConfig = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
};

app.use(cors(corsConfig));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use((req, res, next) => {
  for (const key in req.body) {
    if (typeof req.body[key] === "string" && req.body[key] !== "password") {
      req.body[key] = req.body[key].trim();
    }
  }
  next();
});

import { router as userRouter } from "./routes/user.routes.js";

app.use("/api/v1/users", userRouter);

export { app };

// prettier-ignore

/*** Below this is just to understand concepts */

/**
 * 
 
✈️ Understanding Express Router with an Airport Analogy

Get confidence with Express Router, throw away confusion with this airport analogy.

Step 1 of 2) Imagine we’re building a backend for Ahmedabad Airport (Abad Airport).
There are two main sections:

    🏠 Domestic flights
    🌍 International flights

// app.js
import express from "express";
import domesticRouter from "./routes/domestic.router.js";
import internationalRouter from "./routes/international.router.js";

const app = express();

app.use("/abad-airport/domestic", domesticRouter);
app.use("/abad-airport/international", internationalRouter);

Step 2 of 2) Now, inside domestic.router.js:

import { Router } from "express";
import { getIndigoFlights, getIndigoFlightById } from "../controllers/indigo.controller.js";
import { getVistaraFlights } from "../controller/vistara.controller.js"

const router = Router();

// This way, when someone requests: GET "/abad-airport/domestic/indigo/flights" only the domestic router handles it.
// Similarly if req is GET "/abad-airport/domestic/indigo/flights/:id"
router.route("/indigo/flights").get(getIndigoFlights);
router.route("/indigo/flights/:id").get(getIndigoFlightById);

// Just like above for GET "/abad-airport/domestic/vistara/flights"
router.route("/vistara/flights").get(getVistaraFlights);

export default router;


Question - How do you organize your Express routes? A single file or separate routers?

* 
 */
