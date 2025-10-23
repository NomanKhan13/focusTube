import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getAllVideosOfChannel,
  getVideo,
  publishVideo,
  updateThumbnail,
  updateVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/verifyJWT.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

/**
 * 1. GET    /videos - get all videos
 * 2. POST   /vidoes - post a video
 * 3. GET    /videos/:id - get a single video
 * 4. DELETE /videos/:id - delete a single video
 * 5. PATCH  /videos/:id - update a video (title, desc, thumbnail etc)
 * 6. POST   /videos/:id/views - update view count
 * 7. GET    /videos/:id/videos - get all videos of a channel
 */

router
  .route("/")
  .get(getAllVideos)
  .post(
    verifyJWT,
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    publishVideo,
  );

router
  .route("/:id")
  .get(getVideo)
  .delete(verifyJWT, deleteVideo)
  .patch(verifyJWT, updateVideo);

// router
//   .route("/update-video/:id")
//   .patch(upload.single("videoFile"), updateVideo);
router
  .route("/update-thumbnail/:id")
  .patch(upload.single("thumbnail"), updateThumbnail);

router.route("/:id/videos").get(getAllVideosOfChannel);

export { router };
