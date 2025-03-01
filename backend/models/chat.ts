import mongoose from 'mongoose';
import {Message} from './message'
const {Schema} = mongoose;

const ChatSchema = new Schema({
    title: String,
    members: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    messages:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }]
})

export const Chat = mongoose.model("Chat", ChatSchema);