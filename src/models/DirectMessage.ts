import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDirectMessage extends Document {
  from: string;
  to: string;
  text: string;
  image?: string;
  read: boolean;
  createdAt: Date;
}

const DirectMessageSchema: Schema = new Schema(
  {
    from: { type: String, required: true, index: true },
    to: { type: String, required: true, index: true },
    text: { type: String, default: "" }, // Make text optional if image is present? Or enforce one.
    image: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound index for efficient chat history query
DirectMessageSchema.index({ from: 1, to: 1, createdAt: 1 });

// FORCE MODEL RECOMPILE (Fix for Next.js Hot Reload keeping old schema)
if (mongoose.models.DirectMessage) {
  delete mongoose.models.DirectMessage;
}

const DirectMessage: Model<IDirectMessage> = mongoose.model<IDirectMessage>("DirectMessage", DirectMessageSchema);

export default DirectMessage;
