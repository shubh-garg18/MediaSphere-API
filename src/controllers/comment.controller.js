import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid Video Id");
    }

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
    };

    const comments = await Comment.aggregatePaginate(
        Comment.aggregate([
            {
                $match: mongoose.Types.ObjectId(videoId),
            },
            {
                $lookup: {
                    from: "user",
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
                    foreignField: "comment",
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
                        $in: [req.user._id, "$likes.likedBy"],
                    },
                },
            },
            {
                $project: {
                    content: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    likedBy: 1,
                    likesCount: 1,
                    owner: {
                        $first: "$owner",
                    },
                },
            },
            {
                $sort: {
                    createdAt: -1,
                },
            },
        ]),
        options,
    );

    if (!comments) {
        throw new ApiError(500, "Failed to get comments");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                "Comments fetched successfully",
                comments,
            ),
        );
});

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Invalid Video Id");
    }

    const comment = await Comment.create({
        content: req.body.content,
        owner: req.user._id,
        video: videoId,
    });

    if (!comment) {
        throw new ApiError(500, "Failed to create comment");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(201, "Comment created successfully", comment),
        );
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(404, "Invalid Comment Id");
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: req.body.content,
            },
        },
        {
            new: true,
            runValidators: true,
        },
    );

    if (!comment) {
        throw new ApiError(500, "Failed to update comment");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(201, "Comment updated successfully", comment),
        );
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(404, "Invalid Comment Id");
    }

    const comment = await Comment.findByIdAndDelete(commentId);

    if (!comment) {
        throw new ApiError(500, "Failed to delete comment");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(201, "Comment deleted successfully", comment),
        );
});

export { getVideoComments, addComment, updateComment, deleteComment };
