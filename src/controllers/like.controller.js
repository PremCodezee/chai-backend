import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"



const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video

    if (!videoId) {
        throw new ApiError(400, "video ID Not found")
    }

    const userId = req.user.id

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    let video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const isLiked = video.likes.includes(userId)

    if (isLiked) {
        video.likes = video.likes.filter((id) => id !== userId)
    } else {
        video.likes.push(userId)
    }

    video = await video.save()

    return res.status(200).json(new ApiResponse(200, video, "Video liked/unliked successfully"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment

    if (!commentId) {
        throw new ApiError(400, "comment ID Not found")
    }

    const userId = req.user.id

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    let comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    const isLiked = comment.likes.includes(userId)

    if (isLiked) {
        comment.likes = comment.likes.filter((id) => id !== userId)
    } else {
        comment.likes.push(userId)
    }

    comment = await comment.save()

    return res.status(200).json(new ApiResponse(200, comment, "Comment liked/unliked successfully"))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet

    if (!tweetId) {
        throw new ApiError(400, "tweet ID Not found")
    }

    const userId = req.user.id

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    let tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    const isLiked = tweet.likes.includes(userId)

    if (isLiked) {
        tweet.likes = tweet.likes.filter((id) => id !== userId)
    } else {
        tweet.likes.push(userId)
    }

    tweet = await tweet.save()

    return res.status(200).json(new ApiResponse(200, tweet, "Tweet liked/unliked successfully"))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const userId = req.user.id

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    const likedVideos = await Video.find({ likes: userId })

    if (!likedVideos || likedVideos.length === 0) {
        throw new ApiError(404, "No liked videos found");
    }

    return res.status(200).json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}