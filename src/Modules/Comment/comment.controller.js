import { Router } from "express";
import * as commentServices from "./Services/comment.service.js"
import { authenticationMiddleware } from "../../Middlewares/authentication.middleware.js";
import { multerHostMiddleware } from "../../Middlewares/multer.middleware.js";
import { checkIfUserTagsExist } from "../../Middlewares/check-user-tags.middleware.js";
import { errorHandlerMiddleware } from "../../Middlewares/error-handler.middlewasre.js";
import { validationMiddleware } from "../../Middlewares/validation.middleware.js";
import { commentSchema } from "../../Validators/comment.schema.js";
export const commentController = Router()

commentController.post("/create/:commentOnId",
     authenticationMiddleware(),
    multerHostMiddleware().array("images", 5),
    // validationMiddleware(commentSchema),
    errorHandlerMiddleware(checkIfUserTagsExist()),
    errorHandlerMiddleware(commentServices.addCommentServices)
)
commentController.get("/get-comments",
     authenticationMiddleware(),
    errorHandlerMiddleware(commentServices.listCommentsService)
)
commentController.put("/edit-comment/:commentId",
    authenticationMiddleware(),
   multerHostMiddleware().array("images", 5),
   errorHandlerMiddleware(checkIfUserTagsExist()),
   errorHandlerMiddleware(commentServices.editCommentService)
)