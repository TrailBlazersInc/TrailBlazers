import mongoose from "mongoose";

export async function ConnectMongoDB() {
    mongoose.connect(process.env.DB_URI ?? "mongodb://localhost:27017/test").then(() =>{
        console.log("Mongo DB Models Connected");
    }).catch(err =>{
        console.error(err)
    })
}
