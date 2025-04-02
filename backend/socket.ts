import { Server as httpServer } from "http";
import { Server as httpsServer } from "https";
import {  Server  as SocketIOServer} from "socket.io";
import { Message, IMessage, PMessage } from "./models/message";
import { Chat, IChat, PChat } from "./models/chat";
import { User, IUser, PUser } from "./models/user";
import z from "zod";
import mongoose from "mongoose";

const joinChatReq = z.object({
    chatId: z.string().refine((val: string) => (mongoose.isValidObjectId(val)))
})

const messageReq = z.object({
    chatId: z.string().refine((val) => (mongoose.isValidObjectId(val))),
    email: z.string(),
    content: z.string().min(1)
})



export default function setUpWebSocket(server: httpsServer | httpServer): SocketIOServer{
    let io = new SocketIOServer(server)

    io.on("connection", (socket) => {
        console.log("user joined")
        socket.on("join_chat", async(rawdata) => {
            try{
            let data = JSON.parse(rawdata)
            const result = joinChatReq.safeParse(data)

            if(!result.success){
                console.log("no success")
                socket.emit("req-error", result.error.format());
                socket.emit("error")
                return;
            }

            let chat = await Chat.findOne<IChat>({_id: data.chatId}).populate<{
				messages: IMessage[];
			}>("messages");

            if (!chat){
                console.log("no chat")
                socket.emit("req-error", "Invalid chat id")
                socket.emit("error")
                return;
            }
            console.log("joining chat")

            let messages: PMessage[] = chat.messages.map((message: IMessage) => ({
                id: message._id.toString(),
                sender_email: message.sender_email,
                sender: message.sender,
                content: message.content,
                date: message.createdAt.toISOString(),
            }));
            socket.emit("join_chat", messages)
            socket.join(data.chatId)
        } catch(error){
            socket.emit("req-error", error);
            socket.emit("error")
        }
        })

        socket.on("message", async (rawData) => {
            try {
                let data = JSON.parse(rawData)
                const result = messageReq.safeParse(data)
                if (!result.success){
                    socket.emit('req-error', result.error.format())
                }
                let chat = await Chat.findOne<IChat>({ _id: data.chatId });
                let user = await User.findOne<IUser>({ email: data.email });
                
                if (!chat) {
                    socket.emit("req-error", "Invalid chat id");
                    return;
                }
    
                if (!user) {
                    socket.emit("req-error", "Invalid email");
                    return;
                }
    
                if (!chat.members.includes(user.email)) {
                    socket.emit("req-error", "Email not in chat")
                    return;
                }
    
                let message = new Message({
                    sender_email: data.email,
                    sender: user.first_name,
                    content: data.content,
                });

                message = await message.save();

                if(!message){
                    socket.emit("req-error", "Server error")
                }
                chat.messages.push(message._id);
                chat = await chat.save();

                let formattedMessage : PMessage = {
                    id: message._id.toString(),
                    sender_email: message.sender_email,
                    sender: message.sender,
                    content: message.content,
                    date: message.createdAt.toISOString()
                }

                io.to(data.chatId).emit('message', formattedMessage)

            } catch (error) {
                socket.emit("req-error", "Server Error")
            }
        })
    })

    return io
}