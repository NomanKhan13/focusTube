import express from "express";
import type { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app: Express = express();

const corsConfig = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
};

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

app.use(cors(corsConfig));
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
import { router as videoRouter } from "./routes/video.routes.js";
import { healthChecker } from "./controllers/health.controller.js";
import globalErrorHandler from "./middlewares/errorHandler.js";

app.get("/api/v1/heath-check", healthChecker);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);

// MISTAKE - Global Error handler should be at last
app.use(globalErrorHandler);

export { app };

/*

// ------------------- AUTH ROUTES -------------------
app.post("/api/v1/auth/register", (req, res) => res.send("Register"));
app.post("/api/v1/auth/login", (req, res) => res.send("Login"));
app.post("/api/v1/auth/logout", (req, res) => res.send("Logout"));
app.post("/api/v1/auth/refresh-token", (req, res) => res.send("Refresh Token"));
app.post("/api/v1/auth/change-password", (req, res) => res.send("Change Password"));
app.post("/api/v1/auth/forgot-password", (req, res) => res.send("Forgot Password"));
app.post("/api/v1/auth/reset-password", (req, res) => res.send("Reset Password"));

// ------------------- USER ROUTES -------------------
app.get("/api/v1/users/me", (req, res) => res.send("Get my profile"));
app.patch("/api/v1/users/me", (req, res) => res.send("Update my profile"));
app.patch("/api/v1/users/me/avatar", (req, res) => res.send("Update avatar"));
app.get("/api/v1/users/:userId", (req, res) => res.send("Get user profile"));
app.get("/api/v1/users/:userId/videos", (req, res) => res.send("User's videos"));
app.get("/api/v1/users/:userId/playlists", (req, res) => res.send("User's playlists"));
app.get("/api/v1/users/search", (req, res) => res.send("Search users"));

// ------------------- VIDEO ROUTES -------------------
app.post("/api/v1/videos/upload", (req, res) => res.send("Upload video"));
app.get("/api/v1/videos", (req, res) => res.send("Get all videos"));
app.get("/api/v1/videos/:videoId", (req, res) => res.send("Get video details"));
app.patch("/api/v1/videos/:videoId", (req, res) => res.send("Update video"));
app.delete("/api/v1/videos/:videoId", (req, res) => res.send("Delete video"));
app.patch("/api/v1/videos/:videoId/publish", (req, res) => res.send("Publish/Unpublish video"));
app.patch("/api/v1/videos/:videoId/thumbnail", (req, res) => res.send("Update thumbnail"));
app.get("/api/v1/videos/search", (req, res) => res.send("Search videos"));
app.patch("/api/v1/videos/:videoId/views", (req, res) => res.send("Increment views"));
app.get("/api/v1/videos/trending", (req, res) => res.send("Trending videos"));
app.get("/api/v1/videos/subscriptions", (req, res) => res.send("Subscribed channels videos"));

// ------------------- COMMENT ROUTES -------------------
app.get("/api/v1/comments/:videoId", (req, res) => res.send("Get comments"));
app.post("/api/v1/comments/:videoId", (req, res) => res.send("Add comment"));
app.patch("/api/v1/comments/:commentId", (req, res) => res.send("Edit comment"));
app.delete("/api/v1/comments/:commentId", (req, res) => res.send("Delete comment"));
app.post("/api/v1/comments/:commentId/like", (req, res) => res.send("Like comment"));
app.post("/api/v1/comments/:commentId/dislike", (req, res) => res.send("Dislike comment"));

// ------------------- LIKE / DISLIKE ROUTES -------------------
app.post("/api/v1/likes/video/:videoId", (req, res) => res.send("Like video"));
app.delete("/api/v1/likes/video/:videoId", (req, res) => res.send("Remove like"));
app.post("/api/v1/likes/comment/:commentId", (req, res) => res.send("Like comment"));
app.delete("/api/v1/likes/comment/:commentId", (req, res) => res.send("Remove comment like"));

// ------------------- SUBSCRIPTION ROUTES -------------------
app.post("/api/v1/subscriptions/:channelId", (req, res) => res.send("Subscribe"));
app.delete("/api/v1/subscriptions/:channelId", (req, res) => res.send("Unsubscribe"));
app.get("/api/v1/subscriptions/me", (req, res) => res.send("My subscriptions"));
app.get("/api/v1/subscriptions/:channelId/subscribers", (req, res) => res.send("Channel subscribers"));

// ------------------- PLAYLIST ROUTES -------------------
app.post("/api/v1/playlists", (req, res) => res.send("Create playlist"));
app.get("/api/v1/playlists", (req, res) => res.send("Get all my playlists"));
app.get("/api/v1/playlists/:playlistId", (req, res) => res.send("Get playlist details"));
app.patch("/api/v1/playlists/:playlistId", (req, res) => res.send("Update playlist"));
app.delete("/api/v1/playlists/:playlistId", (req, res) => res.send("Delete playlist"));
app.post("/api/v1/playlists/:playlistId/videos/:videoId", (req, res) => res.send("Add video to playlist"));
app.delete("/api/v1/playlists/:playlistId/videos/:videoId", (req, res) => res.send("Remove video from playlist"));

// ------------------- HISTORY & WATCH LATER -------------------
app.get("/api/v1/history", (req, res) => res.send("Get watch history"));
app.post("/api/v1/history/add/:videoId", (req, res) => res.send("Add to history"));
app.delete("/api/v1/history/clear", (req, res) => res.send("Clear history"));

app.get("/api/v1/watchlater", (req, res) => res.send("Watch later list"));
app.post("/api/v1/watchlater/add/:videoId", (req, res) => res.send("Add to watch later"));
app.delete("/api/v1/watchlater/remove/:videoId", (req, res) => res.send("Remove from watch later"));

// ------------------- SEARCH -------------------
app.get("/api/v1/search", (req, res) => res.send("Search videos/users/playlists"));
app.get("/api/v1/search/suggest", (req, res) => res.send("Search suggestions"));

// ------------------- HEALTH CHECK -------------------
app.get("/api/v1/health", (req, res) => res.send("Server is healthy"));

*/
