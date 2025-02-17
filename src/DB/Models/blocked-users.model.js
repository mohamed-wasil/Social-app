import mongoose from "mongoose";

const blockedUserSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", require: true },
    usersBlocked: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", require: true }],
}, { timestamps: true });



blockedUserSchema.post("findOneAndUpdate", async function (doc) {    
    if (!doc?.usersBlocked?.length ) await BlockedUsers.deleteOne({ _id: doc._id })
})

const BlockedUsers = mongoose.model.BlockedUsers || mongoose.model('BlockedUsers', blockedUserSchema)
export default BlockedUsers;