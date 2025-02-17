import mongoose from "mongoose";
import Comment from "./comment.model.js";

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        require: true
    },
    desc: String,
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    images: [{
        public_id: String,
        secure_url: String
    }],
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', require: true },
    allowComments: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }, // Soft delete flag
    deletedAt: { type: Date, default: null }

}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

postSchema.pre('find', function (next) {
    this.where({ isDeleted: false });
    next();
});
postSchema.virtual("Comments", {
    ref: "Comment",
    localField: "_id",
    foreignField: "commentOnId"
})
postSchema.virtual("Reacts", {
    ref: "React",
    localField: "_id",
    foreignField: "reactOnId"
})

//Hooks
postSchema.post("findOneAndDelete", async function (doc) {
    await Comment.deleteMany({ commentOnId: doc?._id, onModel: "Post" })
})

const Post = mongoose.model.Post || mongoose.model("Post", postSchema)
export default Post;

