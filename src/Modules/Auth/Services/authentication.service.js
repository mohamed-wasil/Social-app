import { compareSync, hashSync } from "bcrypt";
import User from "../../../DB/Models/user.model.js";
import sendEmail from "../../../Services/send-email.service.js";
import { generateToken } from "../../../Utils/generat-tokens.utils.js";
import { v4 as uuid } from "uuid";
import { OAuth2Client } from "google-auth-library";
import { ProviderEnum } from "../../../Constants/constants.js";
import BlackListTokens from "../../../DB/Models/black-list-tokens.model.js";
import jwt from "jsonwebtoken"

/**
 * Handles user registration by creating a new account and sending a verification email.
 * @async
 * @function signUpService
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing user details
 * @param {string} req.body.username - The username of the new user
 * @param {string} req.body.email - The email address of the new user
 * @param {string} req.body.password - The password for the new user account
 * @param {string} req.body.phone - The phone number of the new user
 * @param {string} req.body.DOB - The date of birth of the new user
 * @param {string} req.body.gender - The gender of the new user
 * @param {string} req.body.role - The role assigned to the new user
 * @param {boolean} [req.body.isPublic] - Whether the user's profile is public or private (default: private)
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response indicating the result of the registration process
 * @throws {Error} - Throws an error if the email already exists or if user registration fails
 * @description 
 * - Checks if the email is already registered.
 * - Generates a 6-digit OTP for email verification.
 * - Sends a verification email to the user.
 * - Creates and saves a new user in the database.
 * - Returns a success message upon successful registration.
 */

export const signUpService = async (req, res) => {
    const { username, email, password, phone, DOB, gender, role, isPublic } = req.body;

    const isEmailExist = await User.findOne({ email });
    if (isEmailExist) return res.status(501).json({ message: "email already exist" })

    //check is public or not
    const isUserPublic = isPublic ? true : false

    //create otp 
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    //send email verrify
    sendEmail.emit('sendEmail', {
        to: email,
        subject: "Verify your email",
        html: `<h3>Your Otp Is ${otp}</h3>`
    })

    // create user
    const user = new User({
        username,
        email,
        password,
        phone,
        DOB,
        gender,
        role,
        isPublic: isUserPublic,
        confirmOtp: otp
    })

    await user.save()
    res.status(201).json({ message: "User Registered Successfully , check your email to verify" })
}
/**
 * Confirms a user's email by verifying the provided OTP.
 * @async
 * @function confirmEmailService
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing email verification details
 * @param {string} req.body.email - The email address of the user attempting to verify
 * @param {string} req.body.otp - The one-time password (OTP) sent to the user's email
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response indicating the result of the email confirmation process
 * @throws {Error} - Throws an error if the user is not found or the OTP is invalid
 * @description 
 * - Checks if a non-verified user with the given email and OTP exists.
 * - Compares the provided OTP with the stored OTP.
 * - If valid, marks the user as verified and removes the OTP.
 * - Returns a success message upon successful email confirmation.
 */

export const confirmEmailService = async (req, res) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ email, isVerified: false, confirmOtp: { $exists: true } })
    if (!user) return res.status(401).json({ message: "User not found , Please signup" })

    const isOtpMatched = compareSync(otp, user.confirmOtp)
    if (!isOtpMatched) return res.status(401).json({ message: "Invalid OTP" })

    await User.findByIdAndUpdate(user._id, { isVerified: true, $unset: { confirmOtp: "" } })
    res.status(201).json({ message: "Confirmed Email Successfully" })
}
/**
 * Handles user sign-in by verifying credentials and generating authentication tokens.
 * @async
 * @function signinService
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing login credentials
 * @param {string} req.body.email - The email address of the user
 * @param {string} req.body.password - The password of the user
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response containing access and refresh tokens upon successful login
 * @throws {Error} - Throws an error if the user is not found or the password is incorrect
 * @description 
 * - Checks if a user with the provided email exists.
 * - Verifies the provided password against the stored password.
 * - If successful, generates an access token and a refresh token.
 * - Returns a success message along with authentication tokens.
 */

export const signinService = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ message: "User not found , Please signup" })

    const isPasswordMatched = compareSync(password, user.password)
    if (!isPasswordMatched) return res.status(401).json({ message: "Invalid email or password" })

    const accessToken = await generateToken(
        {
            publicClamis: { _id: user._id, name: user.username, email: user.email },
            secretKey: process.env.JWT_SECRET_LOGIN,
            registerClamis: { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION_TIME, jwtid: uuid() }
        })

    const refreashToken = await generateToken(
        {
            publicClamis: { _id: user._id, name: user.username, email: user.email },
            secretKey: process.env.JWT_SECRET_REFRESH,
            registerClamis: { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION_TIME, jwtid: uuid() }
        })

    res.status(201).json({ message: "Login in success", token: accessToken, refreashToken })
}
/**
 * Handles user login via Google authentication.
 * @async
 * @function gmailLoginService
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing Google authentication details
 * @param {string} req.body.idToken - The ID token received from Google authentication
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response containing access and refresh tokens upon successful login
 * @throws {Error} - Throws an error if email verification fails or the user is not found
 * @description 
 * - Verifies the Google ID token using OAuth2Client.
 * - Extracts user email and checks if it is verified.
 * - Searches for the user in the database with Google as the provider.
 * - If found, generates an access token and a refresh token.
 * - Returns a success message along with authentication tokens.
 */

export const gmailLoginService = async (req, res) => {
    const { idToken } = req.body
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email_verified, email } = payload;

    if (!email_verified) return res.status(400).json({ message: "Invalid gmail credentials" })

    const user = await User.findOne({ email, provider: ProviderEnum.GOOGLE })
    if (!user) return res.status(400).json({ message: "User not found . Please Signup" })

    const accessToken = await generateToken(
        {
            publicClamis: { _id: user._id, name: user.username, email: user.email },
            secretKey: process.env.JWT_SECRET_LOGIN,
            registerClamis: { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION_TIME, jwtid: uuid() }
        })

    const refreashToken = await generateToken(
        {
            publicClamis: { _id: user._id, name: user.username, email: user.email },
            secretKey: process.env.JWT_SECRET_LOGIN,
            registerClamis: { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION_TIME, jwtid: uuid() }
        })
    res.status(201).json({ message: "Login in success", tokens: { token: accessToken, refreashToken } })
}
/**
 * Handles user registration via Google authentication.
 * @async
 * @function gmailSignUpService
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing Google authentication details
 * @param {string} req.body.idToken - The ID token received from Google authentication
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response indicating the result of the sign-up process
 * @throws {Error} - Throws an error if email verification fails or the email already exists
 * @description 
 * - Verifies the Google ID token using OAuth2Client.
 * - Extracts user email and checks if it is verified.
 * - Checks if the email is already registered with Google as a provider.
 * - If not, creates a new user with a randomly generated password.
 * - Saves the user to the database and marks them as verified.
 * - Returns a success message upon successful sign-up.
 */

export const gmailSignUpService = async (req, res) => {
    const { idToken } = req.body
    // console.log(idToken);

    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email_verified, name, email } = payload;

    if (!email_verified) return res.status(400).json({ message: "Invalid gmail credentials" })

    const isEmailExist = await User.findOne({ email, provider: ProviderEnum.GOOGLE })
    if (isEmailExist) return res.status(400).json({ message: "Email already exist" })

    const user = new User({
        usename: name,
        email,
        password: hashSync(uuid(), +process.env.SALT_ROUND),
        provider: ProviderEnum.GOOGLE,
        isVerified: true
    })
    await user.save()
    res.status(201).json({ message: "signup successfully" })

}
/**
 * Handles user sign-out by blacklisting access and refresh tokens.
 * @async
 * @function signOutService
 * @param {Object} req - Express request object
 * @param {Object} req.headers - Request headers containing authentication tokens
 * @param {string} req.headers.token - The access token of the user
 * @param {string} req.headers.refreshtoken - The refresh token of the user
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response confirming successful logout
 * @throws {Error} - Throws an error if token verification fails
 * @description 
 * - Verifies the access and refresh tokens using JWT.
 * - Extracts token IDs and expiration times.
 * - Stores the tokens in the blacklist to prevent reuse.
 * - Returns a success message upon successful logout.
 */

export const signOutService = async (req, res) => {
    const { token, refreshtoken } = req.headers;

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET_LOGIN)
    const decodedRefreshToken = jwt.verify(refreshtoken, process.env.JWT_SECRET_REFRESH)

    await BlackListTokens.insertMany([
        {
            tokenId: decodedToken.jti,
            expierdAt: decodedToken.exp
        },
        {
            tokenId: decodedRefreshToken.jti,
            expierdAt: decodedRefreshToken.exp
        }
    ])
    res.status(201).json({ message: "Logged out Successfully" })

}
/**
 * Handles the process of sending a password reset OTP to the user's email.
 * @async
 * @function forgetPasswordService
 * @param {Object} req - Express request object
 * @param {Object} req.loggedIn - Logged-in user data
 * @param {string} req.loggedIn._id - The ID of the user requesting password reset
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response confirming that the OTP has been sent
 * @throws {Error} - Throws an error if the user is not found
 * @description 
 * - Generates a 6-digit OTP.
 * - Finds the user in the database using their ID.
 * - Stores the OTP in the user's record.
 * - Sends the OTP via email for verification.
 * - Returns a success message upon successful OTP generation and email dispatch.
 */

export const forgetPasswordService = async (req, res) => {
    const { _id } = req.loggedIn

    //create otp 
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const user = await User.findById(_id);
    user.confirmOtp = otp;

    sendEmail.emit('sendEmail', {
        to: user.email,
        subject: "Verify your email",
        html: `<h3>Your Otp Is ${otp}</h3>`
    })
    await user.save()
    res.status(201).json({ message: "Check your Gmail" })
}
/**
 * Handles password reset by verifying the OTP and updating the user's password.
 * @async
 * @function resetPasswordService
 * @param {Object} req - Express request object
 * @param {Object} req.loggedIn - Logged-in user data
 * @param {string} req.loggedIn._id - The ID of the user resetting their password
 * @param {Object} req.body - Request body containing password reset details
 * @param {string} req.body.otp - The one-time password (OTP) sent for verification
 * @param {string} req.body.newPassword - The new password to be set
 * @param {string} req.body.confirmNewPassword - Confirmation of the new password
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response confirming password reset success
 * @throws {Error} - Throws an error if the OTP is invalid or password update fails
 * @description 
 * - Finds the user in the database using their ID.
 * - Compares the provided OTP with the stored OTP.
 * - If valid, updates the user's password and removes the OTP from the database.
 * - Returns a success message upon successful password reset.
 */

export const resetPasswordService = async (req, res) => {
    const { _id } = req.loggedIn
    const { otp, newPassword, confirmNewPassword } = req.body;

    const user = await User.findById(_id)

    const isOtpMatched = compareSync(otp, user.confirmOtp)
    if (!isOtpMatched) return res.status(401).json({ message: "Invalid OTP , Try again" })

    await User.updateOne({ _id }, { password: newPassword, $unset: { confirmOtp: "" } })
    res.status(201).json({ message: "Password reset successfuly" })
}


