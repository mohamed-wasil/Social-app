import mongoose from "mongoose";

const archivePostsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", require: true },
    archivePosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post", require: true }]
}, { timestamps: true })



archivePostsSchema.post( "findOneAndUpdate" , async function (doc) {
    if(!doc?.archivePosts?.length) {
        await ArchivePost.deleteOne({_id:doc?._id})
    }
    
    
})

const ArchivePost = mongoose.model.ArchivePost || mongoose.model("ArchivePost", archivePostsSchema)
export default ArchivePost