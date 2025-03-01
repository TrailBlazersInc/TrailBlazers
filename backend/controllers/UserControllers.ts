import { Request, Response, NextFunction } from 'express';
import { client } from '../services';
import dotenv from 'dotenv';

export class UserController {
    async getUserData(req: Request, res: Response, next: NextFunction){
        let user = await client.db("test").collection("users").findOne({ email: req.params.email });
        res.status(200).json({ status: 'success', user });
    }
    async putUserData(req: Request, res: Response, next: NextFunction){
        try {
            const { distance, time, pace } = req.body;
            var newValues = { $set: {distance: distance, time: time, pace: pace } };
            var result = await client.db("test").collection("users").updateOne({ email: req.params.email }, newValues);
            if(!result.acknowledged || result.modifiedCount == 0){
                return res.status(404).json({ error: "User not found" });
            }
            else {
                res.status(200).json({ message: "User data updated successfully" });
            }
        } catch (error) {
            res.status(500).json({ status: 'error', error: 'Error Updating User' });
        }
    }
}