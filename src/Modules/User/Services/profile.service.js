import { compareSync, hashSync } from "bcrypt";
import { cloudinary } from "../../../Config/cloudinary.config.js";
import User from "../../../DB/Models/user.model.js";
import { nanoid } from "nanoid";
import sendEmail from "../../../Services/send-email.service.js";
import { Decryption } from "../../../Utils/encryption.utils.js";
import Requests from "../../../DB/Models/requests.model.js";
import Friends from "../../../DB/Models/friends.model.js";
import BlockedUsers from "../../../DB/Models/blocked-users.model.js";

/**
 * @async
 * @function uploadPicService
 * @description Uploads a profile picture for the logged-in user.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} req.loggedIn - Logged-in user data.
 * @param {string} req.loggedIn._id - ID of the logged-in user.
 * @param {Object} req.file - Uploaded file object.
 * @param {Object} res - Express response object.
 * 
 * @returns {Promise<Response>} - JSON response with a success message.
 * @throws {Error} - Throws an error if file upload fails.
 */

export const uploadPicService = async (req, res) => {
    const { _id } = req.loggedIn
    const { file } = req;

    if (!file) return res.status(401).json({ message: "No file uploaded" })

    const url = `${req.protocol}://${req.headers.host}/${file.path}`
    const user = await User.findByIdAndUpdate(_id, { profilePicture: url }, { new: true });

    res.status(201).json({ message: "Profile picture uploaded successfully" })
}
/**
 * @async
 * @function uploadCoverPicsService
 * @description Uploads multiple cover pictures for the logged-in user.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} req.loggedIn - Logged-in user data.
 * @param {string} req.loggedIn._id - ID of the logged-in user.
 * @param {Object[]} req.files - Array of uploaded file objects.
 * @param {Object} res - Express response object.
 * 
 * @returns {Promise<Response>} - JSON response with a success message.
 * @throws {Error} - Throws an error if file upload fails.
 */

export const uploadCoverPicsService = async (req, res) => {
    const { _id } = req.loggedIn
    const { files } = req;

    if (!files?.length) return res.status(401).json({ message: "files not uploaded" })

    const user = await User.findById(_id)
    const allCoverImages = user.coverPicture

    const images = files.map(file => `${req.protocol}://${req.headers.host}/${file.path}`)
    allCoverImages.push(...images)

    await User.updateOne({ _id }, { coverPicture: allCoverImages })
    res.status(201).json({ message: "Cover pictures uploaded successfully" })
}
/**
 * @async
 * @function uploudCloudProfile
 * @description Uploads a profile picture to cloud storage (Cloudinary).
 * 
 * @param {Object} req - Express request object.
 * @param {Object} req.loggedIn - Logged-in user data.
 * @param {string} req.loggedIn._id - ID of the logged-in user.
 * @param {Object} req.file - Uploaded file object.
 * @param {Object} res - Express response object.
 * 
 * @returns {Promise<Response>} - JSON response with a success message.
 * @throws {Error} - Throws an error if Cloudinary upload fails.
 */

export const uploudCloudProfile = async (req, res) => {
    const { _id } = req.loggedIn
    const { file } = req;

    if (!file) return res.status(401).json({ message: "No file uploaded" })

    const user = await User.findById(_id)
    const folderName = user.mediaCloudFolder || (user.mediaCloudFolder = nanoid(4))

    const { public_id, secure_url } = await cloudinary().uploader.upload(file.path, {
        folder: `${process.env.CLOUDINARY_FOLDER}/Users/${folderName}/Profile`,
    })
    user.profilePicture = { public_id, secure_url }

    await user.save()
    res.status(201).json({ message: "Profile uploaded success" })
}
/**
 * @async
 * @function uploadCloudCover
 * @description Uploads multiple cover images to cloud storage (Cloudinary).
 * 
 * @param {Object} req - Express request object.
 * @param {Object} req.loggedIn - Logged-in user data.
 * @param {string} req.loggedIn._id - ID of the logged-in user.
 * @param {Object[]} req.files - Array of uploaded file objects.
 * @param {Object} res - Express response object.
 * 
 * @returns {Promise<Response>} - JSON response with a success message.
 * @throws {Error} - Throws an error if Cloudinary upload fails.
 */

export const uploadCloudCover = async (req, res) => {
    const { files } = req
    const { _id } = req.loggedIn

    if (!files?.length) return res.status(401).json({ message: "Files Not Uploaded" })

    const user = await User.findById(_id)
    const userCovers = [...user.coverPicture]
    const folderName = user.mediaCloudFolder || (user.mediaCloudFolder = nanoid(4))

    for (const file of files) {
        const { public_id, secure_url } = await cloudinary().uploader.upload(file.path, {
            folder: `${process.env.CLOUDINARY_FOLDER}/Users/${folderName}/Covers`,
        })
        userCovers.push({ public_id, secure_url })
    }
    user.coverPicture = userCovers

    user.save()
    res.status(201).json({ message: "uploaded cover successfullly" })
}

/**
 * @async
 * @function deleteUserService
 * @description Deletes the logged-in user's account.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} req.loggedIn - Logged-in user data.
 * @param {string} req.loggedIn._id - ID of the user to delete.
 * @param {Object} res - Express response object.
 * 
 * @returns {Promise<Response>} - JSON response confirming account deletion.
 * @throws {Error} - Throws an error if the deletion fails.
 */


export const deleteUserService = async (req, res) => {
    const { _id } = req.loggedIn;

    const user = await User.findByIdAndDelete(_id)

    res.status(201).json({ message: "Deleted Account successfully" })

}
/**
 * @async
 * @function updateUserService
 * @description Updates the logged-in user's profile details.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} req.loggedIn - Logged-in user data.
 * @param {string} req.loggedIn._id - ID of the logged-in user.
 * @param {Object} req.body - Updated user details.
 * @param {string} [req.body.username] - New username.
 * @param {string} [req.body.email] - New email.
 * @param {string} [req.body.oldPassword] - Old password for verification.
 * @param {string} [req.body.newPassword] - New password.
 * @param {string} [req.body.confirmNewPassword] - Confirmation of new password.
 * @param {string} [req.body.phone] - New phone number.
 * @param {string} [req.body.gender] - Updated gender.
 * @param {number} [req.body.age] - Updated age.
 * @param {Object} res - Express response object.
 * 
 * @returns {Promise<Response>} - JSON response confirming the update.
 * @throws {Error} - Throws an error if validation fails or user already exists.
 */

export const updateUserService = async (req, res) => {
    const { _id } = req.loggedIn;
    const { username, email, oldPassword, newPassword, confirmNewPassword, phone, gender, age } = req.body;

    //Don't forget schema
    const user = await User.findById(_id);

    if (username) user.username = username
    if (email) {
        if (user.email == email) return res.status(402).json({ message: "Email is Samiler" })
        user.email = email;
        user.isVerified = false;

        //create otp and hashed it
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const hashedOtp = hashSync(otp, +process.env.SALT_ROUND)

        //send email verrify
        sendEmail.emit('sendEmail', {
            to: email,
            subject: "Verify your email",
            html: `<h3>Your Otp Is ${otp}</h3>`
        })
        user.confirmOtp = hashedOtp
    }
    if (oldPassword) {
        const iSPasswordMatched = compareSync(oldPassword, user.password)
        if (!iSPasswordMatched) return res.status(401).json({ message: "Invalid Old Password" })
        user.password = newPassword
    }
    if (phone) user.phone = phone;
    if (gender) user.gender = gender;
    if (age) user.age = age


    await user.save()
    res.status(201).json({ message: "Update Successfully" })
}
/**
 * @async
 * @function getUserService
 * @description Retrieves the logged-in user's profile information.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} req.loggedIn - Logged-in user data.
 * @param {string} req.loggedIn._id - ID of the logged-in user.
 * @param {Object} res - Express response object.
 * 
 * @returns {Promise<Response>} - JSON response containing user details.
 * @throws {Error} - Throws an error if user retrieval fails.
 */

export const getUserService = async (req, res) => {
    const { _id } = req.loggedIn

    const user = await User.findById(_id, "-password -__v")
    user.phone = await Decryption({ cipher: user.phone })


    res.status(201).json({ message: "success", user })

}
/**
 * @async
 * @function getSpecificUserService
 * @description Retrieves a specific user's profile and their posts.
 * 
 * @param {Object} req - Express request object.
 * @param {string} req.params.userId - ID of the user to fetch.
 * @param {Object} res - Express response object.
 * 
 * @returns {Promise<Response>} - JSON response containing user details.
 * @throws {Error} - Throws an error if the user is not found.
 */

export const getSpecificUserService = async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId).populate("Posts");
    if (!user) return res.status(400).json({ message: "user not found!" })

    res.status(201).json({ message: "success", user })

}
/**
 * @async
 * @function sendFriendRequestService
 * @description Sends a friend request to another user.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} req.loggedIn - Logged-in user data.
 * @param {string} req.loggedIn._id - ID of the user sending the request.
 * @param {string} req.params.requestTo - ID of the user to receive the request.
 * @param {Object} res - Express response object.
 * 
 * @returns {Promise<Response>} - JSON response confirming the friend request.
 * @throws {Error} - Throws an error if the request was already sent.
 */


export const sendFriendRequestService = async (req, res) => {
    const { _id } = req.loggedIn;
    const { requestTo } = req.params;


    const user = await User.findById(requestTo)
    if (!user) return res.status(409).json({ message: 'User not found' })


    const isFriend = await Friends.findOne({ userId: _id, friends: { $in: [requestTo] } })
    if (isFriend) return res.status(401).json({ message: "already friends" })

    const requstExist = await Requests.findOne({ requestsBy: _id })

    if (requstExist) {
        if (requstExist.pendings.includes(requestTo)) return res.status(401).json({ message: "Reques was sent before" })
        await requstExist.pendings.push(requestTo)
        await requstExist.save()
    } else {
        const newRequests = new Requests({
            requestsBy: _id,
            pendings: [requestTo]
        })
        await newRequests.save()
    }
    res.status(201).json({ message: "Send requset successfully" })
}
/**
 * @async
 * @function acceptFriensRequestService
 * @description Accepts a pending friend request.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} req.loggedIn - Logged-in user data.
 * @param {string} req.loggedIn._id - ID of the user accepting the request.
 * @param {string} req.params.requestFromId - ID of the user who sent the request.
 * @param {Object} res - Express response object.
 * 
 * @returns {Promise<Response>} - JSON response confirming the request acceptance.
 * @throws {Error} - Throws an error if the request does not exist.
 */

export const acceptFriensRequestService = async (req, res) => {
    const { _id } = req.loggedIn;
    const { requestFromId } = req.params;

    const isRequestExist = await Requests.findOne({ requestsBy: requestFromId, pendings: { $in: [_id] } });

    if (!isRequestExist) return res.status(404).json({ message: "Request not found" });


    const request = await Requests.findOneAndUpdate({ requestsBy: requestFromId, pendings: { $in: [_id] } }, {
        $pull: { pendings: _id }
    }, { new: true })

    if (!request?.pendings?.length) await Requests.findByIdAndDelete(request?._id)
    const addFriend = async (userId, friendId) => {
        const isFriends = await Friends.findOne({ userId })
        if (isFriends) {
            if (isFriends?.friends.includes(friendId)) return true
            await isFriends?.friends.push(friendId)
            await isFriends.save()
        } else {
            const newFriend = new Friends({
                userId,
                friends: [friendId]
            })
            await newFriend.save();
        }
    }

    const ownerUser = await addFriend(_id, requestFromId)// user who accept req 
    if (ownerUser) return res.status(401).json({ message: "User already friends" })
    await addFriend(requestFromId, _id) // user who send req

    res.status(201).json({ message: "Request friends accepted" })
}

export const deleteFriendService = async (req, res) => {
    const { _id: userId } = req.loggedIn;
    const { friendId } = req.params;


    // Remove friend from user's list
    const userFriend = await Friends.findOneAndUpdate(
        { userId, friends: friendId },
        { $pull: { friends: friendId } },
        { new: true }
    );

    // Remove user from friend's list
    const anotherFriend = await Friends.findOneAndUpdate(
        { userId: friendId, friends: userId },
        { $pull: { friends: userId } },
        { new: true }
    );

    if (!userFriend && !anotherFriend) {
        return res.status(404).json({ message: "Friendship not found" });
    }

    res.status(200).json({ message: "Friend deleted successfully" });
}
/**
 * @function listuserFriends
 * @description Retrieves the list of friends for the logged-in user.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} req.loggedIn - The logged-in user.
 * @param {string} req.loggedIn._id - The ID of the logged-in user.
 * @param {string} req.loggedIn.username - The username of the logged-in user.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response containing the list of friends and user details.
 */

export const listuserFriends = async (req, res) => {
    const { _id, username } = req.loggedIn;
    const friends = await Friends.findOne({ userId: _id })
        .populate([
            {
                path: "friends",
                select: "username"
            }
        ]).select("friends -_id")
    res.status(201).json({ message: 'success', friends, user: { _id, username } })
}
/**
 * @function blockUserService
 * @description Blocks a user by their email address.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} req.loggedIn - The logged-in user.
 * @param {string} req.loggedIn._id - The ID of the logged-in user.
 * @param {Object} req.params - Request parameters.
 * @param {string} req.params.email - The email of the user to be blocked.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response indicating the status of the blocking operation.
 */

export const blockUserService = async (req, res) => {
    const { _id } = req.loggedIn;
    const { email } = req.params;

    const userIsExist = await User.findOne({ email })
    if (!userIsExist) return res.status(201).json({ message: 'User not found' })

    const blockedUser = await BlockedUsers.findOne({ userId: _id })
    if (blockedUser) {
        if (blockedUser.usersBlocked.includes(userIsExist._id)) return res.status(201).json({ message: 'You blocked this user before' })
        await blockedUser.usersBlocked.push(userIsExist._id)
        await blockedUser.save()

    } else {
        const newBlockedUaser = new BlockedUsers({
            userId: _id,
            usersBlocked: [userIsExist._id]
        })
        await newBlockedUaser.save()
    }
    return res.status(201).json({ message: 'Blocked User Successfully' })
}
/**
 * @function unBlockUserService
 * @description Unblocks a previously blocked user by their email address.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} req.loggedIn - The logged-in user.
 * @param {string} req.loggedIn._id - The ID of the logged-in user.
 * @param {Object} req.params - Request parameters.
 * @param {string} req.params.email - The email of the user to be unblocked.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response indicating the status of the unblock operation.
 */

export const unBlockUserService = async (req, res) => {
    const { _id } = req.loggedIn;
    const { email } = req.params;

    const userIsExist = await User.findOne({ email })
    if (!userIsExist) return res.status(201).json({ message: 'User not found' })

    const deleteBlock = await BlockedUsers.findOneAndUpdate({ userId: _id, usersBlocked: { $in: userIsExist._id } },
        {
            $pull: { usersBlocked: userIsExist._id }
        }, { new: true }
    )
    return res.status(201).json({ message: 'Block deleted Successfully', deleteBlock })
}