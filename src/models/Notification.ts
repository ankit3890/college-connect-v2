import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
  user: string; // username of recipient
  type: "reply" | "mention" | "invite" | "alert";
  message: string;
  link?: string; // url to redirect
  read: boolean;
  invitationId?: string; // id of invitation if type is invite
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    user: { type: String, required: true, index: true },
    type: { type: String, enum: ["reply", "mention", "invite", "alert"], required: true },
    message: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, default: false },
    invitationId: { type: String },
  },
  { timestamps: true }
);

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
