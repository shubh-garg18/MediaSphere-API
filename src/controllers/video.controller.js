import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy,
        sortType,
        userId,
    } = req.query;

    const match = {};
    if (query) {
        match.title = {
            $regex: query,
            $options: "i",
        };
    }
    if (userId && isValidObjectId(userId)) {
        match.userId = userId;
    }
    const sort = {};
    if (sortBy) {
        sort[sortBy] = sortType === "desc" ? -1 : 1;
    }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort,
    };

    const videos = await Video.aggregatePaginate(
        Video.aggregate([
            {
                $match: match,
            },
            {
                $sort: sort,
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
        ]),
        options,
    );

    return res
        .status(200)
        .json(new ApiResponse(201, "Videos fetched successfully", videos));
    // TODO: get all videos
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const videoFilePath = req.files?.videoFile[0].path;
    const thumbnailPath = req.files?.thumbnail[0].path;

    if (!videoFilePath) {
        throw new ApiError(400, "Video File is missing");
    }
    if (!thumbnailPath) {
        throw new ApiError(400, "Thumbnail is missing");
    }

    const videoFile = await uploadOnCloudinary(videoFilePath);
    const thumbnail = await uploadOnCloudinary(thumbnailPath);

    if (!videoFile.url) {
        throw new ApiError(
            500,
            "Something went wrong while uploading Video File",
        );
    }
    if (!thumbnail.url) {
        throw new ApiError(
            500,
            "Something went wrong while uploading thumbnail",
        );
    }

    const video = await Video.create({
        title,
        description,
        videoFile,
        thumbnail,
        owner: req.user._id,
        duration: 0,
    });

    return res
        .status(200)
        .json(new ApiResponse(201, "Video Published Succesfully", video));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(videoId),
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

    if (!video.length) {
        throw new ApiError(400, "Video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(201, "Video retrieved successfully", video));
    //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid Video Id");
    }

    const { title, description, thumbnail } = req.body;

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail,
            },
        },
        {
            new: true,
        },
    );

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(201, "Video updated sucecsfully", video));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid Video Id");
    }

    const video = await Video.findByIdAndDelete(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(201, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid Video Id");
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video.isPublished,
            },
        },
        {
            new: true,
        },
    );

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(201, "Video status updated successfully"));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
