import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videoFile: { type: String, required: true },
    thumbnail: { type: String },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, index: true },
    description: { type: String, index: true },
    duration: { type: Number, required: true, index: true },
    views: {
      type: Number,
      required: true,
      default: 0,
      index: true,
      immutable: true, // Prevents user or even code from setting it directly
    },
    isPublished: { type: Boolean, default: true, required: true, index: true },
  },
  { timestamps: true },
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
