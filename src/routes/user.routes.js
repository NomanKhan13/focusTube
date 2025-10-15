import { Router } from "express";
import {
  changeCurrentAvatar,
  changeCurrentCover,
  changeCurrentEmail,
  changeCurrentPassword,
  generateNewAccessToken,
  getUserDetails,
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/verifyJWT.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser,
);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-access-token").get(generateNewAccessToken);

// keep it here, later make auth.controller.js and user.controller.js
router.route("/me").get(verifyJWT, getUserDetails);
router.route("/change-password").put(verifyJWT, changeCurrentPassword);
router.route("/change-email").put(verifyJWT, changeCurrentEmail);
router
  .route("/change-avatar")
  .patch(verifyJWT, upload.single("avatar"), changeCurrentAvatar);
router
  .route("/change-cover")
  .patch(verifyJWT, upload.single("coverImage"), changeCurrentCover);

export { router };
