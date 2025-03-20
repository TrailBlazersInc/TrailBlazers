import mongoose from 'mongoose';
const {Schema} = mongoose;

export interface PUser {
  name: string, 
  email: string
}

export interface Location {
  latitude: number,
  longitude: number
}

export interface Availability {
  monday: boolean,
  tuesday: boolean,
  wednesday: boolean,
  thursday: boolean,
  friday: boolean,
  saturday: boolean,
  sunday: boolean
}

export interface IUser extends Document{
    _id: mongoose.Types.ObjectId,
    email: string,
    social_id: string,
    first_name: string,
    last_name: string,
    pace: number,
    distance: string,
    time: string,
    availability: Availability,
    loc: Location,
    banned: boolean,
    admin: boolean
  }

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
    loc: {
      latitude: Number,
      longitude: Number
    },
    banned: Boolean,
    admin: Boolean
})

export const User = mongoose.model<IUser>("User", UserSchema);