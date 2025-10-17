import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema(
  {
    name: { type: String, required: String },
    description: { type: String },
    // should be wrapped b/w [], so it's array.
    videos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export const Playlist = mongoose.model("Playlist", playlistSchema);
