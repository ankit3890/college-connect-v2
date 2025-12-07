import mongoose, { Schema, Document, Model } from "mongoose";

export interface IComment extends Document {
  postId: string;
  user: string; // username
  text: string;
  parentId?: string;
  upvotes: string[]; // usernames
  downvotes: string[]; // usernames
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    user: { type: String, required: true },
    text: { type: String, required: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
    upvotes: { type: [String], default: [] },
    downvotes: { type: [String], default: [] },
  },
  { timestamps: true }
);

const Comment: Model<IComment> =
  mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema);

export default Comment;
