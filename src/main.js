import { config } from "dotenv";
import express from "express"
import databaseConnection from "./DB/connectionDB.js";
import { authController } from "./Modules/Auth/auth.controller.js";
import { globalErrorMiddleWareHandler } from "./Middlewares/error-handler.middlewasre.js";
import { userController } from "./Modules/User/user.controller.js";
import cors from "cors"
import { postController } from "./Modules/Post/post.controller.js";
import { commentController } from "./Modules/Comment/comment.controller.js";
import { reactContrller } from "./Modules/React/react.controller.js";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { Server } from "socket.io";
import { establishIoConnection } from "./Utils/socket.utils.js";
config()

const whitelist = [process.env.FRONTEND_ORIGIN, process.env.FRONTEND_ORIGIN_TWO, undefined]
const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
}

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
});

const bootstrap = () => {
    const port = process.env.PORT || 3000

    const app = express();
    // app.use("/Assets", express.static('Assets'))
    app.use(limiter)
    app.use(helmet());
    app.use(express.json())
    app.use(cors(corsOptions))

    app.get('/', (req, res, next) => {
        res.status(201).json({ message: "Welcome in social media app" })
    })
    app.use('/auth', authController)
    app.use('/user', userController)
    app.use('/post', postController)
    app.use('/comment', commentController)
    app.use('/react', reactContrller)

    databaseConnection()

    app.all("*", (req, res) => {
        res.status(404).json({ message: "Page Not Found!" })
    })

    app.use(globalErrorMiddleWareHandler)

    const server = app.listen(port, () => {
        console.log("server is running in port", port);
    })


    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_ORIGIN_TWO
        }
    })
    establishIoConnection(io)



}

export default bootstrap