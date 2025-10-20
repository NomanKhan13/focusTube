import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncWrapper } from "../utils/asyncHandler.js";
import { uploadCloudinary } from "../utils/cloundinary.js";

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
export const publishVideo = asyncWrapper(async (req, res) => {
  const { title, description, isPublished } = req.body;
  const videoFileLocal = req.files?.videoFile?.[0].path;
  const thumbnailLocal = req.files?.thumbnail?.[0].path;

  if (!title?.trim() || !videoFileLocal) {
    throw new ApiError(400, "Title and video file required");
  }

  const videoFile = await uploadCloudinary(videoFileLocal);

  if (!videoFile.secure_url) {
    throw new ApiError(400, "Failed to upload video");
  }

  const thumbnail = thumbnailLocal
    ? await uploadCloudinary(thumbnailLocal)
    : null;

  //   const seconds = Math.floor(uploadedVideo.duration);
  //   const minutes = Math.floor(seconds / 60);
  //   const remainingSeconds = seconds % 60;

  //   const formattedDuration = `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  //   console.log(formattedDuration); // e.g., "2:00"

  const video = await Video.create({
    title: title.trim(),
    description: description?.trim() || null,
    isPublished,
    thumbnail: thumbnail.secure_url || "",
    videoFile: videoFile.secure_url,
    owner: req.user._id,
    duration: videoFile.duration,
  });

  console.log(video);
  if (!video) {
    throw new ApiError(500, "Failed to upload the video");
  }

  res
    .status(200)
    .json(new ApiResponse(200, "Video uploaded successfully", video));
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

    if (!video.length) {
      throw new ApiError(404, "Video not found");
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
    throw new ApiError(500, "Database aggregation error");
  }
});
export const deleteVideo = (req, res) => {};
export const updateVideo = (req, res) => {};
export const updateVideoViews = (req, res) => {};
export const getAllVideosOfChannel = (req, res) => {};
