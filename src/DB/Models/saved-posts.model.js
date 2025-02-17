import mongoose from "mongoose";

const savedPostsSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", require: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", require: true },
    isDeleted: { type: Boolean, default: false }, // Soft delete flag
    deletedAt: { type: Date, default: null }
}, { timestamps: true })
const SavedPosts = mongoose.model.SavedPosts || mongoose.model("SavedPosts", savedPostsSchema)
export default SavedPosts;