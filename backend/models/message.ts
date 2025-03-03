import mongoose from 'mongoose';
const {Schema} = mongoose;

export interface IMessage extends Document {
    _id: mongoose.Types.ObjectId;
    sender_email: String;
    sender_name: String;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
    sender_email: String,
    sender_name: String,
    content: String,
}, { timestamps: true })

export const Message = mongoose.model<IMessage>('Message', MessageSchema);