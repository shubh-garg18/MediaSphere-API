import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        // Retrieve the user document from the database using the provided userId
        const user = await User.findById(userId);

        // Generate a new access token for the user
        const accessToken = user.generateAccessToken();

        // Generate a new refresh token for the user
        const refreshToken = user.generateRefreshToken();

        // Update the user's document with the new refresh token
        user.refreshToken = refreshToken;

        // Save the updated user document to the database
        // Skip validation checks before saving
        await user.save({ validateBeforeSave: false });

        // Return the generated access and refresh tokens
        return { accessToken, refreshToken };
    } catch (error) {
        // Throw an error if token generation fails
        throw new ApiError(
            500,
            "Something went wrong while generating access and refresh token",
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // get user detail from frontend
    // validate user data - not empty
    // check if user already exists: username, email
    // check for images, check for avatar : multer
    // upload them to cloudinary, avatar check
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // send success response

    // get the properties of the user object from the request body
    const {
        // username of the user
        username,
        // email of the user
        email,
        // password of the user
        password,
        // fullname of the user
        fullname,
    } = req.body;

    // Check if any of the fields (fullname, username, email, password) are empty
    // We use the some() method to check if any of the fields are empty
    // If any of the fields are empty, throw an ApiError with a 400 status code and a message indicating that all fields are required
    if (
        [fullname, username, email, password].some(
            (field) => field?.trim() === "",
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // Check if a user with the same username or email already exists in the database
    // We use the findOne() method to query the database for a user with the same username or email as the one provided in the request body
    // The $or operator is used to specify multiple conditions in the query
    // In this case, we are checking if a user with the same username or email exists in the database
    // If a user with the same username or email is found, throw an ApiError with a 409 status code and a message indicating that the user already exists
    const existedUser = await User.findOne({
        $or: [
            // Check if a user with the same username  or email as the one provided in the request body exists in the database
            { username },
            { email },
        ],
    });
    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }

    console.log(req.files);

    // Get the local paths of the avatar and cover image files from the request object
    // The req.files object is an object that contains the files uploaded by the user
    // The req.files.avatar and req.files.coverImage properties contain the paths of the avatar and cover image files respectively
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    let coverImageLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    // Upload the avatar and coverImage file to Cloudinary and get the URL of the uploaded file
    // The uploadOnCloudinary function takes the local path of the file as an argument and returns a Promise that resolves to the URL of the uploaded file
    // We use the async/await syntax to wait for the Promise to resolve and store the result in the avatar variable
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    // Create a new user document in the database
    // The user document contains the following fields: username, email, password, fullname, avatar, and coverImage
    // The avatar and coverImage fields contain the URLs of the uploaded files on Cloudinary
    const user = await User.create({
        // The username is converted to lowercase to prevent duplicate usernames with different cases
        fullname,
        username: username.toLowerCase(),
        password,
        // The avatar field contains the URL of the uploaded avatar file on Cloudinary
        avatar: avatar.url,
        // The coverImage field contains the URL of the uploaded cover image file on Cloudinary, or an empty string if no file was uploaded
        coverImage: coverImage?.url || "",
        email,
    });

    // Find the newly created user document in the database, excluding the password and refreshToken fields from the result
    // We use the findById() method to query the database for the user document with the same _id as the one created in the previous step
    // The select() method is used to specify which fields to include or exclude from the result
    // In this case, we exclude the password and refreshToken fields from the result
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken",
    );

    // Check if the newly created user document was found in the database
    // If the user document was not found, throw an ApiError with a 500 status code and a message indicating that something went wrong while registering the user
    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user",
        );
    }

    // Return a 201 Created response with the newly created user document in the response body
    // The ApiResponse object is used to create a standard response format for the API
    // The first argument to the ApiResponse constructor is the status code (200 in this case)
    // The second argument is the message to be sent in the response
    // The third argument is the data to be sent in the response (the newly created user document in this case)
    return res
        .status(201)
        .json(
            new ApiResponse(
                200,
                "User registered successfully",
                createdUser,
            ),
        );
});

const loginUser = asyncHandler(async (req, res) => {
    // req.body -> data
    // username or email
    // check if already exist in db if not tell to register
    // password check
    // generate access token, refresh token
    // send cookies
    // send response
    const { email, username, password } = req.body;
    if (!(username || email)) {
        throw new ApiError(400, "Username or email are required");
    }
    const user = await User.findOne({
        $or: [{ username }, { email }],
    });
    if (!user) {
        throw new ApiError(404, "User not found, register first");
    }
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid user credentials");
    }
    const { accessToken, refreshToken } =
        await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken",
    );

    // Cookie options for the access token and refresh token cookies
    // The httpOnly flag is set to true to prevent the cookie from being accessed by JavaScript
    // The secure flag is set to true to require the cookie to be sent over HTTPS
    const options = {
        httpOnly: true,
        secure: true,
    };

    // Return a response with the access token and refresh token cookies
    // The access token cookie is set to the access token with the httpOnly flag set to true
    // The refresh token cookie is set to the refresh token with the httpOnly flag set to true
    // The secure flag is set to true to require the cookie to be sent over HTTPS
    // The response is sent with a 200 status code and the user data in the response body
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, "User logged in successfully", {
                user: loggedInUser,
                accessToken,
                refreshToken,
            }),
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        },
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "User logged out successfully", {}));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
        throw new ApiError(401, "Invalid Refresh Token");
    }

    if (user?.refreshToken !== incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, newRefreshToken } =
        await generateAccessAndRefreshToken(user._id);

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200, "Access token refreshed successfully", {
                accessToken,
                refreshToken: newRefreshToken,
            }),
        );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    const isPasswordCorrect =
        await user.isPasswordCorrect(currentPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid current password");
    }

    user.password = newPassword;

    await user.save({ validateBeforeSave: false }); // pre hook will run

    return res
        .status(200)
        .json(new ApiResponse(200, "Password changed successfully", {}));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, "User found successfully", req.user));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body;
    if (!fullname || !email) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email,
            },
        },
        {
            new: true,
        },
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Account details updated successfully",
                user,
            ),
        );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(
            500,
            "Something went wrong while uploading avatar",
        );
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar,
            },
        },
        {
            new: true,
        },
    ).select("-password");

    return res
        .status(200)
        .json(new ApiResponse(200, "Avatar updated successfully", user));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError(
            500,
            "Something went wrong while uploading cover image",
        );
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage,
            },
        },
        {
            new: true,
        },
    ).select("-password");

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Cover image updated successfully", user),
        );
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Username is required");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase(),
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
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers",
                },
                subscribedToCount: {
                    $size: "$subscribedTo",
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [
                                req.user?._id,
                                "$subscribers.subscriber",
                            ],
                        },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                fullname: 1,
                avatar: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
                coverImage: 1,
                username: 1,
                email: 1,
            },
        },
    ]);

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "User found successfully", channel[0]));
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        avatar: 1,
                                        username: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            $first: "$owner",
                        },
                    },
                ],
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Watch history found successfully",
                user[0],
            ),
        );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
};
