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
    availability: {
      monday: boolean,
      tuesday: boolean,
      wednesday: boolean,
      thursday: boolean,
      friday: boolean,
      saturday: boolean,
      sunday: boolean
    },
    banned: boolean,
    admin: boolean
  };

const UserSchema = new Schema<IUser>({
    email: String,
    social_id: String,
    first_name: String,
    last_name: String,
    pace: Number,
    distance: String,
    time: String,
    availability: {
      monday: Boolean,
      tuesday: Boolean,
      wednesday: Boolean,
      thursday: Boolean,
      friday: Boolean,
      saturday: Boolean,
      sunday: Boolean
    },
    banned: Boolean,
    admin: Boolean
})

export const User = mongoose.model<IUser>("User", UserSchema);