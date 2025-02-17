import CryptoJS from "crypto-js"
export const Encryption = async ({ value, secretKey = process.env.ENCRYPTION_SECRET_KEY } = {}) => {
    return CryptoJS.AES.encrypt(value, secretKey).toString()
}

export const Decryption = async ({ cipher, secretKey = process.env.ENCRYPTION_SECRET_KEY } = {}) => {
    return CryptoJS.AES.decrypt(cipher, secretKey).toString(CryptoJS.enc.Utf8)
}