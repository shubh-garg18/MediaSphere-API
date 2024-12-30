import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscriberId = req.user._id;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(404, "Invalid Channel Id");
    }

    const subscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId,
    });

    if (subscription) {
        await Subscription.findByIdAndDelete(subscription._id);
        return res
            .status(200)
            .json(
                new ApiResponse(
                    201,
                    "Unsubscribed from channel successfully",
                    subscription,
                ),
            );
    } else {
        const newSubscription = await Subscription.create({
            subscriber: subscriberId,
            channel: channelId,
        });
        return res
            .status(200)
            .json(
                new ApiResponse(
                    201,
                    "Subscribed to channel successfully",
                    newSubscription,
                ),
            );
    }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(404, "Invalid Channel Id");
    }

    const subscriberCount = await Subscription.aggregate([
        {
            $match: {
                channel: mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
            },
        },
        {
            $unwind: "$subscriber",
        },
        {
            $project: {
                "subscriber.password": 0,
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                "Subscribers fetched successfully",
                subscriberCount,
            ),
        );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(404, "Invalid Subscriber Id");
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: mongoose.Types.ObjectId(subscriberId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
            },
        },
        {
            $unwind: "$channel",
        },
        {
            $project: {
                "channel.password": 0,
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                "Subscribed channels fetched successfully",
                subscribedChannels,
            ),
        );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
};
