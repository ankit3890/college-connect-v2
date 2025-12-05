import mongoose, { Schema, Document } from "mongoose";

export interface IFeedback extends Document {
    userId: mongoose.Types.ObjectId;
    type: "feature" | "improvement" | "name_suggestion";
    message: string;
    category?: string;
    status: "pending" | "reviewed" | "implemented";
    createdAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: ["feature", "improvement", "name_suggestion"],
            required: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        category: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ["pending", "reviewed", "implemented"],
            default: "pending",
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
FeedbackSchema.index({ userId: 1, createdAt: -1 });
FeedbackSchema.index({ status: 1 });

export default mongoose.models.Feedback ||
    mongoose.model<IFeedback>("Feedback", FeedbackSchema);
