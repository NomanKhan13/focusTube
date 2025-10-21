import { v2 as cloudinary } from "cloudinary";
import { extractPublicId } from "cloudinary-build-url";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const uploadCloudinary = async function (localFilePath) {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const uploadVideoCloudinary = async function (localFilePath) {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "video",
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteImageCloudinary = async (cloudinaryURL) => {
  if (!cloudinaryURL) return null;
  const publicId = extractPublicId(cloudinaryURL);
  await cloudinary.uploader.destroy(publicId);
};

const deleteVideoCloudinary = async (cloudinaryURL) => {
  if (!cloudinaryURL) return null;
  const publicId = extractPublicId(cloudinaryURL);
  await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
};

export {
  uploadCloudinary,
  deleteImageCloudinary,
  uploadVideoCloudinary,
  deleteVideoCloudinary,
};

// )(async function () {
//   // Configuration

//   // Upload an image

//   console.log(uploadResult);

//   // Optimize delivery by resizing and applying auto-format and auto-quality
//   const optimizeUrl = cloudinary.url("shoes", {
//     fetch_format: "auto",
//     quality: "auto",
//   });

//   console.log(optimizeUrl);

//   // Transform the image: auto-crop to square aspect_ratio
//   const autoCropUrl = cloudinary.url("shoes", {
//     crop: "auto",
//     gravity: "auto",
//     width: 500,
//     height: 500,
//   });

//   console.log(autoCropUrl);
// })()
