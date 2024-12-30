import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required");
    }

    const tweet = await Tweet.create({
        owner: req.user?._id,
        content: content.trim(),
    });

    if (!tweet) {
        throw new ApiError(500, "Failed to create tweet");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, "Tweet created successfully", tweet));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    const tweet = await tweet.aggregate([
        {
            $match: {
                owner: mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes",
                pipeline: [
                    {
                        $project: {
                            likedBy: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes",
                },
                isLiked: {
                    $in: [req.user?._id, "$likes.likedBy"],
                },
            },
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                updatedAt: 1,
                owner: { $arrayElemAt: ["$owner", 0] },
                likesCount: 1,
                isLiked: 1,
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
    ]);

    if (!tweet) {
        throw new ApiError(500, "Failed to get tweets");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Tweets fetched successfully", tweet));
});

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can edit their tweet");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: content.trim(),
            },
        },
        {
            new: true,
        },
    );

    if (!tweet) {
        throw new ApiError(500, "Failed to update tweet");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Tweet updated successfully",
                updatedTweet,
            ),
        );
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id");
    }

    const tweet = await Tweet.findById(tweetId);

    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can delete thier tweet");
    }

    await Tweet.findByIdAndDelete(tweetId);

    if (!tweet) {
        throw new ApiError(500, "Failed to delete tweet");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Tweet deleted successfully", tweet));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
