import { MessagingControllers } from "../controllers/MessagingControllers"
import {body, param} from "express-validator"
import mongoose from "mongoose"
import {User} from "../models/user"
import {Chat} from "../models/chat"

const controllers = new MessagingControllers()

export const MessagingRoutes = [
    {
        method: "get",
        route: "/chat",
        action: controllers.getChats,
        validation: [
            body("userId").isMongoId()
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
        route: "/chat",
        action: controllers.postChat,
        validation:[
            body("userList")
                .isArray().withMessage("user List must be an Array of IDs")
                .notEmpty().withMessage("userList must not be empty")
                .custom(async (ids) =>{
                    if (!ids.every( (id: any) => mongoose.Types.ObjectId.isValid(id))) {
                        throw new Error("One or more IDs are invalid");
                    }
    
                    // Check that IDs exist in the database
                    const existingUsers = await User.find({ _id: { $in: ids } });
                    if (existingUsers.length !== ids.length) {
                        throw new Error("One or more users do not exist");
                    }

                }),
            body("chatName")
                .isString()
                .isLength({ max: 50 }).withMessage("Chatname Must be Shorter at Max 50 Characters")
        ]
    },
    {
        method: "post",
        route: "/message",
        action: controllers.postMessage,
        validation:[
            body("userId").isMongoId(),
            body("chatId").isMongoId(),
            body("content").isString()
        ]
    },
    {
        method: "put",
        route: "/user",
        action: controllers.addUser,
        validation: [
            body("userId").isMongoId(),
            body("chatId").isMongoId()
        ]
    }
]