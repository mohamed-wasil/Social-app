import User from "../DB/Models/user.model.js"

export const checkIfUserTagsExist = () => {
    return async (req, res, next) => {
        let tags = req.body.tags

        if (typeof tags === 'string') tags = [tags]

        if (tags?.length) {
            const users = await User.find({ _id: { $in: tags } })
            if (users.length !== tags.length) {
                return res.status(400).json({ message: "Invalid tags" })
            }
        }
        next()
    }
}