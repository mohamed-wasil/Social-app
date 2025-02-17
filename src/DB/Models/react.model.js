import mongoose from "mongoose";
import { OnModelEnum, Reacts } from "../../Constants/constants.js";

const reactScheam = new mongoose.Schema({
    reactOnId: { type: mongoose.Schema.Types.ObjectId, refPath: "onModel", require: true },
    onModel: {
        type: String,
        enum: Object.values(OnModelEnum)
    },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", require: true },
    reactType: {
        type: String,
        enum: Object.values(Reacts),
        default: Reacts.LIKE
    },
    isDeleted: { type: Boolean, default: false }, // Soft delete flag
    deletedAt: { type: Date, default: null }
}, { timestamps: true })

reactScheam.pre('find', function (next) {
    this.where({ isDeleted: false });
    next();
});
const React = mongoose.model.React || mongoose.model("React", reactScheam)
export default React;


