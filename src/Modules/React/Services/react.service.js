import { Reacts } from "../../../Constants/constants.js";
import Comment from "../../../DB/Models/comment.model.js";
import Post from "../../../DB/Models/post.model.js";
import React from "../../../DB/Models/react.model.js";

export const addReactService = async (req, res, next) => {
    const { _id: ownerId } = req.loggedIn;
    const { reactType, onModel } = req.body
    const { reactOnId } = req.params

    const firstChar = onModel.charAt(0).toUpperCase()
    const secondChars = onModel.slice(1,).toLowerCase()
    const capitalizedWord = firstChar + secondChars

    const newReactType = reactType.toLowerCase()

    const reactObject = {
        reactOnId,
        onModel: capitalizedWord,
        ownerId
    }
    if (capitalizedWord == "Post") {
        const post = await Post.findById(reactOnId)
        if (!post) return res.status(400).json({ mesage: "Post not found or comments are't allowed in this post" })
    } else if (capitalizedWord == "Comment") {
        const comment = await Comment.findById(reactOnId)
        if (!comment) return res.status(400).json({ mesage: "comment not found" })
    }
    reactObject.reactOnId = reactOnId;
    reactObject.onModel = capitalizedWord;

    //schema validator
    const isReactValid = Object.values(Reacts)
    if (!isReactValid.includes(newReactType)) return res.status(400).json({ mesage: "Invalid react type" })

    reactObject.reactType = newReactType

    const react = await React.create(reactObject)

    res.status(201).json({ message: "React addedd successfullt", react })
}

export const deleteReactService = async (req, res, next) => {
    const { _id: ownerId } = req.loggedIn;
    const { reactId } = req.params;

    const deletedReact = await React.findOneAndDelete({
        _id: reactId,
        ownerId
    })
    if(!deletedReact) return res.status(400).json({ mesage: "React not found" })

         res.status(201).json({ mesage: "React deleted successfully" })
}