import mongoose from 'mongoose';
const {Schema} = mongoose;

export interface PMessage {
    id: string,
	sender_email: string,
	sender: string,
	content: string,
	date: string,
}

export interface IMessage extends Document {
    _id: mongoose.Types.ObjectId;
    sender_email: string;
    sender: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
    sender_email: String,
    sender: String,
    content: String,
}, { timestamps: true })

export const Message = mongoose.model<IMessage>('Message', MessageSchema);