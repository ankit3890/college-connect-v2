import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICommunityChat extends Document {
  community: string;
  user: string;
  text: string;
  image?: string;
  createdAt: Date;
}

const CommunityChatSchema: Schema = new Schema(
  {
    community: { type: String, required: true, index: true },
    user: { type: String, required: true },
    text: { type: String, required: true },
    image: { type: String },
  },
  { timestamps: true }
);

const CommunityChat: Model<ICommunityChat> =
  mongoose.models.CommunityChat || mongoose.model<ICommunityChat>("CommunityChat", CommunityChatSchema);

export default CommunityChat;
