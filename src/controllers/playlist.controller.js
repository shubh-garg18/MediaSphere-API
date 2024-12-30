import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const playlist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user._id,
    });

    if (!playlist) {
        throw new ApiError(500, "Failed to create playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                "Playlist created successfully",
                playlist,
            ),
        );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user id");
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
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

    if (!playlists) {
        throw new ApiError(500, "Failed to fetch playlists");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                "Playlists fetched successfully",
                playlists,
            ),
        );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(playlistId),
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

    if (!playlist) {
        throw new ApiError(500, "Failed to fetch playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                "Playlist fetched successfully",
                playlist,
            ),
        );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video id");
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: {
                videos: videoId,
            },
        },
        {
            new: true,
        },
    );

    if (!playlist) {
        throw new ApiError(500, "Failed to add video to playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                "Video added to playlist successfully",
                playlist,
            ),
        );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video id");
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId,
            },
        },
        {
            new: true,
        },
    );

    if (!playlist) {
        throw new ApiError(500, "Failed to remove video from playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                "Video removed from playlist successfully",
                playlist,
            ),
        );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    const playlist = await Playlist.findByIdAndDelete(playlistId);

    if (!playlist) {
        throw new ApiError(500, "Failed to delete playlist");
    }

    return res
        .status(200)
        .json(new ApiResponse(201, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist id");
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description,
            },
        },
        {
            new: true,
        },
    );

    if (!playlist) {
        throw new ApiError(500, "Failed to update playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                "Playlist updated successfully",
                playlist,
            ),
        );
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};
