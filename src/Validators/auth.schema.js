import Joi from "joi";
import { GenderEnum } from "../Constants/constants.js";

export const signUpSchema = {
    body: Joi.object({
        username: Joi.string().trim().required().messages({
            "string-base": "user name must be String",
            "any.required": "user name is required "
        }),
        email: Joi.string().email().required(),
        password: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*])[A-Za-z\d@$!%*]{8,}$/).messages({
            "string.pattern.base": "password must be at least 8 char long and contain one uppercase letter , one spical char ",
        }),
        confirmPassword: Joi.string().valid(Joi.ref("password")),
        phone: Joi.string().regex(/^01[0125]{1}[0-9]{8}/).messages({
            "string.pattern.base": "Accepted only egyption numbers "
        }),
        gender: Joi.string().valid(GenderEnum.MALE, GenderEnum.FEMALE, GenderEnum.NOT_SPECIFIED),
        DOB: Joi.string(),
        role: Joi.string(),
        age: Joi.string()

    })
}

export const confirmEmailSchema = {
    body: Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.string().required()
    })
}

export const signInSchema = {
    body: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    })
}

export const gmailAuthSchema = {
    body:{
        iidToken:Joi.string().token()
    }
}