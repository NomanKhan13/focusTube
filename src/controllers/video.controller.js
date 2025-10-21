import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncWrapper } from "../utils/asyncHandler.js";
import {
  deleteImageCloudinary,
  deleteVideoCloudinary,
  uploadCloudinary,
} from "../utils/cloundinary.js";
import sanitizeHtml from "sanitize-html";
import fs from "fs";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";

export const getAllVideos = async (req, res) => {
  // prettier-ignore
  const { page = 1, limit = 10, searchQuery, sortBy } = req.query;
  // page & limit - send first 10(limit) videos for page 1(page) and then 10-10 videos for subsequent pages.
  // searchQuery - if user hits search endpoint.
  // sortBy - upload date, view count, rating.

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };
  const videoAggregate = Video.aggregate([{ $match: { isPublished: true } }]);
  const { docs: videos } = await Video.aggregatePaginate(
    videoAggregate,
    options,
  );

  if (!videos.length) {
    throw new ApiError(404, "No videos found");
  }

  console.log(videos);

  res
    .status(200)
    .json(new ApiResponse(200, "Videos fetched successfully", videos));
};
/**
 * 1. Sanitize data to prevent XSS, just use a lightwight lib eg: sanitizeHtml
 * 2. Need to wrap mongoDB action in try because it will send raw errors which we don't want to show.
 * 3. When we don't reach till uploadCloudinary files don't get unsync properly, hence we need to do them here too.
 * 4. I started tracking uploaded cloudinary urls to cleanup in case of any error.
 * 5. Finally block always cleans up local files.
 *
 */
export const publishVideo = asyncWrapper(async (req, res) => {
  const { title, description, isPublished } = req.body;
  const videoFileLocal = req.files?.videoFile?.[0]?.path;
  const thumbnailLocal = req.files?.thumbnail?.[0]?.path;

  // Track uploaded Cloudinary URLs for cleanup
  let uploadedVideoUrl = null;
  let uploadedThumbnailUrl = null;

  try {
    // 1. Validate required fields
    if (!title?.trim() || !videoFileLocal) {
      throw new ApiError(400, "Title and video file required");
    }

    // 2. Validate file types
    const videoMimeType = req.files?.videoFile?.[0]?.mimetype;
    if (!videoMimeType?.startsWith("video/")) {
      throw new ApiError(400, "Invalid video file type");
    }

    // 3. Sanitize inputs
    const sanitizedTitle = sanitizeHtml(title.trim(), {
      allowedTags: [],
      allowedAttributes: {},
    });
    const sanitizedDescription = description
      ? sanitizeHtml(description.trim(), {
          allowedTags: ["b", "i", "em", "strong", "a"],
          allowedAttributes: { a: ["href"] },
        })
      : null;

    // 4. Upload to Cloudinary
    const videoFile = await uploadCloudinary(videoFileLocal);
    if (!videoFile?.secure_url) {
      throw new ApiError(500, "Failed to upload video to Cloudinary");
    }
    uploadedVideoUrl = videoFile.secure_url;

    const thumbnail = thumbnailLocal
      ? await uploadCloudinary(thumbnailLocal)
      : null;
    if (thumbnail?.secure_url) {
      uploadedThumbnailUrl = thumbnail.secure_url;
    }

    // 5. Save to database
    const video = await Video.create({
      title: sanitizedTitle,
      description: sanitizedDescription,
      isPublished: isPublished === "true",
      thumbnail: uploadedThumbnailUrl || "",
      videoFile: uploadedVideoUrl,
      owner: req.user._id,
      duration: videoFile.duration,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, "Video uploaded successfully", video));
  } catch (error) {
    // Cleanup Cloudinary uploads on any error
    if (uploadedVideoUrl) {
      await deleteVideoCloudinary(uploadedVideoUrl).catch((err) =>
        console.error("Cloudinary video cleanup failed:", err),
      );
    }
    if (uploadedThumbnailUrl) {
      await deleteImageCloudinary(uploadedThumbnailUrl).catch((err) =>
        console.error("Cloudinary thumbnail cleanup failed:", err),
      );
    }

    if (error instanceof ApiError) throw error;
    if (error.name === "ValidationError") {
      throw new ApiError(400, error.message);
    }
    console.error("publishVideo error:", error);
    throw new ApiError(500, "Internal server error while uploading video");
  } finally {
    // Always cleanup local files
    if (videoFileLocal && fs.existsSync(videoFileLocal)) {
      fs.unlinkSync(videoFileLocal);
    }
    if (thumbnailLocal && fs.existsSync(thumbnailLocal)) {
      fs.unlinkSync(thumbnailLocal);
    }
  }
});
export const getVideo = asyncWrapper(async (req, res) => {
  /**
   * get videoId from params
   * search for video
   * return to client
   * Mistake 1 - not handling malformed videoId
   * Mistake 2 - not handling non-published videos
   * Mistake 3 - When videoId(id) is undefined mongoose treats it as valid value so we need to add handle undefined seperately
   * Mistake 4 - { $match: { _id: videoId } } Aggretation piplines don't convert mongo Ids under the hood.
   * Mistake 5 - you should have added $addField then set owner as first object, { $addFields: { owner: { $arrayElemAt: ["$owner", 0] }, // take first matched owner},
   * Mistake 6 - (used $addFeild in lookup)In the users collection, there is no field called owner — that field only exists in the videos collection.
   * Mistake 7 - When using $project, you need to set 1 to prop.
   * Tip: I am adding isSubscribed to owner itself and not video because this feild is not specific to video, its specific with owner
   */

  const { id: videoId } = req.params;
  console.log("req.params", req.params);
  console.log("req.query", req.query);
  console.log("req.params");

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
  }

  try {
    const video = await Video.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
              },
            },
            {
              $addFields: {
                isSubscribed: {
                  $cond: {
                    if: { $ifNull: [req.user?.id, false] },
                    then: { $in: [req?.user?.id, "$subscribers.subscriber"] },
                    else: false,
                  },
                },
                subscribers: { $size: "$subscribers" },
              },
            },
            {
              $project: {
                fullName: 1,
                subscribers: 1,
                isSubscribed: 1,
                _id: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          owner: {
            $first: "$owner",
          },
        },
      },
    ]);
    console.log(video);

    if (!video.length) {
      throw new ApiError(404, "Video not found");
    }

    if (!video[0].owner) {
      throw new ApiError(404, "Owner not found");
    }

    if (
      !video[0].isPublished &&
      video[0].owner._id.toString() !== req?.user?.id.toString()
    ) {
      throw new ApiError(403, "You are now allowed to view this video");
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Video fetched successfully", video[0]));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === "ValidationError")
      throw new ApiError(400, error.message);
    throw new ApiError(500, "Database aggregation error");
  }
});
export const deleteVideo = asyncWrapper(async (req, res) => {
  // Mistake 1 - I was using findByIdAndDelete which doesn't give chance to verify owner before deleting video.
  // Mistake 2 - I am not deleting video from cloudinary.
  // Mistake 3 - Since comments and likes are related to a video, I need to delete likes and comments too. Also use session so you make sure you delete all related data.
  const { id: videoId } = req.params;
  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
  }

  try {
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }
    if (video.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not allowed to delete this video");
    }
    await deleteVideoCloudinary(video.videoFile);
    if (video.thumbnail) {
      await deleteImageCloudinary(video.thumbnail);
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await video.deleteOne({ _id: videoId }).session(session);
      await Comment.deleteOne({ video: videoId }).session(session);
      await Like.deleteOne({ video: videoId }).session(session);

      session.commitTransaction();
    } catch (error) {
      session.abortTransaction();
    } finally {
      session.endSession();
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Video deleted successfully", null));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === "ValidationError")
      throw new ApiError(400, error.message);
    throw new ApiError(500, "Database error while deleting video");
  }
});
export const updateVideo = asyncWrapper(async (req, res) => {
  // Mistake : video.owner._id is a Mongoose ObjectId, while req.user.id is usually a string. Strict inequality (!==) will always fail.
  // Mistake:  Seems minor but can be problematic, always trim title and description
  const { title, description, isPublished } = req.body;
  const { id: videoId } = req.params;

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  try {
    const video = await Video.findById(videoId).select(
      "-videoFile -thumbnail -duration -views",
    );

    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    if (video?.owner?._id.toString() !== req?.user?.id.toString()) {
      throw new ApiError(403, "You are not authorized to update this video");
    }

    video.title = title?.trim()
      ? sanitizeHtml(title?.trim(), {
          allowedTags: [],
          allowedAttributes: {},
        })
      : video.title;

    video.description = description?.trim()
      ? sanitizeHtml(description.trim(), {
          allowedTags: ["b", "i", "a", "strong", "i"],
          allowedAttributes: { a: ["href"] },
        })
      : video.description;

    video.isPublished = isPublished ?? video.isPublished;

    await video.save();

    res
      .status(200)
      .json(new ApiResponse(200, "Video updated successfully", video));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === "ValidationError")
      throw new ApiError(400, error.message);
    console.error("Update video error:", error);
    throw new ApiError(500, "Internal server Error");
  }
});

export const updateThumbnail = asyncWrapper(async (req, res) => {
  // Mistake - What are you doing? Anyone can update the video you need to check the owner, where is logic bulding?
  // Mistake - Verify that its the owner then upload on cloudinary else attacker may congest/waste your cloudinary bandwidth
  const thumbnailLocal = req?.file?.path;
  const { id: videoId } = req.params;

  if (!thumbnailLocal) {
    throw new ApiError(400, "Thumbnail file not provided");
  }
  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  try {
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");
    if (video?.owner?._id.toString() !== req.user?.id.toString()) {
      throw new ApiError(403, "You are not authorized to update thumbnail");
    }
    const newThumbnail = await uploadCloudinary(thumbnailLocal);
    if (!newThumbnail.secure_url)
      throw new ApiError(400, "Error while uploading thumbnail on cloudinary");
    const oldThumbnailCloudinary = video.thumbnail;

    video.thumbnail = newThumbnail.secure_url;
    await video.save();
    await deleteImageCloudinary(oldThumbnailCloudinary);

    res
      .status(200)
      .json(new ApiResponse(200, "Thumbnail updated successfully", video));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === "ValidationError")
      throw new ApiError(400, error.message);
    throw new ApiError(500, "Internal server error");
  }
});

export const getAllVideosOfChannel = asyncWrapper(async (req, res) => {});
