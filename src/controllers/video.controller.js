import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { application } from "express";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const { username, email } = req.params;

  if (!username || !email) {
    throw new ApiError(400, "username or email is not defined");
  }

  const videos = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "videos", // Assumes your videos collection is named 'videos'
        localField: "_id",
        foreignField: "userId",
        as: "videos",
      },
    },
    {
      $unwind: "$videos",
    },
    {
      $match: {
        ...(query && { "videos.title": { $regex: query, $options: "i" } }), // Assuming search is by video title
        ...(userId && { "videos.userId": userId }),
      },
    },
    {
      $sort: { [`videos.${sortBy}`]: sortType === "asc" ? 1 : -1 },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: parseInt(limit),
    },
  ]);

  if (!videos || videos.length === 0) {
    throw new ApiError(404, "Videos not found");
  }

  return res
    .status(200)
    .json(new application(200, channel[0], "Video Uploaded successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, username, thumbnail } = req.body;

  if (
    [username, title, description, thumbnail].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  let videoLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.video) &&
    req.files.video.length > 0
  ) {
    videoLocalPath = req.files.video[0].path;
  }
  if (!videoLocalPath) {
    throw new ApiError(404, "Video file is required");
  }

  // Upload video to Cloudinary (or any cloud storage)
  const videoOnCloud = await uploadOnCloudinary(videoLocalPath);

  if (!videoOnCloud) {
    throw new ApiError(400, "Failed to upload video to the cloud");
  }

  // Create video record in the database
  const videoOnServer = await Video.create({
    title,
    description,
    video: videoOnCloud.url,
    thumbnail, // Assuming thumbnail is already a URL or handle this similarly to videoOnCloud
    username,
  });

  // Find the user who uploaded the video (assuming `videoOnServer` has `userId` field)
  const createVideo = await User.findById(videoOnServer.userId).select(
    "-password -refreshToken"
  );

  if (!createVideo) {
    throw new ApiError(500, "something went wrong while uploading video");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createVideo, "video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video found successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail
  const { videoId } = req.params;

  const { title, description, thumbnail } = req.body;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  // Validate input fields
  if (
    [title, description, thumbnail].some(
      (field) => field && field.trim() === ""
    )
  ) {
    throw new ApiError(400, "Invalid input: Fields cannot be empty");
  }

  // Find and update the video
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      ...(title && { title }),
      ...(description && { description }),
      ...(thumbnail && { thumbnail }),
    },
    { new: true, runValidators: true }
  );

    // Handle the case where the video is not found
    if (!updatedVideo) {
      throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(new ApiResponse(200, updatedVideo, "Video updated successfully"));

});

const deleteVideo = asyncHandler(async (req, res) => {
  //TODO: delete video
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID format");
  }

  const deletedVideo = await Video.findByIdAndDelete(videoId);

  if (!deletedVideo) {
    throw new ApiError(404, "Video not found");
  }

  return res.status(200).json(new ApiResponse(200, null, "Video deleted successfully"));

});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID format");
  }


  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  video.isPublished = !video.isPublished;

  await video.save();

  return res.status(200).json(new ApiResponse(200, video, "Video status updated successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
