import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncWrapper } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncWrapper(async (req, res, next) => {
  const token =
    req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
  console.log("Access Token", req.cookies);
  if (!token) {
    throw new ApiError(401, "Unauthorized: No token provided");
  }

  const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_PRIVATE_KEY);
  console.log("Decoded Token:", decodedToken);
  // MAJOR FIX: You should have added .select else you will get password and refreshToken in req.user
  const user = await User.findById(decodedToken.id).select(
    "-password -refreshToken",
  ); // This method doesn't take object like findOne({id: decodedToken.id})
  if (!user) {
    throw new ApiError(401, "Unauthorized: User not found");
  }
  req.user = user; // Attach user to request object
  next();
});
