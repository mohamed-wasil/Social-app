import { Router } from "express"
import * as reactServices from "./Services/react.service.js"
import { authenticationMiddleware } from "../../Middlewares/authentication.middleware.js"
import { errorHandlerMiddleware } from "../../Middlewares/error-handler.middlewasre.js"
export const reactContrller = Router()

reactContrller.post("/add/:reactOnId",
    errorHandlerMiddleware(authenticationMiddleware()),
    errorHandlerMiddleware(reactServices.addReactService)
)
reactContrller.delete("/delete/:reactId",
    errorHandlerMiddleware(authenticationMiddleware()),
    errorHandlerMiddleware(reactServices.deleteReactService)
)
