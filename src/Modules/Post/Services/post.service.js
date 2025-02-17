import ArchivePost from "../../../DB/Models/archive-posts.model.js";
import BlockedUsers from "../../../DB/Models/blocked-users.model.js";
import HiddenPosts from "../../../DB/Models/hidden-posts.model.js";
import Post from "../../../DB/Models/post.model.js";
import SavedPosts from "../../../DB/Models/saved-posts.model.js";
import User from "../../../DB/Models/user.model.js";
import { checkImagesAndUpload } from "../../../Utils/check-images-and-upload.js";
import { pagination } from "../../../Utils/pagination.utils.js";

/**
 * Create a new post for the logged-in user
 * @async
 * @function addPostService
 * @param {Object} req - Express request object
 * @param {Object} req.loggedIn - Logged-in user data
 * @param {string} req.loggedIn._id - ID of the logged-in user creating the post
 * @param {Object} req.body - Request body containing post details
 * @param {string} req.body.title - Title of the post
 * @param {string} req.body.desc - Description of the post
 * @param {string[]} req.body.tags - Tags associated with the post
 * @param {boolean} req.body.allowComments - Whether comments are allowed on the post
 * @param {Object} req.files - Uploaded files (images for the post)
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response containing the created post
 * @throws {Error} - Throws an error if post creation fails
 * @description Creates a new post with the given title, description, tags, and images.
 * - Calls `checkImagesAndUpload` to process and upload images.
 * - Saves the post in the `Post` collection.
 * - Returns `201 - Post added successfully` with the created post.
 */

export const addPostService = async (req, res) => {

    const { _id: ownerId } = req.loggedIn;
    const { title, desc, tags, allowComments } = req.body
    const postObject = {
        title,
        desc,
        ownerId,
        allowComments,
        tags
    }
    postObject.images = await checkImagesAndUpload(ownerId, req.files, "Posts")
    const post = await Post.create(postObject)

    res.status(201).json({ message: "Post added successfully", post })
}

/**
 * List all posts excluding hidden posts and blocked users' posts
 * @async
 * @api /post/create
 * @param {Object} req - Express request object
 * @param {Object} req.loggedIn - Logged-in user data
 * @param {string} req.loggedIn._id - ID of the logged-in user
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response containing the list of posts
 * @throws {Error} - Throws an error if database queries fail
 * @description Fetches all posts from all users, excluding:
 * - Posts hidden by the logged-in user
 * - Posts from users who have blocked the logged-in user
 */

export const listPostsServices = async (req, res) => {
    const { _id } = req.loggedIn

    const hiddenPosts = await HiddenPosts.find({ userId: _id }).select("postId");
    const hiddenPostIds = hiddenPosts ? hiddenPosts.map(post => post.postId) : [];


    const blockedUser = await BlockedUsers.findOne({ usersBlocked: { $in: [_id] } })
    const posts = await Post.find({ _id: { $nin: hiddenPostIds }, ownerId: { $ne: blockedUser?.userId } }).sort({ createdAt: -1 }).populate("Comments").populate([
        {
            path: "Reacts",
            populate: [{ path: "ownerId", select: "username  -_id" }]
        }
    ]).sort({ createdAt: -1 })
    res.status(201).json({ message: "success", posts })
}
/**
 * Delete a post owned by the logged-in user
 * @async
 * @api /post/delete-post/:postId
 * @param {Object} req - Express request object
 * @param {Object} req.loggedIn - Logged-in user data
 * @param {string} req.loggedIn._id - ID of the logged-in user (owner of the post)
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.postId - ID of the post to be deleted
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response with success message and deleted post data
 * @throws {Error} - Throws an error if the post is not found or the deletion fails
 * @description Deletes a post if the logged-in user is the owner.  
 * - Returns a 409 status if the post is not found.  
 * - Returns a 201 status with the deleted post data on success.
 */

export const deletePostService = async (req, res) => {
    const { _id: ownerId } = req.loggedIn;
    const { postId } = req.params;

    const post = await Post.findOneAndDelete({ _id: postId, ownerId });
    if (!post) return res.status(409).json({ message: "Post not found" });

    res.status(201).json({ message: "Post deleted successfully" })
}
/**
 * Edit a post owned by the logged-in user
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.loggedIn - Logged-in user data
 * @param {string} req.loggedIn._id - ID of the logged-in user (post owner)
 * @param {Object} req.body - Request body containing post update data
 * @param {string} [req.body.title] - New title for the post (optional)
 * @param {string} [req.body.desc] - New description for the post (optional)
 * @param {string[]} [req.body.tags] - Updated list of tags for the post (optional)
 * @param {boolean} [req.body.allowComments] - Flag to allow or disable comments (optional)
 * @param {Object} req.files - Uploaded files containing images (optional)
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.postId - ID of the post to be edited
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response with success message and updated post data
 * @throws {Error} - Throws an error if the post is not found or update fails
 * @description Updates a post's details if the logged-in user is the owner.  
 * - Returns a 409 status if the post is not found.  
 * - Updates images if new files are uploaded.  
 * - Updates title, description, tags, and comment settings if provided.  
 * - Saves and returns the updated post with a 201 status.
 */

export const editPostService = async (req, res) => {
    const { _id: ownerId } = req.loggedIn;
    const { title, desc, tags, allowComments } = req.body
    const { files } = req
    const { postId } = req.params;

    const post = await Post.findOne({ _id: postId, ownerId });
    if (!post) return res.status(409).json({ message: "Post not found" });

    if (files) post.images = await checkImagesAndUpload(ownerId, files, "Post");
    if (title) post.title = title;
    if (desc) post.desc = desc;
    if (allowComments) post.allowComments = allowComments
    post.tags = tags;

    await post.save()

    res.status(201).json({ message: "Post updated successfully", post });
}

/**
 * Get posts of a specific user
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.userId - ID of the user whose posts are being retrieved
 * @param {Object} req.loggedIn - Logged-in user data
 * @param {string} req.loggedIn._id - ID of the logged-in user
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response containing the user's posts
 * @throws {Error} - Throws an error if the user is not found, the account is private, or the posts are blocked/hidden
 * @description Fetches posts of a specific user while considering:
 * - Returns `409 - User not found` if the user does not exist.
 * - Returns `400 - Account is private` if the user has a private account.
 * - Excludes posts hidden by the logged-in user.
 * - Returns `409 - Not Posts found!` if the logged-in user is blocked by the target user.
 * - Returns `409 - Not posts yet` if the user has no posts.
 * - Populates `Comments` and `Reacts` data.
 * - Returns `201 - Posts fetched successfully` with the posts.
 */

export const getUserPostsService = async (req, res) => {
    const { userId } = req.params;
    const { _id } = req.loggedIn

    const user = await User.findById(userId)
    if (!user) return res.status(409).json({ message: "User not found" })

    if (!user.isPublic) return res.status(400).json({ message: "Account is private" })

    const hiddenPosts = await HiddenPosts.find({ userId: _id }).select("postId");
    const hiddenPostIds = hiddenPosts ? hiddenPosts.map(post => post.postId) : [];

    const blockedUser = await BlockedUsers.findOne({ userId, usersBlocked: { $in: [_id] } })
    if (blockedUser) return res.status(409).json({ message: "Not Posts found!" })


    const userPosts = await Post.find({ ownerId: userId, _id: { $nin: hiddenPostIds } }).populate([
        {
            path: "Comments",
            populate: [{ path: "commentOnId" }]
        },
        {
            path: "Reacts",
            select: "reactType"
        }
    ]).sort({ createdAt: -1 })
    if (!userPosts.length) return res.status(409).json({ message: "Not posts yet" })

    res.status(201).json({ message: "Posts fetched successfully", userPosts })
}
/**
 * Get posts of the logged-in user
 * @async
 * @function getMyPostService
 * @param {Object} req - Express request object
 * @param {Object} req.loggedIn - Logged-in user data
 * @param {string} req.loggedIn._id - ID of the logged-in user
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response containing the user's posts
 * @throws {Error} - Throws an error if the user has no posts
 * @description Fetches all posts created by the logged-in user.
 * - Returns `409 - Not posts yet` if the user has no posts.
 * - Populates `Comments` and its `commentOnId` field.
 * - Returns `201 - success` with the user's posts.
 */

export const getMyPostService = async (req, res) => {
    const { _id } = req.loggedIn;

    const userPosts = await Post.find({ ownerId: _id }).populate([
        {
            path: "Comments",
            populate: [{ path: "commentOnId" }]
        }
    ]).sort({ createdAt: -1 })
    if (!userPosts.length) if (!userPosts.length) return res.status(409).json({ message: "Not posts yet" })

    res.status(201).json({ message: "success", userPosts })
}
/**
 * Hide a post for a specific user
 * @async
 * @function hidePostService
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.userId - ID of the user hiding the post
 * @param {string} req.params.postId - ID of the post to be hidden
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response confirming the post has been hidden
 * @throws {Error} - Throws an error if the operation fails
 * @description Hides a post for a specific user by adding an entry to the `HiddenPosts` collection.
 * - Uses `findOneAndUpdate` with `upsert: true` to create the hidden post if it does not exist.
 * - Returns `201 - Hide post successfully` on success.
 */

export const hidePostService = async (req, res) => {
    const { userId, postId } = req.params;

    // const postIsExist = await HiddenPosts.findOne({ userId, postId })
    // if (postIsExist) return res.status(409).json({ message: "Post is already hidden for this user" })
    // const hiddenPost = await HiddenPosts.create({ userId, postId })

    const hiddenPost = await HiddenPosts.findOneAndUpdate(
        { userId, postId },
        { userId, postId },
        { upsert: true, new: true } // if not exist create it
    );

    // if (hiddenPost) return res.status(409).json({ message: "Post is already hidden for this user" })

    res.status(201).json({ message: "Hide post successfully" })
}
/**
 * Unhide a post for a specific user
 * @async
 * @function unHidePostsService
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.userId - ID of the user un-hiding the post
 * @param {string} req.params.postId - ID of the post to be unhidden
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response confirming the post has been unhidden
 * @throws {Error} - Throws an error if the operation fails
 * @description Removes a hidden post entry from the `HiddenPosts` collection.
 * - Uses `findOneAndDelete` to remove the post from hidden posts.
 * - Returns `201 - Unhide post successfully` on success.
 */

export const unHidePostsService = async (req, res) => {
    const { userId, postId } = req.params;
    const unHiddenPost = await HiddenPosts.findOneAndDelete(
        { userId, postId },
        { upsert: true, new: true } // if not exist create it
    );
    res.status(201).json({ message: "Unhide post successfully" })
}
/**
 * Save a post for the logged-in user
 * @async
 * @function savePostService
 * @param {Object} req - Express request object
 * @param {Object} req.loggedIn - Logged-in user data
 * @param {string} req.loggedIn._id - ID of the logged-in user saving the post
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.postId - ID of the post to be saved
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response confirming the post has been saved
 * @throws {Error} - Throws an error if the operation fails
 * @description Saves a post for the logged-in user by adding it to the `SavedPosts` collection.
 * - Uses `findOneAndUpdate` with `upsert: true` to create the saved post if it does not exist.
 * - Returns `201 - post saved successfully` on success.
 */

export const savePostService = async (req, res) => {
    const { _id: userId } = req.loggedIn;
    const { postId } = req.params;

    const post = await Post.findById(postId)
    if (!post) return res.status(409).json({ message: "Not Post found" })

    const savePost = await SavedPosts.findOneAndUpdate({ postId, userId }, { postId, userId }, { upsert: true, new: true })
    res.status(201).json({ message: "post saved successfully" })

}
/**
 * Unsave a post for the logged-in user
 * @async
 * @function unSavePostService
 * @param {Object} req - Express request object
 * @param {Object} req.loggedIn - Logged-in user data
 * @param {string} req.loggedIn._id - ID of the logged-in user unsaving the post
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.postId - ID of the post to be unsaved
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response confirming the post has been unsaved
 * @throws {Error} - Throws an error if the operation fails
 * @description Removes a saved post for the logged-in user by deleting it from the `SavedPosts` collection.
 * - Uses `findOneAndDelete` to remove the saved post entry.
 * - Returns `201 - post unsaved successfully` on success.
 */

export const unSavePostService = async (req, res) => {
    const { _id: userId } = req.loggedIn;
    const { postId } = req.params;

    const post = await Post.findById(postId)
    if (!post) return res.status(409).json({ message: "Invalid post ID" })

    const savePost = await SavedPosts.findOneAndDelete({ postId, userId }, { postId, userId }, { upsert: true, new: true })
    res.status(201).json({ message: "post unsaved successfully" })
}
/**
 * Get all saved posts for the logged-in user
 * @async
 * @function getSavedPostsService
 * @param {Object} req - Express request object
 * @param {Object} req.loggedIn - Logged-in user data
 * @param {string} req.loggedIn._id - ID of the logged-in user retrieving saved posts
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response containing the saved posts
 * @throws {Error} - Throws an error if no saved posts are found
 * @description Fetches all posts saved by the logged-in user from the `SavedPosts` collection.
 * - Returns `409 - no posts saved yet` if the user has not saved any posts.
 * - Returns `201 - success` with the list of saved posts on success.
 */

export const getSavedPostsServcie = async (req, res) => {
    const { _id: userId } = req.loggedIn;
    const savedPosts = await SavedPosts.find({ userId }).sort({ createdAt: -1 })
    if (!savedPosts) return res.status(409).json({ message: "no posts saved yet" })

    res.status(201).json({ message: "success", savedPosts })
}
/**
 * Archive a post for the logged-in user
 * @async
 * @function archivePostService
 * @param {Object} req - Express request object
 * @param {Object} req.loggedIn - Logged-in user data
 * @param {string} req.loggedIn._id - ID of the logged-in user archiving the post
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.postId - ID of the post to be archived
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response confirming the post has been archived
 * @throws {Error} - Throws an error if the post is already archived
 * @description Archives a post for the logged-in user by adding it to the `ArchivePost` collection.
 * - If the user already has archived posts, the post ID is added to the list if not already present.
 * - If the post is already archived, returns `401 - This post already archived`.
 * - If the user has no archived posts, a new archive entry is created.
 * - Returns `201 - Archive post successfully` on success.
 */

export const archivePostService = async (req, res) => {
    const { _id: userId } = req.loggedIn;
    const { postId } = req.params;

    const archivedPosts = await ArchivePost.findOne({ userId })
    if (archivedPosts) {
        if (archivedPosts?.archivePosts?.includes(postId)) return res.status(401).json({ message: "This post already archived" })

        await archivedPosts.archivePosts.push(postId)
        await archivedPosts.save()

    } else {
        const newArchivedPost = new ArchivePost({ userId, archivePosts: [postId] })
        await newArchivedPost.save()
    }

    res.status(201).json({ message: "Archive post successfully" })
}
/**
 * @function listArchivePost
 * @description Retrieves a user's archived posts, deletes expired archived posts (older than 24 hours), and removes them from the Post collection.
 * @async
 * @param {Object} req - Express request object.
 * @param {Object} req.loggedIn - Logged-in user information.
 * @param {string} req.loggedIn._id - User's unique ID.
 * @param {Object} res - Express response object.
 * @returns {Promise<void>} Sends a JSON response containing the list of archived posts or an error message.
 * 
 */

export const listArchivePost = async (req, res) => {
    const { _id: userId } = req.loggedIn;

    let archiveData = await ArchivePost.findOne({ userId })
        .select("archivePosts -_id")
        .populate("archivePosts");

    if (!archiveData || !archiveData.archivePosts.length) {
        return res.status(404).json({ message: "No archived posts found" });
    }

    const currentTime = new Date();
    const twentyFourHoursAgo = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);

    const validPosts = [];
    for (const post of archiveData.archivePosts) {
        if (new Date(post.archivedAt) < twentyFourHoursAgo) {
            await Post.findByIdAndDelete(post.postId);
        } else {
            validPosts.push(post);
        }
    }

    if (validPosts.length !== archiveData.archivePosts.length) {
        archiveData.archivePosts = validPosts;
        await archiveData.save();
    }

    return res.status(200).json({
        message: "Fetched archived posts successfully",
        archivePosts: validPosts
    });
};

/**
 * Remove a post from the archive for the logged-in user
 * @async
 * @function deleteArchivePostService
 * @param {Object} req - Express request object
 * @param {Object} req.loggedIn - Logged-in user data
 * @param {string} req.loggedIn._id - ID of the logged-in user
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.postId - ID of the post to be removed from the archive
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response confirming the post has been removed from the archive
 * @throws {Error} - Throws an error if the operation fails
 * @description Removes a post from the user's archive in the `ArchivePost` collection.
 * - Uses `findOneAndUpdate` with `$pull` to remove the post ID from the archived posts array.
 * - Returns `201 - Post deleted from archive successfully` on success.
 */

export const deleteArchivePostService = async (req, res) => {
    const { _id: userId } = req.loggedIn;
    const { postId } = req.params;

    const archivedPosts = await ArchivePost.findOneAndUpdate({ userId, archivePosts: { $in: postId } },
        {
            $pull: { archivePosts: postId }
        }, { new: true }
    )

    res.status(201).json({ message: "Post deleted from archive successfully" })
}