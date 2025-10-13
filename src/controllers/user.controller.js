import { ApiError } from "../utils/ApiError.js";
import isEmail from "validator/lib/isEmail.js";
import isStrongPassword from "validator/lib/isStrongPassword.js";
import { User } from "../models/user.model.js";
import { uploadCloudinary } from "../utils/cloundinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const registerUser = async (req, res) => {
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
};

/**
 * New
 * 1. validator.js - isEmail(passEmail) etc
 * 2. User.findOne({$or: [{email}, {username}]}) - you can pass one condition like this User.findOne({email}) or multiple conditions like this User.findOne({$or: [{email}, {username}]}) multiple conditions using $or operator
 * 3. User.create({pass field in a key value form})
 * 4. User.findById(user._id).select("-password -refreshToken") - findById allows you to find a user by its _id field. select("-password -refreshToken") allows you to exclude fields from the result. In this case, we are excluding the password and refreshToken fields from the result.
 */
