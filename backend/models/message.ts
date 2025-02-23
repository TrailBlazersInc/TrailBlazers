import mongoose from 'mongoose';
const {Schema} = mongoose;

const MessageSchema = new Schema({
    sender: String,
    content: String,
    sendAt: {type:Date, default: Date.now}
})

export const Message = mongoose.model('Message', MessageSchema);