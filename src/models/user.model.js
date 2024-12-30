import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            lowercase: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            lowercase: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        avatar: {
            type: String, //cloudinary url
            required: true,
        },
        coverImage: {
            type: String, //cloudinary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
            },
        ],
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        refreshToken: {
            type: String,
        },
    },
    { timestamps: true },
);

userSchema.pre("save", async function (next) {
    // Check if the password field has been modified
    // If not, call the next middleware function in the stack and exit
    if (!this.isModified("password")) return next();

    // Generate a salt for hashing the password
    // The number 10 refers to the cost factor, which determines the time taken to generate the salt
    const salt = await bcrypt.genSalt(10);

    // Hash the password using the generated salt
    // The hashed password replaces the plain text password in the user document
    this.password = await bcrypt.hash(this.password, salt);

    // Call the next middleware function in the stack
    next();
});

//Checks if the provided password matches the hashed password in the user document.
userSchema.methods.isPasswordCorrect = async function (password) {
    // Compare the provided password with the hashed password in the user document
    // The compare() method returns a Promise that resolves to a boolean indicating if the passwords match
    return await bcrypt.compare(password, this.password);
};

/**
 * Generates an access token for the user.
 * The access token is a JWT that contains the user's _id, username, fullname and email.
 * The access token is signed with the ACCESS_TOKEN_SECRET environment variable.
 * The access token expires in the number of milliseconds specified by the ACCESS_TOKEN_EXPIRY environment variable.
 * @returns {String} The access token.
 */
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            // The payload contains the user's _id, username, fullname and email
            // These are the claims that are verified when the access token is decoded
            _id: this._id,
            username: this.username,
            fullname: this.fullname,
            email: this.email,
        },
        // The access token is signed with the ACCESS_TOKEN_SECRET environment variable
        // This secret is used to generate the JWT signature
        process.env.ACCESS_TOKEN_SECRET,
        {
            // The access token expires in the number of milliseconds specified by the ACCESS_TOKEN_EXPIRY environment variable
            // This is the time after which the access token can no longer be used to access protected routes
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        },
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            fullname: this.fullname,
            email: this.email,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        },
    );
};

export const User = mongoose.model("User", userSchema);
