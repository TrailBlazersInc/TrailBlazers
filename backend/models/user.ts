import mongoose from 'mongoose';
const {Schema} = mongoose;

const UserSchema = new Schema({
    username: String,
    isBanned: Boolean
})

export const User = mongoose.model("User", UserSchema);