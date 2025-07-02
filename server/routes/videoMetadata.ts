import { RequestHandler } from "express";
import mongoose from "mongoose";
import { Video, IVideo } from "../models/Video.js";

/**
 * Create a new video metadata entry
 */
export const createVideo: RequestHandler = async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "Database unavailable",
        message: "MongoDB is not connected.",
      });
    }

    const {
      title,
      description,
      category,
      tags,
      videoUrl,
      thumbnailUrl,
      r2VideoKey,
      r2ThumbnailKey,
      duration,
      originalDuration,
      finalDuration,
      wasTrimmed,
      trimData,
      chapters,
      isPublic,
      accessibilityFeatures,
    } = req.body;

    const userId = (req as any).userId;

    if (
      !title ||
      !description ||
      !videoUrl ||
      !r2VideoKey ||
      duration === undefined
    ) {
      return res.status(400).json({
        error: "Missing required fields",
        message:
          "Title, description, video URL, R2 key, and duration are required",
      });
    }

    const video = new Video({
      title,
      description,
      category,
      tags: tags || [],
      videoUrl,
      thumbnailUrl,
      r2VideoKey,
      r2ThumbnailKey,
      userId,
      duration,
      originalDuration: originalDuration || duration,
      finalDuration: finalDuration || duration,
      wasTrimmed: wasTrimmed || false,
      trimData,
      isPublic: isPublic !== undefined ? isPublic : true,
      accessibilityFeatures: accessibilityFeatures || {
        hasSubtitles: false,
        hasAudioDescription: false,
        hasSignLanguage: false,
      },
    });

    await video.save();

    console.log(`✅ Video metadata saved: ${title} (${video._id})`);

    res.status(201).json({
      success: true,
      message: "Video metadata created successfully",
      video: video.toJSON(),
    });
  } catch (error: any) {
    console.error("❌ Create video error:", error);

    if (res.headersSent) return;

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message,
      );
      return res.status(400).json({
        error: "Validation error",
        message: messages.join(", "),
      });
    }

    return res.status(500).json({
      error: "Server error",
      message: "An error occurred while creating video metadata",
    });
  }
};

/**
 * Get video metadata by ID
 */
export const getVideo: RequestHandler = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "Database unavailable",
        message: "MongoDB is not connected.",
      });
    }

    const { id } = req.params;
    const userId = (req as any).userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid video ID",
        message: "Please provide a valid video ID",
      });
    }

    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({
        error: "Video not found",
        message: "Video with this ID does not exist",
      });
    }

    // Check if user can access this video
    if (!video.isPublic) {
      // Private video - check if user is authenticated and owns the video
      if (!userId || video.userId.toString() !== userId) {
        return res.status(403).json({
          error: "Access denied",
          message: "You don't have permission to access this video",
        });
      }
    }

    // Increment view count
    await Video.findByIdAndUpdate(id, { $inc: { views: 1 } });

    res.json({
      success: true,
      video: {
        ...video.toJSON(),
        userId: video.userId.toString(), // Ensure userId is a string
      },
    });
  } catch (error) {
    console.error("❌ Get video error:", error);
    if (res.headersSent) return;

    return res.status(500).json({
      error: "Server error",
      message: "An error occurred while fetching video",
    });
  }
};

/**
 * Get all videos (with pagination and filtering)
 */
export const getVideos: RequestHandler = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "Database unavailable",
        message: "MongoDB is not connected.",
      });
    }

    const userId = (req as any).userId;
    const {
      page = 1,
      limit = 10,
      category,
      tags,
      userId: filterUserId,
      search,
      myVideos,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};

    if (myVideos === "true") {
      // Get only current user's videos
      query.userId = userId;
    } else {
      // Public videos or specific user's public videos
      query.isPublic = true;
      if (filterUserId) {
        query.userId = filterUserId;
      }
    }

    if (category) {
      query.category = category;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    if (search) {
      query.$text = { $search: search };
    }

    const videos = await Video.find(query)
      .populate("userId", "username role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Video.countDocuments(query);

    res.json({
      success: true,
      videos: videos.map((video) => video.toJSON()),
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        count: videos.length,
        totalVideos: total,
      },
    });
  } catch (error) {
    console.error("❌ Get videos error:", error);
    if (res.headersSent) return;

    return res.status(500).json({
      error: "Server error",
      message: "An error occurred while fetching videos",
    });
  }
};

/**
 * Update video metadata
 */
export const updateVideo: RequestHandler = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "Database unavailable",
        message: "MongoDB is not connected.",
      });
    }

    const { id } = req.params;
    const userId = (req as any).userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid video ID",
        message: "Please provide a valid video ID",
      });
    }

    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({
        error: "Video not found",
        message: "Video with this ID does not exist",
      });
    }

    // Check if user owns this video
    if (video.userId.toString() !== userId) {
      return res.status(403).json({
        error: "Access denied",
        message: "You can only update your own videos",
      });
    }

    // Update allowed fields
    const updateData: any = { lastEditedAt: new Date() };
    const allowedFields = [
      "title",
      "description",
      "category",
      "tags",
      "isPublic",
      "accessibilityFeatures",
      "finalDuration",
      "wasTrimmed",
      "trimData",
      "videoUrl",
      "thumbnailUrl",
      "r2VideoKey",
      "r2ThumbnailKey",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const updatedVideo = await Video.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("userId", "username role");

    console.log(`✅ Video updated: ${updatedVideo?.title} (${id})`);

    res.json({
      success: true,
      message: "Video updated successfully",
      video: updatedVideo?.toJSON(),
    });
  } catch (error: any) {
    console.error("❌ Update video error:", error);

    if (res.headersSent) return;

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message,
      );
      return res.status(400).json({
        error: "Validation error",
        message: messages.join(", "),
      });
    }

    return res.status(500).json({
      error: "Server error",
      message: "An error occurred while updating video",
    });
  }
};

/**
 * Delete video metadata
 */
export const deleteVideo: RequestHandler = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "Database unavailable",
        message: "MongoDB is not connected.",
      });
    }

    const { id } = req.params;
    const userId = (req as any).userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid video ID",
        message: "Please provide a valid video ID",
      });
    }

    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({
        error: "Video not found",
        message: "Video with this ID does not exist",
      });
    }

    // Check if user owns this video
    if (video.userId.toString() !== userId) {
      return res.status(403).json({
        error: "Access denied",
        message: "You can only delete your own videos",
      });
    }

    await Video.findByIdAndDelete(id);

    console.log(`✅ Video metadata deleted: ${video.title} (${id})`);

    res.json({
      success: true,
      message: "Video deleted successfully",
      deletedVideo: {
        id: video._id,
        r2VideoKey: video.r2VideoKey,
        r2ThumbnailKey: video.r2ThumbnailKey,
      },
    });
  } catch (error) {
    console.error("❌ Delete video error:", error);
    if (res.headersSent) return;

    return res.status(500).json({
      error: "Server error",
      message: "An error occurred while deleting video",
    });
  }
};
