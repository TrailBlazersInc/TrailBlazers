import mongoose, {Schema, Document} from 'mongoose';

export interface PChat {
    id: string,
    title: string,
    members: number
} 


export interface IChat extends Document {
    _id: mongoose.Types.ObjectId,
    title: string,
    members: string[]
    messages: mongoose.Types.ObjectId[]
}

const ChatSchema = new Schema<IChat>({
    title: String,
    members: [ String ],
    messages:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }]
})

export const Chat = mongoose.model<IChat>("Chat", ChatSchema);