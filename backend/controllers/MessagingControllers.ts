import { Request, Response, NextFunction } from "express";
import { Message } from "../models/message";
import {Chat} from "../models/chat";


export class MessagingControllers {
    async getChats(req: Request, res: Response, next: NextFunction){
        const userId: String = req.body.user
        try{
            const chats = await Chat.find({ members: userId });
            if (chats){
                res.status(200).json(chats)
            } 
        } catch(error){
            res.status(400).send("No chats found")
        }
    }

    async getMessagesAfter(req: Request, res: Response, next: NextFunction){
      

    }
    async postChat(req: Request, res: Response, next: NextFunction){
        try{
            const users = req.body.userList
            const chatName = req.body.chatName
            const chat = new Chat(chatName,users, {})
            await chat.save()
            res.status(200).json(chat)
        } catch(error){
            res.status(500).send("Error creating Chat")
        }
    }
    async postMessage(req: Request, res: Response, next: NextFunction){

        let myChat = await Chat.findOne(req.body.chatId);
    }

    async addUser(req: Request, res: Response, next: NextFunction){
        let myChat = await Chat.findOne(req.body.chatId);
    }

}