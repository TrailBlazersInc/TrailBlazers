import { MessagingControllers } from "../controllers/MessagingControllers"
import { Request, Response } from 'express';
import {body, param} from "express-validator"

const controllers = new MessagingControllers()

export const MessagingRoutes = [
    {
        method: "get",
        route: "/chat/:email",
        action: (req: Request, res: Response) => controllers.getChats(req, res),
        validation: [
            param("email").isEmail()
        ]
    },
    {
        method: "get",
        route: "/chat/messages/:chatId",
        action:  (req: Request, res: Response) => controllers.getMessages(req, res),
        validation:[
            param("chatId").isMongoId()
        ]
    },
    {
        method: "get",
        route: "/chat/messages/:chatId/:messageId",
        action:  (req: Request, res: Response) => controllers.getMessagesAfter(req, res),
        validation: [
            param("chatId").isMongoId(),
            param("messageId").isMongoId()
        ]
    },
    {
        method: "get",
        route: "/chat/members/:chatId",
        action:   (req: Request, res: Response) => controllers.getChatMembers(req, res),
        validation:[
            param("chatId").isMongoId()
        ]
    },
    {
        method: "post",
        route: "/chat/:email",
        action:   (req: Request, res: Response) =>controllers.postChat(req, res),
        validation:[
            param("email").isEmail(),
            body("chatName")
                .isString()
                .isLength({ max: 50 }).withMessage("Chatname Must be Shorter at Max 50 Characters")
        ]
    },
    {
        method: "post",
        route: "/chat/message/:chatId",
        action:   (req: Request, res: Response) => controllers.postMessage(req, res),
        validation:[
            param("chatId").isMongoId(),
            body("email").isEmail(),
            body("content").isString()
        ]
    },
    {
        method: "post",
        route: "/chat/dm/:email",
        action:   (req: Request, res: Response) => controllers.postChatDM(req, res),
        validation:[
            param("email").isEmail(),
            body("target_email").isEmail()
        ]
    },
    {
        method: "put",
        route: "/chat/:email",
        action:   (req: Request, res: Response) => controllers.addUser(req, res),
        validation: [
            param("email").isEmail(),
            body("chatId").isMongoId()
        ]
    }
]