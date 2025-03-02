import mongoose from 'mongoose';
const {Schema} = mongoose;

export interface PMessage extends Document {
    _id: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema = new Schema<PMessage>({
    sender:  mongoose.Schema.Types.ObjectId,
    content: String,
}, { timestamps: true })

export const Message = mongoose.model<PMessage>('Message', MessageSchema);