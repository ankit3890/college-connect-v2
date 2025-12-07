import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGlobalChat extends Document {
  user: string; // username
  text?: string;
  image?: string;
  createdAt: Date;
}

const GlobalChatSchema: Schema = new Schema(
  {
    user: { type: String, required: true },
    text: { type: String },
    image: { type: String },
  },
  { timestamps: true }
);

const GlobalChat: Model<IGlobalChat> =
  mongoose.models.GlobalChat || mongoose.model<IGlobalChat>("GlobalChat", GlobalChatSchema);

export default GlobalChat;
