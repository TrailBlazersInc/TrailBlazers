import { MessagingControllers } from "../controllers/MessagingControllers"
import {body, param} from "express-validator"
import mongoose from "mongoose"
import {User} from "../models/user"
import {Chat} from "../models/chat"

const controllers = new MessagingControllers()

export const MessagingRoutes = [
    {
        method: "get",
        route: "/chat/:email",
        action: controllers.getChats,
        validation: [
            param("email").isEmail()
        ]
    },
    {
        method: "get",
        route: "/messagesAfter",
        action: controllers.getMessagesAfter,
        validation: [
            body("messageId").isMongoId()
        ]
    },
    {
        method: "post",
        route: "/chat/:email",
        action: controllers.postChat,
        validation:[
            param("email").isEmail(),
            body("chatName")
                .isString()
                .isLength({ max: 50 }).withMessage("Chatname Must be Shorter at Max 50 Characters")
        ]
    },
    {
        method: "post",
        route: "/message/:email",
        action: controllers.postMessage,
        validation:[
            param("email").isEmail(),
            body("chatId").isMongoId(),
            body("content").isString()
        ]
    },
    {
        method: "put",
        route: "/chat/:email",
        action: controllers.addUser,
        validation: [
            param("email").isEmail(),
            body("chatId").isMongoId()
        ]
    }
]