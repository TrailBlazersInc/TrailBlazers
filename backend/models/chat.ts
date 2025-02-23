import mongoose from 'mongoose';
import {Message} from './message'
const {Schema} = mongoose;

const ChatSchema = new Schema({
    title: String,
    members: [mongoose.Types.ObjectId],
    messages:[Message]
})

export const Chat = mongoose.model("Chat", ChatSchema);