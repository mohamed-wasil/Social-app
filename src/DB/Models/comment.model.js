import mongoose from "mongoose";
import { OnModelEnum } from "../../Constants/constants.js";

const commentsSchema = new mongoose.Schema({
    content: String,
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", require: true },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    images: [{
        public_id: String,
        secure_url: String
    }],
    commentOnId: { type: mongoose.Schema.Types.ObjectId, refPath: "onModel", require: true },
    onModel: {
        type: String,
        enum: Object.values(OnModelEnum)
    },
    isDeleted: { type: Boolean, default: false }, // Soft delete flag
    deletedAt: { type: Date, default: null } 
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })



commentsSchema.pre('find', function (next) {
    this.where({ isDeleted: false });
    next();
});
commentsSchema.virtual("NestedComments", {
    ref: "Comment",
    localField: "_id",
    foreignField: "commentOnId"
})

const Comment = mongoose.model.Comment || mongoose.model("Comment", commentsSchema)
export default Comment;