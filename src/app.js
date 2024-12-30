import express, { urlencoded } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

// parse application/json
// When a JSON payload is received, Express will use the express.json() middleware to parse it and store the resulting value in req.body.
// The {limit: "16kb"} option is used to limit the size of the JSON payload to 16 kilobytes. This is to prevent large payloads from being
// sent to the server and to prevent attacks such as the JSON Killer package.
app.use(express.json({ limit: "16kb" }));

// parse application/x-www-form-urlencoded
// When an urlencoded payload is received, Express will use the urlencoded middleware to parse it and store the resulting value in req.body.
// The {limit: "16kb", extended: true} option is used to limit the size of the urlencoded payload to 16 kilobytes and to allow for complex data structures
// such as arrays and objects.
app.use(urlencoded({ limit: "16kb", extended: true }));

// serve static files from the "public" folder
// Express will serve files from the public folder at the root URL ("/").
app.use(express.static("public"));

// cookie-parser middleware
// The cookie-parser middleware is used to parse the cookies sent by the client and store them in req.cookies.
// This allows us to access the cookies sent by the client and to set new cookies in the response.
app.use(cookieParser());

// app.on("error", (err) => console.log(err));
// https://localhost:8000/api/v1/user/register

import userRouter from "./routes/user.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);

export default app;
