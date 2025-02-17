import Joi from "joi";

export const postSchema = {
    body: Joi.object({
        title: Joi.string().required(),
        desc: Joi.string(),
        allowComments: Joi.boolean(),
        tags: Joi.any(),
        images: Joi.any()
    })
}