import mongoose from "mongoose";

const MONGODB_URL =
  process.env.MONGODB_URL ||
  "mongodb+srv://alexisdlhb:n7Lq3sj4rjznxKXF@tfg.xmsn4s8.mongodb.net/test?retryWrites=true&w=majority&appName=TFG";

export const connectDB = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log("MongoDB already connected");
      return;
    }

    // Add connection options for better reliability
    await mongoose.connect(MONGODB_URL, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    console.log("✅ MongoDB connected successfully to test database");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);

    if (error instanceof Error && error.message.includes("IP")) {
      console.log(
        "💡 IP Address Issue: Please whitelist this server's IP in MongoDB Atlas",
      );
      console.log("🔗 Go to: MongoDB Atlas > Network Access > Add IP Address");
      console.log(
        "📍 Add: 0.0.0.0/0 (for development) or this server's specific IP",
      );
    }

    console.log(
      "🔄 Continuing without database - authentication will not work",
    );
    // Don't exit - let the server run for development
  }
};

// Handle connection events
mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed through app termination");
  process.exit(0);
});
