import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBannedUser {
  username: string;
  reason?: string;
  bannedAt: Date;
}

export interface ICommunity extends Document {
  name: string;
  creator: string;
  icon?: string;
  description?: string;
  members: string[]; // usernames
  subadmins: string[]; // usernames
  bannedUsers: IBannedUser[];
  isClosed: boolean;
  isVerified: boolean;
  isDevMember: boolean; // For dev communities
  createdAt: Date;
  updatedAt: Date;
}

const CommunitySchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    creator: { type: String, required: true },
    icon: { type: String },
    description: { type: String },
    members: { type: [String], default: [] },
    subadmins: { type: [String], default: [] },
    bannedUsers: [
      {
        username: { type: String },
        reason: String,
        bannedAt: { type: Date, default: Date.now },
      },
    ],
    isClosed: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isDevMember: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Community: Model<ICommunity> =
  mongoose.models.Community || mongoose.model<ICommunity>("Community", CommunitySchema);

export default Community;
