import { Request, Response, NextFunction } from "express";
import { Message } from "../models/message";
import {Chat} from "../models/chat";


export class MessagingControllers {
    async getChats(req: Request, res: Response, next: NextFunction){
        res.status(200).send('hello')
    }
    async postMessage(req: Request, res: Response, next: NextFunction){
        let myChat = await Chat.findOne(req.body.chatId);
    }
}