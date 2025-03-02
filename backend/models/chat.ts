import mongoose, {Schema, Document} from 'mongoose';

interface PMessage extends Document {
    _id: mongoose.Types.ObjectId,
    title: String,
    members: mongoose.Types.ObjectId[]
    messages: mongoose.Types.ObjectId[]
}


const ChatSchema = new Schema<PMessage>({
    title: String,
    members: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    messages:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }]
})

export const Chat = mongoose.model<PMessage>("Chat", ChatSchema);