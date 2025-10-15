import isEmail from "validator/lib/isEmail.js";
import isStrongPassword from "validator/lib/isStrongPassword.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadCloudinary } from "../utils/cloundinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncWrapper } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

// Forgot to add asyncWrapper here, adding it now to handle errors properly.
// What this wrapper fn does is takes a fn as input and runs it inside a try catch block and if any error occurs it passes the error to next() fn which is the express error handling middleware.
export const registerUser = asyncWrapper(async (req, res) => {
  // Logic to register a user
  /**
   * 1. get data from req.body - DONE
   * 2. validate the data - DONE
   * 3. check if user exist in DB - DONE
   * 3. check if req.file.avatar exist - DONE
   * 4. upload avatar to cloudinary - DONE
   * 6. save user in DB - DONE
   * 7. check if saved in DB and send response to client - DONE
   *
   */

  const { username, fullName, email, password } = req.body;

  if ([username, fullName, email, password].some((field) => !field?.trim())) {
    throw new ApiError(
      res.status(400).json({ message: "All fields are required" }),
    );
  }

  if (isEmail(email) === false) {
    throw new ApiError(400, "Email is not valid");
  }

  if (isStrongPassword(password) === false) {
    throw new ApiError(
      400,
      "Password is not strong. It must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one symbol.",
    );
  }

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadCloudinary(avatarLocalPath);
  const coverImage = await uploadCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(500, "Failed to upload avatar");
  }

  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatar.secure_url,
    coverImage: coverImage?.secure_url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new ApiError(500, "Failed to create user");
  }

  res
    .status(201)
    .json(new ApiResponse(201, "User registered successfully", createdUser));

  /**
   * New
   * 1. validator.js - isEmail(passEmail) etc
   * 2. User.findOne({$or: [{email}, {username}]}) - you can pass one condition like this User.findOne({email}) or multiple conditions like this User.findOne({$or: [{email}, {username}]}) multiple conditions using $or operator
   * 3. User.create({pass field in a key value form})
   * 4. User.findById(user._id).select("-password -refreshToken") - findById allows you to find a user by its _id field. select("-password -refreshToken") allows you to exclude fields from the result. In this case, we are excluding the password and refreshToken fields from the result.
   */
});

export const loginUser = asyncWrapper(async (req, res) => {
  // Logic to login a user
  /**
   * 1. get data from req.body
   * 2. validate the data - .trim() and isEmail()
   * 3. check if user exist in DB - User.findOne({$or: [{email}, {username}]})
   * 4. check if password is correct - User.isPasswordCorrect(password) - we added this method in user.model.js
   * 5. generate access token and refresh token - User.generateAccessToken() - we added this method in user.model.js
   * 6. save refresh token in DB
   * 7. send response to client via cookie and json data
   */
  console.log("REQ BODY: ", req.body);
  const { username, password } = req.body;

  if (!username?.trim() || !password?.trim()) {
    throw new ApiError(400, "Invalid credentials");
  }
  const email = isEmail(username) ? username : null; // if username is an email, assign it to email variable else assign null

  const user = await User.findOne(
    email ? { email } : { username: username.toLowerCase() },
  );
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const isPasswordValid = await user.isPasswordCorrect(password); // you used user and not User because these methods were added by you and not mongoose.
  if (!isPasswordValid) {
    throw new ApiError(401, "Password is incorrect");
  }

  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only send cookie over https
    sameSite: "None", // CSRF protection - if your front end and backend are on same domains, you might need to set this to 'Strict' and use secure: true
    maxAge: 24 * 60 * 60 * 1000, // 1 days
  };

  res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(200, "User logged in successfully", {
        user,
        accessToken,
        refreshToken,
      }),
    );

  /**
   * NEW
   * 1. res.cookie("cookieName", "cookieValue", options) - to send a cookie to the client. options is an object where you can set various options for the cookie like httpOnly, secure, sameSite, maxAge etc.
   */
});

export const logoutUser = asyncWrapper(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user.id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    },
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only send cookie over https
    sameSite: "None", // CSRF protection - if your front end and backend are on same domains, you might need to set this to 'Strict' and use secure: true
    maxAge: 24 * 60 * 60 * 1000, // 1 days
  };

  res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, "User logged out successfully"));

  // Logic to logout a user
  /**
   * 1. get refresh token from cookie
   * 2. validate the token
   * 3. check if user exist in DB
   * 4. delete refresh token from DB
   * 5. clear cookie from client
   * 6. send response to client
   */
  /**
   * DRAWBACKS OF THIS METHOD:
  1. Depends on cookies being sent by the client. If the client does not send cookies, this method will not work.
  2. Not verifying the refresh token. If the refresh token is invalid or expired, this method will still log out the user.
  3. Tight coupling with cookie management. If the way cookies are managed changes, this method will need to be updated.
  4. Not handling Bearer token authentication. If the application uses Bearer tokens for authentication, this method will not work.
  5. User.findOne({ refreshToken }); - Not a performant solution(if not indexed by refreshToken) as opposed to findById
  6. It relies on the client to send the refresh token in the cookie, which can be tampered with or stolen.
  7. If the refresh token is compromised, an attacker could potentially log out the user.
  8. If the user has multiple sessions (e.g., logged in on multiple devices), logging out from one session will not log out from other sessions.
  9. If the refresh token is not properly invalidated on the server side, it could still be used to obtain new access tokens.

  const { refreshToken } = req.cookies; // cookie-parser middleware is used to parse cookies from the request headers and populate req.cookies with an object of key-value pairs representing the cookies.
  if (!refreshToken) {
    throw new ApiError(400, "Refresh token is required");
  }

  const user = await User.findOne({ refreshToken });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  user.refreshToken = null;
  await user.save({ validateBeforeSave: false });
  
  res
    .status(200)
    .clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    })
    .clearCookie("accessToken", {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    })
    .json(new ApiResponse(200, "User logged out successfully"));


   * Thought process:
   * We want to logout user which means that we don't want to let them access protected routes.
   * We generally add an auth middleware before user tries to access protected routes and this is done via jwt.
   * We want to clear access token and refresh token form client and server.
   * User tries to logout we checked if they have a refresh token?
   * They have then we check a user with their provides refresh token exist in DB?
   * We access the user and set their refresh token to null in DB.
   * We clear the cookies from client using res.clearCookie(nameOfCookie, options) method.
   */
});

export const generateNewAccessToken = asyncWrapper(async (req, res) => {
  /**
   * When user will get 401 they will hit this endpoint.
   * Get incoming refreshToken
   * decodeToken
   * findById
   * incoming refreshToken is equal to refreshToken in DB
   * generate new accessToken and refreshToken
   */

  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  const decodeRefreshToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_PRIVATE_KEY,
  );

  if (!decodeRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  const user = User.findById(decodeRefreshToken.id).select(
    "-password -refreshToken",
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (incomingRefreshToken !== decodeRefreshToken) {
    throw new ApiError(401, "Refresh token expired");
  }

  const newAccessToken = await user.generateAccessToken();
  const newRefreshToken = await user.generateRefreshToken();

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only send cookie over https
    sameSite: "None", // CSRF protection - if your front end and backend are on same domains, you might need to set this to 'Strict' and use secure: true
    maxAge: 24 * 60 * 60 * 1000, // 1 days
  };

  res
    .status(200)
    .cookie("refreshToken", newRefreshToken, options)
    .cookie("accessToken", newAccessToken, options)
    .json(
      new ApiResponse(200, "Access token refreshed", {
        user,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      }),
    );
});

/**
 * API Security tips:
 * 1. Validate incoming req params - zod, joi, etc
 * 2. Rate limiting - prevent DDOS, react infinite loop etc - express-rate-limit
 * 3. Protected routes - auth middleware using JWT
 * 4. Error handling middleware - (WATCH LATER - Coder's gyan video) Global error handling middleware to catch all errors, don't expose prod errors to client, external logging service - Sentry, LogRocket etc.
 * 5. HTTPS - secure communication between client and server, using SSL/TLS certificates (let's encrypt - free, caddy server - free, buy - godaddy, namecheap etc.)
 */
