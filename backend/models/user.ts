import mongoose from 'mongoose';
const {Schema, Document} = mongoose;

export interface IUser  extends Document{
    _id: mongoose.Types.ObjectId,
    email: string,
    social_id: string,
    first_name: string,
    last_name: string,
    pace: number,
    distance: string,
    time: string,
    banned: Boolean
  };

const UserSchema = new Schema<IUser>({
    email: String,
    social_id: String,
    first_name: String,
    last_name: String,
    pace: Number,
    distance: String,
    time: String,
    banned: Boolean
})

export const User = mongoose.model<IUser>("User", UserSchema);