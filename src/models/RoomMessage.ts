import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRoomMessage extends Document {
  room: string; // roomId
  sender: string;
  text: string;
  createdAt: Date;
}

const RoomMessageSchema: Schema = new Schema(
  {
    room: { type: Schema.Types.ObjectId, ref: "PrivateRoom", required: true, index: true },
    sender: { type: String, required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

const RoomMessage: Model<IRoomMessage> =
  mongoose.models.RoomMessage || mongoose.model<IRoomMessage>("RoomMessage", RoomMessageSchema);

export default RoomMessage;
