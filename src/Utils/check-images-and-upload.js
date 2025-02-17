import { nanoid } from "nanoid"
import { cloudinary } from "../Config/cloudinary.config.js"
import User from "../DB/Models/user.model.js"

/**
 * Uploads images to Cloudinary and associates them with a user.
 * @async
 * @function checkImagesAndUpload
 * @param {string} ownerId - The ID of the user who owns the images
 * @param {Array<Object>} files - An array of file objects to be uploaded
 * @param {string} processFolderName - The folder name where images should be stored in Cloudinary
 * @returns {Promise<Array<{ public_id: string, secure_url: string }>>} - An array of uploaded image details
 * @throws {Error} - Throws an error if image upload fails
 * @description 
 * - Retrieves the user from the database using `ownerId`.
 * - Assigns a unique media folder if the user doesn't have one.
 * - Uploads each image file to Cloudinary under the specified folder.
 * - Saves the user's media folder information if newly created.
 * - Returns an array of uploaded images with their `public_id` and `secure_url`.
 */

export const checkImagesAndUpload = async (ownerId, files, processFolderName) => {
    if (files?.length) {
        const user = await User.findById(ownerId)
        let postImages = []

        const folderName = user.mediaCloudFolder || (user.mediaCloudFolder = nanoid(4))

        for (const file of files) {
            const { public_id, secure_url } = await cloudinary().uploader.upload(file.path, {
                folder: `${process.env.CLOUDINARY_FOLDER}/${processFolderName}/${folderName}`,
            })
            postImages.push({ public_id, secure_url })
        }
        await user.save()
        return postImages
    }
}