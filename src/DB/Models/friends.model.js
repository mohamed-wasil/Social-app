import mongoose from "mongoose";

const friendsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", require: true },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", require: true }],
}, { timestamps: true })


friendsSchema.post("findOneAndUpdate", async function (doc) {

    if (!doc?.friends?.length) await Friends.deleteOne({ _id: doc?._id })
});



const Friends = mongoose.model.Friends || mongoose.model("Friends", friendsSchema)
export default Friends