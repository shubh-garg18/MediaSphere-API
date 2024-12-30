import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid Video Id");
    }

    const like = await Like.findOne({
        video: videoId,
        likedBy: req.user._id,
    });

    if (like) {
        await Like.findByIdAndDelete(like._id);
        return res
            .status(200)
            .json(new ApiResponse(200, "Video unliked successfully"));
    } else {
        await Like.create({
            video: videoId,
            likedBy: req.user._id,
        });
        return res
            .status(200)
            .json(new ApiResponse(200, "Video liked successfully"));
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(404, "Invalid Comment Id");
    }

    const like = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id,
    });

    if (like) {
        await Like.findByIdAndDelete(like._id);
        return res
            .status(200)
            .json(new ApiResponse(200, "Comment unliked successfully"));
    } else {
        await Like.create({
            comment: commentId,
            likedBy: req.user._id,
        });
        return res
            .status(200)
            .json(new ApiResponse(200, "Comment liked successfully"));
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404, "Invalid Tweet Id");
    }

    const like = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id,
    });

    if (like) {
        await Like.findByIdAndDelete(like._id);
        return res
            .status(200)
            .json(new ApiResponse(200, "Tweet unliked successfully"));
    } else {
        await Like.create({
            tweet: tweetId,
            likedBy: req.user._id,
        });
        return res
            .status(200)
            .json(new ApiResponse(200, "Tweet liked successfully"));
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const { userId } = req.user._id;

    if (!isValidObjectId(userId)) {
        throw new ApiError(404, "Invalid User Id");
    }

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
            },
        },
        {
            $unwind: "$videoDetails",
        },
        {
            $project: {
                "videoDetails.owner.password": 0,
            },
        },
    ]);

    if (!likedVideos) {
        throw new ApiError(404, "Liked videos not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Liked videos fetched successfully",
                likedVideos,
            ),
        );
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
};
