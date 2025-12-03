import mongoose from "mongoose";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/syllabus-tool";

let gridfsBucket: mongoose.mongo.GridFSBucket;
let modelsLoaded = false;

export async function connectDb() {
    try {
        // Import models first (before checking connection state)
        if (!modelsLoaded) {
            await import("@/models/syllabus/Document");
            await import("@/models/syllabus/Page");
            modelsLoaded = true;
        }

        if (mongoose.connection.readyState >= 1) {
            return;
        }

        console.log("Connecting to Mongo with URI:", MONGO_URI.replace(/:([^:@]+)@/, ":****@"));
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("Connected to MongoDB");

        const db = mongoose.connection.db;
        if (db) {
            gridfsBucket = new mongoose.mongo.GridFSBucket(db, { bucketName: "uploads" });
        }
    } catch (err) {
        console.error("MongoDB connection error:", err);
        // Do not exit process in Next.js, just throw
        throw err;
    }
}

export function getGridFSBucket() {
    if (!gridfsBucket) {
        throw new Error("GridFSBucket not initialized");
    }
    return gridfsBucket;
}
