import { Request, Response, NextFunction } from "express";
import { Message, PMessage } from "../models/message";
import {Chat} from "../models/chat";
import { User } from "../models/user";
import mongoose, {Document} from "mongoose";

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
        try{
            const chat = await Chat.findOne({ _id: req.body.chatId }).populate<{messages: PMessage[]}>("messages");
            if(chat){
                const referenceMessage = await Message.findOne({_id: req.body.messageId});
                if(referenceMessage){
                    chat.messages.filter((msg) => msg.createdAt > referenceMessage.createdAt)
                    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                    res.status(200).json(chat.messages)
                } else{
                    res.status(400).send("Invalid Message Id");
                }
            }
        } catch(err){
            console.log(err);
            res.status(500).send("Unable to fetch Messages")
        }
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
        try{
            let chat = await Chat.findOne(req.body.chatId);
            let user = await User.findOne(req.body.userId);
            if (!user || !chat){
                res.status(400).send("Invalid User Id or Chat Id")
            } else{
                let username = user.username;
                let message = new Message(username, req.body.content)
                await message.save()
                const updatedChat = await Chat.findByIdAndUpdate(
                    req.body.chatId,
                    { $push: { messages: message.id } }, // Add messageId to the messages array
                    { new: true } // Return the updated document
                );
                if (updatedChat){
                    res.status(200).json(message)
                } else{
                    res.status(400).send("Unable to locate Chat")
                }
            }
            
        } catch(err){
            res.status(500).send("Could not add message to the chat")
        }
    }

    async addUser(req: Request, res: Response, next: NextFunction){
        try{
            let userId = req.body.userId
            let chat = await Chat.findOne(req.body.chatId);
            if (!chat || chat.members.includes(userId)) {
                return res.status(400).json({ message: "Chat not existent or User is already a member of the chat" });
            }
            // Add user to chat
            chat.members.push(userId);
            await chat.save();
            
        } catch(err){
            console.log(err)
            res.status(500).send("unable to add user")
        }
    }

    async createUser(req: Request, res: Response, next: NextFunction){
        try{
            let username: string = req.body.username;
            console.log(username);
            let user = new User({username, isBanned: false})
            await user.save()
            res.status(200).send(user)
        }catch(err){
            console.log(err)
            res.status(500).send("unable to create user")
        }
    }

}