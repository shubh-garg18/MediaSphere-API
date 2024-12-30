import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.user._id;
    const stats = await Video.aggregate([
        {
            $match: {
                owner: mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $group: {
                _id: null,
                totalVideos: {
                    $sum: 1,
                },
                totalViews: {
                    $sum: "$views",
                },
                totalLikes: {
                    $sum: "$likes",
                },
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $project: {
                _id: 0,
                totalVideos: 1,
                totalViews: 1,
                totalLikes: 1,
                totalSubscribers: {
                    $size: "$subscribers",
                },
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                "Channel stats fetched successfully",
                stats[0],
            ),
        );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.user._id;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(404, "Invalid Channel Id");
    }

    const videos = await Video.aggregate([
        {
            $match: {
                owner: mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            },
        },
        {
            $unwind: "$owner",
        },
        {
            $project: {
                "owner.password": 0,
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                "Channel videos fetched successfully",
                videos,
            ),
        );
});

export { getChannelStats, getChannelVideos };
