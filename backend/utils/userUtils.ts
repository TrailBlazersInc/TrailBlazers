import {Chat, IChat } from "../models/chat"

export async function getFriends(email: string): Promise<string[]> {
    let chats: IChat[] = await Chat.find({ members: email });
    return [...new Set(chats.flatMap(chat => chat.members))];
}
