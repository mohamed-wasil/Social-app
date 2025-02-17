import Joi from "joi";
import { OnModelEnum } from "../Constants/constants.js";

export const commentSchema = {
    body: Joi.object({
        content: Joi.string(),
        tags: Joi.any(),
        iamges: Joi.any(),
        onModel: Joi.string().valid(OnModelEnum.COMMENT, OnModelEnum.POST).required()
    }),
    params: Joi.object({
        commentOnId: Joi.string().required()
    })
}