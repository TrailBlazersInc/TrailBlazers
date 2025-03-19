import mongoose from "mongoose";

export function ConnectMongoDB() {
    return mongoose.connect(process.env.DB_URI ?? "mongodb://localhost:27017/test")
}
