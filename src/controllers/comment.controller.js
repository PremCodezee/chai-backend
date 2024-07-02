import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  const parsePage = parseInt(page);
  const parseLimit = parseInt(limit);

  if (isNaN(parsePage) || isNaN(parseLimit)) {
    throw new ApiError(400, "Page and limit must be numbers");
  }

  if (isNaN(parseLimit) || parseLimit < 1) {
    throw new ApiError(400, "Limit must be greater than 0");
  }

  const comments = await Comment.find({ videoId })
    .skip((parsePage - 1) * parseLimit)
    .limit(parseLimit)
    .sort({ createdAt: -1 })
    .exec();

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content, userId } = req.body;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Content is required");
  }

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid User ID format");
  }

  const comment = await Comment.create({
    content,
    videoId,
    owner: userId,
    createdAt: new Date(),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  if (!commentId) {
    throw new ApiError(400, "Comment ID is required");
  }

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Content is required");
  }

  const comment = await Comment.findByIdAndUpdate(
    commentId,
    { content },
    { new: true, runValidators: true }
  );

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment

  const { commentId } = req.params;

  if (!commentId) {
    throw new ApiError(400, "Comment ID is required");
  }

  const deleteComment = await Comment.findByIdAndDelete(commentId);

  if (!deleteComment) {
    throw new ApiError(404, "Comment not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
