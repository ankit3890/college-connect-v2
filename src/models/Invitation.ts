import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInvitation extends Document {
  from: string; // username
  to: string; // username
  community: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
}

const InvitationSchema: Schema = new Schema(
  {
    from: { type: String, required: true },
    to: { type: String, required: true, index: true },
    community: { type: String, required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

const Invitation: Model<IInvitation> =
  mongoose.models.Invitation || mongoose.model<IInvitation>("Invitation", InvitationSchema);

export default Invitation;
