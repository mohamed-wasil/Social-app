import { Router } from "express";
import * as userServices from "./Services/profile.service.js"
import * as chatServices from "./Services/chat.service.js"
import { errorHandlerMiddleware } from "../../Middlewares/error-handler.middlewasre.js";
import { multerHostMiddleware } from "../../Middlewares/multer.middleware.js";
import { authenticationMiddleware } from "../../Middlewares/authentication.middleware.js";
import { validationMiddleware } from "../../Middlewares/validation.middleware.js";
import { getUserSchema, updateUserInfoSchema } from "../../Validators/user.schema.js";
export const userController = Router()

// userController.patch('/upload-profile',
//     multerLocalMiddleware("user/profile").single('image'),
//     authenticationMiddleware(),
//     errorHandlerMiddleware(userServices.uploadPicService)
// )
// userController.patch('/upload-cover',
//     multerLocalMiddleware("user/profile").array('cover', 4),
//     authenticationMiddleware(),
//     errorHandlerMiddleware(userServices.uploadCoverPicsService)
// )
userController.patch('/uploud-cloud-profile',
    authenticationMiddleware(),
    multerHostMiddleware().single("profile"),
    errorHandlerMiddleware(userServices.uploudCloudProfile)
)
userController.patch('/uploud-cloud-cover',
    authenticationMiddleware(),
    multerHostMiddleware().array("cover", 3),
    errorHandlerMiddleware(userServices.uploadCloudCover)
)

userController.delete('/delete_account',
    authenticationMiddleware(),
    errorHandlerMiddleware(userServices.deleteUserService)
)
userController.put('/update-personal-info',
    authenticationMiddleware(),
    validationMiddleware(updateUserInfoSchema),
    errorHandlerMiddleware(userServices.updateUserService)
)
userController.get('/get-user',
    authenticationMiddleware(),
    errorHandlerMiddleware(userServices.getUserService)
)
userController.get('/get-specific-user/:userId',
    authenticationMiddleware(),
    validationMiddleware(getUserSchema),
    errorHandlerMiddleware(userServices.getSpecificUserService)
)
userController.post('/send-friend-request/:requestTo',
    authenticationMiddleware(),
    errorHandlerMiddleware(userServices.sendFriendRequestService)
)
userController.post('/accept-friend-request/:requestFromId',
    authenticationMiddleware(),
    errorHandlerMiddleware(userServices.acceptFriensRequestService)
)
userController.delete('/delete-friend/:friendId',
    authenticationMiddleware(),
    errorHandlerMiddleware(userServices.deleteFriendService)
)
userController.get('/list-friends',
    authenticationMiddleware(),
    errorHandlerMiddleware(userServices.listuserFriends)
)
userController.get('/get-chat-history/:receiverId',
    authenticationMiddleware(),
    errorHandlerMiddleware(chatServices.getChatServices)
)
userController.delete('/delete-chat-history/:receiverId',
    authenticationMiddleware(),
    errorHandlerMiddleware(chatServices.deleteChatHistoryServicve)
)
userController.post('/block-user/:email',
    authenticationMiddleware(),
    errorHandlerMiddleware(userServices.blockUserService)
)
userController.delete('/delete-block-user/:email',
    authenticationMiddleware(),
    errorHandlerMiddleware(userServices.unBlockUserService)
)