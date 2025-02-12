import { Request, Response, NextFunction } from "express";

export class MessagingControllers {
    async getChat(req: Request, res: Response, next: NextFunction){
        res.status(200).send('hello')
    }
}