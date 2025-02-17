import mongoose from "mongoose";

const requestsSchema = new mongoose.Schema({
    requestsBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", require: true },
    pendings: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", require: true }],
}, { timestamps: true })

const Requests = mongoose.model.Requests || mongoose.model("Requests", requestsSchema)
export default Requests