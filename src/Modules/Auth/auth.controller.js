import { Router } from "express";
import * as authServices from "./Services/authentication.service.js"
import { validationMiddleware } from "../../Middlewares/validation.middleware.js";
import { confirmEmailSchema, signInSchema, signUpSchema } from "../../Validators/auth.schema.js";
import { errorHandlerMiddleware } from "../../Middlewares/error-handler.middlewasre.js";
import { authenticationMiddleware } from "../../Middlewares/authentication.middleware.js";
import { resetPasswordSchema } from "../../Validators/user.schema.js";
export const authController = Router()


authController.post('/signup', validationMiddleware(signUpSchema), errorHandlerMiddleware(authServices.signUpService))
authController.put('/verify-email', validationMiddleware(confirmEmailSchema), errorHandlerMiddleware(authServices.confirmEmailService))
authController.post('/signin', validationMiddleware(signInSchema), errorHandlerMiddleware(authServices.signinService))
authController.post('/gmail-login', errorHandlerMiddleware(authServices.gmailLoginService))
authController.post('/gmail-signup', errorHandlerMiddleware(authServices.gmailSignUpService))
authController.post('/signout', errorHandlerMiddleware(authServices.signOutService))
authController.post('/forget-password',
    errorHandlerMiddleware(authenticationMiddleware()),
    errorHandlerMiddleware(authServices.forgetPasswordService)
)
authController.post('/reset-password',
    errorHandlerMiddleware(authenticationMiddleware()),
    validationMiddleware(resetPasswordSchema),
    errorHandlerMiddleware(authServices.resetPasswordService)
)