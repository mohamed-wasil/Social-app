
import Post from "../../../DB/Models/post.model.js";
import Comment from "../../../DB/Models/comment.model.js";
import { checkImagesAndUpload } from "../../../Utils/check-images-and-upload.js";

/**
 * @function addCommentServices
 * @description Adds a comment to a post or another comment.
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} req.loggedIn - Logged-in user data.
 * @param {string} req.loggedIn._id - ID of the logged-in user (comment owner).
 * @param {Object} req.body - Request body containing comment details.
 * @param {string} req.body.content - Content of the comment.
 * @param {string[]} [req.body.tags] - Optional tags associated with the comment.
 * @param {string} req.body.onModel - The type of entity the comment is associated with (either "Post" or "Comment").
 * @param {Object} req.params - Request parameters.
 * @param {string} req.params.commentOnId - ID of the post or comment being commented on.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<Response>} - JSON response containing the newly created comment.
 * @throws {Error} - Returns a `400` status if the post does not allow comments or if the target comment does not exist.
 **/
export const addCommentServices = async (req, res, next) => {
    const { _id: ownerId } = req.loggedIn;
    const { content, tags, onModel } = req.body
    const { commentOnId } = req.params

    // to equll onMOdel Enum (Post , Comment)
    const firstChar = onModel?.charAt(0).toUpperCase()
    const secondChars = onModel?.slice(1,).toLowerCase()
    const capitalizedWord = firstChar + secondChars

    const commentObject = { content, tags, onModel: capitalizedWord }
    commentObject.images = await checkImagesAndUpload(ownerId, req.files, "Comments")

    if (capitalizedWord == "Post") {
        const post = await Post.findOne({ _id: commentOnId, allowComments: true })
        if (!post) return res.status(400).json({ mesage: "Post not found or comments are't allowed in this post" })
    } else if (capitalizedWord == "Comment") {
        const comment = await Comment.findOne({ _id: commentOnId })
        if (!comment) return res.status(400).json({ mesage: "comment not found" })
    }
    commentObject.commentOnId = commentOnId;
    commentObject.ownerId = ownerId
    commentObject.onModel = capitalizedWord;

    const comment = await Comment.create(commentObject)
    res.status(201).json({ message: "comment added successfully", comment })
}
/**
 * @function listCommentsService
 * @description Retrieves all comments from the database, including nested comments, sorted by creation date (newest first).
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Promise<Response>} - JSON response containing the list of comments.
 * @throws {Error} - Returns an error if retrieving comments fails.
 **/
export const listCommentsService = async (req, res, next) => {
    const comments = await Comment.find().populate("NestedComments").sort({ createdAt: -1 })
    res.status(201).json({ message: "success", comments })
}
/**
 * @function editCommentService
 * @description Edits an existing comment if the logged-in user is the owner.
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} req.loggedIn - Logged-in user data.
 * @param {string} req.loggedIn._id - ID of the logged-in user.
 * @param {Object} req.params - Request parameters.
 * @param {string} req.params.commentId - ID of the comment to be edited.
 * @param {Object} req.body - Request body containing updated comment details.
 * @param {string} [req.body.content] - Updated content of the comment.
 * @param {string[]} [req.body.tags] - Updated tags for the comment.
 * @param {Object} res - Express response object.
 * @returns {Promise<Response>} - JSON response confirming the comment update.
 * @throws {Error} - Returns a `201` status with an error message if the comment is not found.
 */

export const editCommentService = async (req, res) => {
    const { _id } = req.loggedIn;
    const { commentId } = req.params;
    const { content, tags } = req.body

    const comment = await Comment.findOne({ _id: commentId, ownerId: _id })

    if (!comment) return res.status(201).json({ message: "Comment Not Founded" })

    if (content) comment.content = content;

    if (req?.files?.length) comment.images = await checkImagesAndUpload(_id, req.files, "Comments")

    comment.tags = tags

    await comment.save()

    res.status(201).json({ message: "Comment updated successfully", comment })
}