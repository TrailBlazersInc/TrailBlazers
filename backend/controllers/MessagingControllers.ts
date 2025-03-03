import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { Message, IMessage } from "../models/message";
import {Chat, IChat} from "../models/chat";
import { User, IUser } from "../models/user";

export class MessagingControllers {
    async getChats(req: Request, res: Response, next: NextFunction){
        const email: String = req.params.email
        try{
            const user = await User.findOne<IUser>({email: email})
            if (user){
                const chats = await Chat.find<IChat>({ members: user.email });
                let formatedChats: any[] = [];
                for(let i = 0; i < chats.length; i++){
                    let members = chats[i].members
                    let chat = {
                        id: chats[i]._id.toString(),
                        title: chats[i].title,
                        members: chats[i].members.length
                    };
                    // Change the chat title to the other user's name
                    if (members.length == 2){
                        let buddy_email_index = members[0] === email? 1 : 0;
                        let buddy = await User.findOne({email: members[buddy_email_index]})
                        if (buddy){
                            chat.title = buddy.first_name
                        }
                    }
                    formatedChats[i] = chat
                }
                res.status(200).json(formatedChats)
            } else{
                res.status(400).send("User does not exist")
            }
        } catch(error){
            res.status(400).send("No chats found")
        }
    }

    async getMessages(req: Request, res: Response, next: NextFunction){
        try{
            let chat = await Chat.findOne({_id: req.params.chatId}).populate<{messages: IMessage[]}>("messages");
            if(!chat){
                return res.status(400).send("Chat not found")
            }
            let messages = chat.messages.map((message) => ({
                id: message._id,
                sender_email: message.sender_email,
                sender: message.sender,
                content: message.content,
                date: message.createdAt.toISOString()
            }))
            return res.status(200).json(messages)
        } catch (error){
            console.log(error)
            res.status(500).send("Could not fetch messages")
        }
    }

    async getMessagesAfter(req: Request, res: Response, next: NextFunction){
        try{
            const chat = await Chat.findOne({ _id: req.params.chatId }).populate<{messages: IMessage[]}>("messages");
            if(chat){
                const referenceMessage = await Message.findOne({_id: req.params.messageId});
                if(referenceMessage){
                    let filteredeMessages = chat.messages.filter((msg) => msg.createdAt.getTime() > referenceMessage.createdAt.getTime())
                    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
                    let messages = filteredeMessages.map((message) => ({
                        id: message._id,
                        sender_email: message.sender_email,
                        sender: message.sender,
                        content: message.content,
                        date: message.createdAt.toISOString()
                }))
                    res.status(200).json(messages)
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
            console.log("entering Post chat")
            const email = req.params.email
            const user = await User.findOne({email});
            if (!user){
                return res.status(400).send("User does not Exist")
            }
            console.log(user)
            const chatName = req.body.chatName
            const chat = new Chat({title: chatName, members:[email], messages: []})
            console.log(chat)
            await chat.save()
            res.status(200).json(chat)
        } catch(error){
            console.log(error)
            res.status(500).send("Error creating Chat")
        }
    }

    async postMessage(req: Request, res: Response, next: NextFunction){
        try{
            let chat = await Chat.findOne({_id: req.params.chatId});
            let user = await User.findOne({email: req.body.email});
            if (!user || !chat){
                res.status(400).send("Invalid User Id or Chat Id")
            } else{
                let message = new Message({
                    sender_email: req.body.email,
                    sender: user.first_name,
                    content: req.body.content})
                await message.save()
                const updatedChat = await Chat.findByIdAndUpdate(
                    req.params.chatId,
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
            console.log(err)
            res.status(500).send("Could not add message to the chat")
        }
    }

    async addUser(req: Request, res: Response, next: NextFunction){
        try{
            let email = req.params.email
            let chat = await Chat.findOne({_id: req.body.chatId});
            console.log(chat)
            let user = await User.findOne({email: email});
            console.log(user)
            if (!chat || !user || chat.members.includes(email)) {
                return res.status(400).json({ message: "Chat/User not existent or User is already a member of the chat" });
            }
            // Add user to chat
            chat.members.push(email);
            await chat.save();
            return res.status(200).json(chat)
        } catch(err){
            console.log(err)
            res.status(500).send("unable to add user")
        }
    }

}