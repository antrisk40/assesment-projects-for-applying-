import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRouter from "./routes/user.route.js";
import authRouter from "./routes/auth.route.js";
import multer from "multer";
import path from "path";
import User from "./models/user.model.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken"; // Import JWT for token creation

dotenv.config();

const app = express();

app.use(express.json());
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error(err);
  });


// Set up multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "api/uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// Initialize multer upload
const upload = multer({ storage: storage });

// JWT Secret Key
const jwtSecretKey = process.env.JWT_SECRET;

// Sign-in route
app.post("/api/signin", async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const validUser = await User.findOne({ email });
    if (!validUser) return next(errorHandler(404, "User not found!"));

    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) return next(errorHandler(401, "Wrong Credentials!"));

    // Sign a JWT token with the user's ID
    const token = jwt.sign({ userId: validUser._id }, jwtSecretKey);

    const { password: pass, ...userData } = validUser._doc;
    res.status(200).json({ token, ...userData });
  } catch (error) {
    next(error);
  }
});

// Middleware for verifying JWT token
const authenticateJWT = (req, res, next) => {
  // Extract the token from the request headers
  const token = req.headers.authorization;

  // Check if the token exists
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Split the token string to get the actual token part
  const tokenString = token.split(" ")[1];

  // Verify the JWT token using the secret key
  jwt.verify(tokenString, jwtSecretKey, (err, decoded) => {
    if (err) {
      // Handle JWT verification errors
      console.error("Error verifying JWT token:", err.message);
      return res.status(403).json({ message: "Forbidden" });
    }

    // Set the decoded user information in the request object
    req.user = decoded;

    // Call the next middleware or route handler
    next();
  });
};

// Upload route protected by JWT authentication
app.post(
  "/api/upload",
  authenticateJWT,
  upload.single("image"),
  async (req, res) => {
    try {
      // Ensure that there's a file uploaded
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      }

      // Get the image path
      const imagePath = req.file.path;

      // Retrieve the user ID from the request
      const userId = req.user.userId;

      // Find the user by ID and update the imagePath
      await User.findByIdAndUpdate(userId, { imagePath: imagePath });

      // Respond with success and imagePath
      res.status(200).json({ success: true, imagePath });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
);

// GET route to fetch user information based on JWT token
app.get("/api/user-info", authenticateJWT, async (req, res) => {
  try {
    // Extract the user ID from the decoded token
    const userId = req.user.userId;

    // Fetch user information from the database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send user data back to the client
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user info:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Define a route handler for fetching user images
app.get("/api/user-image", authenticateJWT, async (req, res) => {
  try {
    // Extract the user ID from the authenticated request
    const userId = req.user.userId;

    // Find the user by ID in the database
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Respond with the imagePath if available
    if (user.imagePath) {
      // Assuming imagePath contains the relative path to the user's image
      const imagePath = user.imagePath;
      return res.status(200).json({ success: true, imagePath });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "User image not found" });
    }
  } catch (error) {
    console.error("Error fetching user image:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// Routes for user and authentication
app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    statusCode: statusCode,
    message,
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
