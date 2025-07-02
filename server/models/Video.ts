import mongoose from "mongoose";

export interface IVideo extends mongoose.Document {
  title: string;
  description: string;
  category?: string;
  tags: string[];
  videoUrl: string;
  thumbnailUrl?: string;
  r2VideoKey: string;
  r2ThumbnailKey?: string;
  userId: mongoose.Types.ObjectId;
  duration: number;
  originalDuration: number;
  finalDuration: number;
  wasTrimmed: boolean;
  trimData?: {
    trimStart: number;
    trimEnd: number;
    trimmedDuration: number;
  };
  chapters?: {
    id: string;
    title: string;
    startTime: number;
    endTime: number;
  }[];
  uploadedAt: Date;
  lastEditedAt?: Date;
  views: number;
  isPublic: boolean;
  accessibilityFeatures: {
    hasSubtitles: boolean;
    hasAudioDescription: boolean;
    hasSignLanguage: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Video title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Video description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    category: {
      type: String,
      enum: [
        "life-skills",
        "education",
        "entertainment",
        "health-safety",
        "social-skills",
        "communication",
        "work-skills",
        "recreation",
        "daily-living",
        "other",
      ],
      default: "life-skills",
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [30, "Tag cannot exceed 30 characters"],
      },
    ],
    videoUrl: {
      type: String,
      required: [true, "Video URL is required"],
    },
    thumbnailUrl: {
      type: String,
    },
    r2VideoKey: {
      type: String,
      required: [true, "R2 video key is required"],
    },
    r2ThumbnailKey: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    duration: {
      type: Number,
      required: [true, "Video duration is required"],
      min: [0, "Duration cannot be negative"],
    },
    originalDuration: {
      type: Number,
      required: [true, "Original duration is required"],
      min: [0, "Duration cannot be negative"],
    },
    finalDuration: {
      type: Number,
      required: [true, "Final duration is required"],
      min: [0, "Duration cannot be negative"],
    },
    wasTrimmed: {
      type: Boolean,
      default: false,
    },
    trimData: {
      trimStart: {
        type: Number,
        min: 0,
      },
      trimEnd: {
        type: Number,
        min: 0,
      },
      trimmedDuration: {
        type: Number,
        min: 0,
      },
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    lastEditedAt: {
      type: Date,
    },
    views: {
      type: Number,
      default: 0,
      min: [0, "Views cannot be negative"],
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    accessibilityFeatures: {
      hasSubtitles: {
        type: Boolean,
        default: false,
      },
      hasAudioDescription: {
        type: Boolean,
        default: false,
      },
      hasSignLanguage: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Indexes for better query performance
videoSchema.index({ userId: 1, createdAt: -1 });
videoSchema.index({ category: 1, isPublic: 1 });
videoSchema.index({ tags: 1, isPublic: 1 });
videoSchema.index({ title: "text", description: "text" });

// Check if model already exists to prevent recompilation errors during hot reloads
export const Video =
  mongoose.models.Video ||
  mongoose.model<IVideo>("Video", videoSchema, "videos");
