import Joi from "joi";
import { GenderEnum } from "../Constants/constants.js";

//reset password
export const resetPasswordSchema = {
    body: Joi.object({
        newPassword: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*])[A-Za-z\d@$!%*]{8,}$/).messages({
            "string.pattern.base": "password must be at least 8 char long and contain one uppercase letter , one spical char ",
        }),
        confirmNewPassword: Joi.string().valid(Joi.ref("newPassword")),
        otp: Joi.string().required()
    })
}

export const updateUserInfoSchema = {
    body: Joi.object({
        username: Joi.string().trim().messages({
            "string-base": "user name must be String",
        }),
        email: Joi.string().email(),
        oldPassword: Joi.string(),
        newPassword: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*])[A-Za-z\d@$!%*]{8,}$/).messages({
            "string.pattern.base": "password must be at least 8 char long and contain one uppercase letter , one spical char ",
        }),
        confirmNewPassword: Joi.string().valid(Joi.ref("newPassword")),
        phone: Joi.string().regex(/^01[0125]{1}[0-9]{8}/).messages({
            "string.pattern.base": "Accepted only egyption numbers "
        }),
        gender: Joi.string().valid(GenderEnum.MALE, GenderEnum.FEMALE, GenderEnum.NOT_SPECIFIED),
        DOB: Joi.string(),
        age: Joi.string()
    }).with("newPassword", "oldPassword").with("newPassword", "confirmNewPassword").messages({
        "object.with": "oldPassword , newPassword , confirmNewPassword are requierd"
    })
}

export const getUserSchema = {
    params: Joi.object({
        userId: Joi.string().required()
    })
}