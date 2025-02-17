import { Router } from "express";
import * as postServices from "./Services/post.service.js"
import { authenticationMiddleware } from "../../Middlewares/authentication.middleware.js";
import { errorHandlerMiddleware } from "../../Middlewares/error-handler.middlewasre.js";
import { multerHostMiddleware } from "../../Middlewares/multer.middleware.js";
import { checkIfUserTagsExist } from "../../Middlewares/check-user-tags.middleware.js";
import { validationMiddleware } from "../../Middlewares/validation.middleware.js";
import { postSchema } from "../../Validators/post.schema.js";
export const postController = Router({
    caseSensitive: true, //must be as api => link !=Link
    strict: true, //no more \  => add-post != add-post\
    mergeParams: true
});

postController.post("/create",
    authenticationMiddleware(),
    multerHostMiddleware().array("images", 5),
    validationMiddleware(postSchema),
    checkIfUserTagsExist(),
    errorHandlerMiddleware(postServices.addPostService)
)
postController.get("/get-posts",
    authenticationMiddleware(),
    errorHandlerMiddleware(postServices.listPostsServices)
)
postController.delete("/delete-post/:postId",
    authenticationMiddleware(),
    errorHandlerMiddleware(postServices.deletePostService)
)
postController.put("/update-post/:postId",
    authenticationMiddleware(),
    multerHostMiddleware().array("images", 5),
    checkIfUserTagsExist(),
    errorHandlerMiddleware(postServices.editPostService)
)
postController.get("/get-user-posts/:userId",
    authenticationMiddleware(),
    errorHandlerMiddleware(postServices.getUserPostsService)
)
postController.get("/get-personal-user-posts",
    authenticationMiddleware(),
    errorHandlerMiddleware(postServices.getMyPostService)
)
postController.post("/hide-post/:userId/:postId",
    authenticationMiddleware(),
    errorHandlerMiddleware(postServices.hidePostService)
)
postController.post("/unhide-post/:userId/:postId",
    authenticationMiddleware(),
    errorHandlerMiddleware(postServices.unHidePostsService)
)

postController.patch("/save-post/:postId",
    authenticationMiddleware(),
    errorHandlerMiddleware(postServices.savePostService)
)
postController.delete("/unsave-post/:postId",
    authenticationMiddleware(),
    errorHandlerMiddleware(postServices.unSavePostService)
)
postController.get("/get-save-post",
    authenticationMiddleware(),
    errorHandlerMiddleware(postServices.getSavedPostsServcie)
)
postController.post("/archive-posts/:postId",
    authenticationMiddleware(),
    errorHandlerMiddleware(postServices.archivePostService)
)
postController.get("/list-archive-posts",
    authenticationMiddleware(),
    errorHandlerMiddleware(postServices.listArchivePost)
)
postController.delete("/delete-archive-posts/:postId",
    authenticationMiddleware(),
    errorHandlerMiddleware(postServices.deleteArchivePostService)
)
