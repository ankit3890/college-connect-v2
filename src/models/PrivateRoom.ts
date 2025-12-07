import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPrivateRoom extends Document {
  name: string;
  members: string[];
  owner: string;
  createdAt: Date;
  updatedAt: Date;
}

const PrivateRoomSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    members: { type: [String], default: [] },
    owner: { type: String, required: true },
  },
  { timestamps: true }
);

const PrivateRoom: Model<IPrivateRoom> =
  mongoose.models.PrivateRoom || mongoose.model<IPrivateRoom>("PrivateRoom", PrivateRoomSchema);

export default PrivateRoom;
