import mongoose from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../Constants/constants.js";
import { hashSync } from "bcrypt";
import { Decryption, Encryption } from "../../Utils/encryption.utils.js";
import { cloudinary } from "../../Config/cloudinary.config.js";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        require: true,
    },
    email: {
        type: String,
        unique: true,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    phone: String,
    DOB: String,
    gender: {
        type: String,
        enum: Object.values(GenderEnum),
        default: GenderEnum.NOT_SPECIFIED
    },
    role: {
        type: String,
        enum: Object.values(RoleEnum),
        default: RoleEnum.USER
    },
    isDeactivated: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    mediaCloudFolder: String,
    profilePicture: {
        public_id: String,
        secure_url: String
    },
    coverPicture: [{
        public_id: String,
        secure_url: String
    }],
    confirmOtp: String,
    forgetOtp: String,
    provider: {
        type: String,
        enum: Object.values(ProviderEnum),
        default: ProviderEnum.SYSTEM
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    isDeleted: { type: Boolean, default: false }, // Soft delete flag
    deletedAt: { type: Date, default: null }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

userSchema.pre('find', function (next) {
    this.where({ isDeleted: false });
    next();
});

userSchema.virtual("Posts", {
    ref: "Post",
    localField: "_id",
    foreignField: "ownerId"
})

userSchema.pre("save", async function () {

    const changes = this.getChanges()["$set"]

    if (changes?.password) this.password = hashSync(this.password, +process.env.SALT_ROUND)
    if (changes?.phone) this.phone = await Encryption({ value: this.phone })
    if (changes?.confirmOtp) this.confirmOtp = hashSync(this.confirmOtp, +process.env.SALT_ROUND)
})
userSchema.pre("updateOne", async function () {

    const changes = this.getUpdate()
    if (changes?.password) changes.password = hashSync(changes.password, +process.env.SALT_ROUND)
    if (changes?.phone) changes.phone = await Encryption({ value: changes.phone })
    if (changes?.confirmOtp) changes.confirmOtp = hashSync(changes.confirmOtp, +process.env.SALT_ROUND)
})



userSchema.post('findOneAndDelete', async function (doc) {

    await cloudinary().api.delete_resources_by_prefix(`${process.env.CLOUDINARY_FOLDER}/Users/${doc.mediaCloudFolder}/Covers`)
    await cloudinary().api.delete_resources_by_prefix(`${process.env.CLOUDINARY_FOLDER}/Users/${doc.mediaCloudFolder}/Profile`)
    await cloudinary().api.delete_folder(`${process.env.CLOUDINARY_FOLDER}/Users/${doc.mediaCloudFolder}`)
})

const User = mongoose.model.User || mongoose.model("User", userSchema)
export default User;