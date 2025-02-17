import mongoose from "mongoose";
import Comment from "./comment.model.js";
import React from "./react.model.js";

const hiddenPostsSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", require: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", require: true },
    isDeleted: { type: Boolean, default: false }, // Soft delete flag
    deletedAt: { type: Date, default: null }
}, { timestamps: true })


hiddenPostsSchema.post("findOneAndUpdate", async function (doc) {
    // console.log(doc);
    // console.log(this.getUpdate());
    const { userId, postId } = doc

    await Comment.findOneAndUpdate(
        { ownerId: userId, onModel: 'Post', commentOnId: postId },
        { isDeleted: true, deletedAt: Date.now() },
        { new: true }
    );

    await React.findOneAndUpdate(
        { ownerId: userId, onModel: 'Post', reactOnId: postId },
        { isDeleted: true, deletedAt: Date.now() },
        { new: true }
    );

})

hiddenPostsSchema.post("findOneAndDelete", async function (doc) {

    await Comment.findOneAndUpdate(
        { ownerId: doc?.userId, onModel: 'Post', commentOnId: doc?.postId },
        { isDeleted: false, deletedAt: null },
        { new: true }
    );

    await React.findOneAndUpdate(
        { ownerId: doc?.userId, onModel: 'Post', reactOnId: doc?.postId },
        { isDeleted: false, deletedAt: null },
        { new: true }
    );
})


const HiddenPosts = mongoose.model.HiddenPosts || mongoose.model("HiddenPosts", hiddenPostsSchema)
export default HiddenPosts;