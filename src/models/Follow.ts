import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFollow extends Document {
    followerId: mongoose.Types.ObjectId;
    followingId: mongoose.Types.ObjectId;
    createdAt: Date;
}

const FollowSchema: Schema<IFollow> = new Schema(
    {
        followerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        followingId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

// Prevent duplicate follows
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

const Follow: Model<IFollow> =
    mongoose.models.Follow || mongoose.model<IFollow>("Follow", FollowSchema);

export default Follow;
