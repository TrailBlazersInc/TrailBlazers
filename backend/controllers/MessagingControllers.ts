import { Request, Response} from "express";
import { Message, IMessage } from "../models/message";
import { Chat, IChat } from "../models/chat";
import { User, IUser } from "../models/user";
import {sanitizeText} from "../utils/sanitize";

export class MessagingControllers {
	async getChats(req: Request, res: Response) {
		const email: string = req.params.email;
		try {
			const user = await User.findOne<IUser>({ email });
			if (user) {
				const chats = await Chat.find<IChat>({ members: user.email });
				let formatedChats: unknown[] = [];
				for (const chat of chats){
					let members: string[] = chat.members;
					let formattedChat = {
						id: chat._id.toString(),
						title: sanitizeText(chat.title),
						members: members.length,
					};
					// Change the chat title to the other user's name
					if (members.length == 2) {
						let buddy_email: string = sanitizeText(members[0])
						if (buddy_email == email){
							buddy_email = sanitizeText(members[1])
						}
						let buddy = await User.findOne({
							email: buddy_email,
						});
						if (buddy) {
							formattedChat.title = buddy.first_name;
						}
					}
					formatedChats.push(formattedChat);
				}
				return res.status(200).json(formatedChats);
			} else {
				return res.status(400).send("Invalid email");
			}
		} catch (error) {
			return res.status(500).send("Internal server error");
		}
	}
	async getChatMembers(req: Request, res: Response) {
		try {
			let members: unknown[] = [];
			let chat = await Chat.findOne<IChat>({ _id: req.params.chatId });
			if (!chat) {
				return res.status(400).send("Invalid chat id");
			}

			let chatMembers = chat.members;

			for (const member of chatMembers) {
				let user = await User.findOne<IUser>({ email: member });
				if(user){
					members.push({ name: user.first_name, email: user.email });
				}
			}

			return res.status(200).json(members);
		} catch (error) {
			res.status(500).send("Internal server error");
		}
	}

	async getMessages(req: Request, res: Response) {
		try {
			let chat = await Chat.findOne({ _id: req.params.chatId }).populate<{
				messages: IMessage[];
			}>("messages");
			if (!chat) {
				return res.status(400).send("Invalid chat id");
			}
			let messages = chat.messages.map((message) => ({
				id: message._id,
				sender_email: message.sender_email,
				sender: message.sender,
				content: message.content,
				date: message.createdAt.toISOString(),
			}));
			return res.status(200).json(messages);
		} catch (error) {
			res.status(500).send("Internal server error");
		}
	}

	async getMessagesAfter(req: Request, res: Response) {
		try {
			const chat = await Chat.findOne({ _id: req.params.chatId }).populate<{
				messages: IMessage[];
			}>("messages");
			if (chat) {
				const referenceMessage = await Message.findOne({
					_id: req.params.messageId,
				});
				if (referenceMessage) {
					let filteredeMessages = chat.messages
						.filter(
							(msg) =>
								msg.createdAt.getTime() > referenceMessage.createdAt.getTime()
						)
						.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
					let messages = filteredeMessages.map((message) => ({
						id: message._id,
						sender_email: message.sender_email,
						sender: message.sender,
						content: message.content,
						date: message.createdAt.toISOString(),
					}));
					res.status(200).json(messages);
				} else {
					res.status(400).send("Invalid message id");
				}
			} else {
				res.status(400).send("Invalid chat id");
			}
		} catch (error) {
			res.status(500).send("Internal server error");
		}
	}

	async postChat(req: Request, res: Response) {
		try {
			const email = req.params.email;
			const user = await User.findOne({ email });
			if (!user) {
				return res.status(400).send("Invalid email");
			}
			const chatName = req.body.chatName;
			const chat = new Chat({
				title: chatName,
				members: [email],
				messages: [],
			});
			const newChat = await chat.save();

			const formattedChat = {
				id: newChat._id.toString(),
				title: newChat.title,
				members: newChat.members.length,
			};

			res.status(201).json(formattedChat);
		} catch (error) {
			res.status(500).send("Internal server error");
		}
	}

	async postChatDM(req: Request, res: Response) {
		try {
			const email = req.params.email;
			const targetEmail = req.body.target_email;
			const user = await User.findOne({ email });
			const user2 = await User.findOne({ email: targetEmail });

			if (!user) {
				return res.status(400).send("Invalid email");
			}

			if (!user2) {
				return res.status(400).send("Invalid target email");
			}

			let chat = await Chat.findOne({
				members: { $all: [email, targetEmail], $size: 2 },
			});

			if (chat) {
				let formattedChat = {
					id: chat._id.toString(),
					title: user2.first_name,
					members: chat.members.length,
				};
				return res.status(200).json(formattedChat);
			}

			chat = new Chat({
				title: "DM",
				members: [email, targetEmail],
				messages: [],
			});
			chat = await chat.save();

			let formattedChat = {
				id: chat._id.toString(),
				title: user2.first_name,
				members: chat.members.length,
			};
			return res.status(201).json(formattedChat);
		} catch (error) {
			res.status(500).send("Internal server error");
		}
	}

	async postMessage(req: Request, res: Response) {
		try {
			let chat = await Chat.findOne<IChat>({ _id: req.params.chatId });
			let user = await User.findOne<IUser>({ email: req.body.email });
			if (!chat) {
				return res.status(400).send("Invalid chat id");
			}

			if (!user) {
				return res.status(400).send("Invalid email");
			}

			if (!chat.members.includes(user.email)) {
				return res.status(400).send("Email not in chat");
			}

			let message = new Message({
				sender_email: req.body.email,
				sender: user.first_name,
				content: req.body.content,
			});
			message = await message.save();
			chat.messages.push(message._id)
			chat = await chat.save()
		
			return res.status(201).json(message);
			
		} catch (error) {
			return res.status(500).send("Internal server error");
		}
	}

	async addUser(req: Request, res: Response) {
		try {
			let email = req.params.email;
			let chat = await Chat.findOne({ _id: req.body.chatId });
			let user = await User.findOne({ email });
			if (!chat) {
				return res.status(400).send("Invalid chat id");
			}
			if (!user) {
				return res.status(400).send("Invalid email");
			}

			if (chat.members.includes(email)) {
				let formattedChat = {
					id: chat._id.toString(),
					title: chat.title,
					members: chat.members.length,
				};
				return res.status(200).send(formattedChat);
			}

			// Add user to chat
			chat.members.push(email);
			chat = await chat.save();

			let formattedChat = {
				id: chat._id.toString(),
				title: chat.title,
				members: chat.members.length,
			};

			return res.status(200).json(formattedChat);
		} catch (error) {
			return res.status(500).send("Internal server error");
		}
	}
}
