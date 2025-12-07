import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPost extends Document {
  title: string;
  content: string;
  community: string; // community name
  author: string; // username
  image?: string;
  upvotes: string[]; // usernames
  downvotes: string[]; // usernames
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    community: { type: String, required: true, index: true },
    author: { type: String, required: true },
    image: { type: String },
    upvotes: { type: [String], default: [] },
    downvotes: { type: [String], default: [] },
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Post: Model<IPost> =
  mongoose.models.Post || mongoose.model<IPost>("Post", PostSchema);

export default Post;
